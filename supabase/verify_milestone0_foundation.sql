begin;

create temp table verification_results (
	check_name text,
	passed boolean,
	details text
) on commit drop;

insert into verification_results
select
	'public.profiles table exists',
	to_regclass('public.profiles') is not null,
	coalesce(to_regclass('public.profiles')::text, 'missing');

insert into verification_results
select
	'profiles update trigger exists',
	exists (
		select 1
		from pg_trigger
		where tgname = 'set_profiles_updated_at'
			and tgrelid = 'public.profiles'::regclass
			and not tgisinternal
	),
	'set_profiles_updated_at';

insert into verification_results
select
	'profiles RLS enabled',
	relrowsecurity,
	'public.profiles'
from pg_class
where oid = 'public.profiles'::regclass;

insert into verification_results
select
	'three expected owner-only policies exist',
	count(*) = 3,
	coalesce(
		string_agg(policyname || ' / ' || cmd || ' / ' || roles::text, '; ' order by policyname),
		'no matching policies'
	)
from pg_policies
where schemaname = 'public'
	and tablename = 'profiles'
	and policyname in (
		'Users can read their own profile',
		'Users can insert their own profile',
		'Users can update their own profile'
	)
	and roles = '{authenticated}';

insert into verification_results
select
	'no delete policy exists',
	not exists (
		select 1
		from pg_policies
		where schemaname = 'public'
			and tablename = 'profiles'
			and cmd = 'DELETE'
	),
	'DELETE policies on public.profiles';

do $$
declare
	test_user_id uuid;
	other_user_id uuid := gen_random_uuid();
	visible_count integer;
	changed_count integer;
	own_profile_preexisted boolean;
begin
	select id into test_user_id
	from auth.users
	order by created_at desc
	limit 1;

	if test_user_id is null then
		insert into verification_results
		values ('auth user available for RLS verification', false, 'No rows found in auth.users');
		return;
	end if;

	insert into verification_results
	values ('auth user available for RLS verification', true, test_user_id::text);

	select exists (
		select 1 from public.profiles where auth_user_id = test_user_id
	) into own_profile_preexisted;

	execute 'set local role authenticated';
	perform set_config('request.jwt.claim.sub', test_user_id::text, true);

	if own_profile_preexisted then
		insert into verification_results
		values (
			'authenticated user can insert own profile',
			null,
			'skipped because this auth user already has a profile'
		);
	else
		insert into public.profiles (auth_user_id, display_name)
		values (test_user_id, 'RLS verification profile');

		get diagnostics changed_count = row_count;

		insert into verification_results
		values (
			'authenticated user can insert own profile',
			changed_count = 1,
			'inserted rows: ' || changed_count
		);
	end if;

	select count(*) into visible_count
	from public.profiles
	where auth_user_id = test_user_id;

	insert into verification_results
	values (
		'authenticated user can select own profile',
		visible_count = 1,
		'visible rows: ' || visible_count
	);

	update public.profiles
	set display_name = 'RLS verification updated'
	where auth_user_id = test_user_id;

	get diagnostics changed_count = row_count;

	insert into verification_results
	values (
		'authenticated user can update own profile',
		changed_count = 1,
		'updated rows: ' || changed_count
	);

	perform set_config('request.jwt.claim.sub', other_user_id::text, true);

	select count(*) into visible_count
	from public.profiles
	where auth_user_id = test_user_id;

	insert into verification_results
	values (
		'different authenticated user cannot select profile',
		visible_count = 0,
		'visible rows: ' || visible_count
	);

	update public.profiles
	set display_name = 'should not update'
	where auth_user_id = test_user_id;

	get diagnostics changed_count = row_count;

	insert into verification_results
	values (
		'different authenticated user cannot update profile',
		changed_count = 0,
		'updated rows: ' || changed_count
	);

	execute 'set local role anon';
	perform set_config('request.jwt.claim.sub', '', true);

	select count(*) into visible_count
	from public.profiles;

	insert into verification_results
	values (
		'anonymous access sees no profiles',
		visible_count = 0,
		'visible rows: ' || visible_count
	);

	execute 'reset role';
end $$;

select *
from verification_results
order by check_name;

rollback;
