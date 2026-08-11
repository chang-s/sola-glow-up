begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', '443fd1ed-6aca-4f54-9436-09a44d330550', true);

create temp table verification_results (
	check_name text,
	passed boolean,
	details text
) on commit drop;

do $$
declare
	own_profile_id uuid;
	h_id uuid;
	second_h_id uuid;
	rg_id uuid;
	unlinked_step_id uuid;
	linked_step_id uuid;
	visible_count integer;
	failed_as_expected boolean;
begin
	insert into public.profiles (auth_user_id, display_name)
	values ('443fd1ed-6aca-4f54-9436-09a44d330550', 'Milestone 1 verification')
	returning id into own_profile_id;

	insert into public.habits (
		user_id,
		name,
		category,
		tracking_type,
		target_value,
		target_unit,
		time_group,
		start_date
	)
	values (
		own_profile_id,
		'Farsi',
		'growth',
		'duration',
		20,
		'minutes',
		'evening',
		'2026-08-10'
	)
	returning id into h_id;

	select count(*) into visible_count
	from public.habits
	where id = h_id;

	insert into verification_results
	values ('owner can insert/select own habit', visible_count = 1, 'visible rows: ' || visible_count);

	perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);

	select count(*) into visible_count
	from public.habits
	where id = h_id;

	insert into verification_results
	values ('different auth identity cannot select habit', visible_count = 0, 'visible rows: ' || visible_count);

	failed_as_expected := false;
	begin
		insert into public.habits (user_id, name, category, tracking_type, start_date)
		values (own_profile_id, 'Cross User Habit', 'growth', 'checkbox', '2026-08-10');
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('different auth identity cannot insert for owner profile', failed_as_expected, 'RLS insert rejection');

	perform set_config('request.jwt.claim.sub', '443fd1ed-6aca-4f54-9436-09a44d330550', true);

	insert into public.habit_schedules (
		user_id,
		habit_id,
		schedule_type,
		interval_days,
		anchor_date,
		start_date
	)
	values (own_profile_id, h_id, 'every_x_days', 2, '2026-08-10', '2026-08-10');

	insert into verification_results
	values ('valid anchored every_x_days schedule accepted', true, 'interval 2 anchored 2026-08-10');

	failed_as_expected := false;
	begin
		insert into public.habit_schedules (
			user_id,
			habit_id,
			schedule_type,
			start_date
		)
		values (own_profile_id, h_id, 'daily', '2026-08-11');
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('one unarchived schedule per habit enforced', failed_as_expected, 'duplicate current schedule rejected');

	insert into public.habits (user_id, name, category, tracking_type, start_date)
	values (own_profile_id, 'Piano', 'growth', 'duration', '2026-08-10')
	returning id into second_h_id;

	failed_as_expected := false;
	begin
		insert into public.habit_schedules (
			user_id,
			habit_id,
			schedule_type,
			times_per_week,
			start_date
		)
		values (own_profile_id, second_h_id, 'daily', 3, '2026-08-10');
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('invalid daily schedule fields rejected', failed_as_expected, 'daily plus times_per_week rejected');

	failed_as_expected := false;
	begin
		insert into public.habit_schedules (
			user_id,
			habit_id,
			schedule_type,
			interval_days,
			start_date
		)
		values (own_profile_id, second_h_id, 'every_x_days', 2, '2026-08-10');
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('every_x_days missing anchor rejected', failed_as_expected, 'missing anchor_date rejected');

	insert into public.habit_entries (
		user_id,
		habit_id,
		entry_date,
		completed,
		value_duration_minutes
	)
	values (own_profile_id, h_id, '2026-08-10', true, 20);

	failed_as_expected := false;
	begin
		insert into public.habit_entries (
			user_id,
			habit_id,
			entry_date,
			completed,
			value_duration_minutes
		)
		values (own_profile_id, h_id, '2026-08-10', true, 25);
	exception when unique_violation then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('duplicate active habit entry rejected', failed_as_expected, 'habit/date unique active entry');

	update public.habit_entries
	set deleted_at = now()
	where habit_id = h_id
		and entry_date = '2026-08-10';

	insert into public.habit_entries (
		user_id,
		habit_id,
		entry_date,
		completed,
		value_duration_minutes
	)
	values (own_profile_id, h_id, '2026-08-10', true, 25);

	insert into verification_results
	values ('soft-deleted habit entry allows replacement', true, 'replacement active row inserted');

	insert into public.routine_groups (user_id, name, category, time_group)
	values (own_profile_id, 'PM Skincare', 'beauty', 'evening')
	returning id into rg_id;

	insert into public.routine_steps (user_id, routine_group_id, name)
	values (own_profile_id, rg_id, 'Cleanser')
	returning id into unlinked_step_id;

	insert into public.routine_step_entries (user_id, routine_step_id, entry_date, completed)
	values (own_profile_id, unlinked_step_id, '2026-08-10', true);

	failed_as_expected := false;
	begin
		insert into public.routine_step_entries (user_id, routine_step_id, entry_date, completed)
		values (own_profile_id, unlinked_step_id, '2026-08-10', true);
	exception when unique_violation then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('duplicate active routine step entry rejected', failed_as_expected, 'routine step/date unique active entry');

	update public.routine_step_entries
	set deleted_at = now()
	where routine_step_id = unlinked_step_id
		and entry_date = '2026-08-10';

	insert into public.routine_step_entries (user_id, routine_step_id, entry_date, completed)
	values (own_profile_id, unlinked_step_id, '2026-08-10', true);

	insert into verification_results
	values ('soft-deleted routine step entry allows replacement', true, 'replacement active row inserted');

	insert into public.routine_steps (user_id, routine_group_id, linked_habit_id, name)
	values (own_profile_id, rg_id, h_id, 'Farsi linked step')
	returning id into linked_step_id;

	failed_as_expected := false;
	begin
		insert into public.routine_step_entries (user_id, routine_step_id, entry_date, completed)
		values (own_profile_id, linked_step_id, '2026-08-10', true);
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('linked routine step rejects routine_step_entries', failed_as_expected, 'linked steps use habit_entries');

	failed_as_expected := false;
	begin
		insert into public.routine_steps (user_id, routine_group_id, linked_habit_id, name)
		values (gen_random_uuid(), rg_id, h_id, 'Mismatched ownership step');
	exception when others then
		failed_as_expected := true;
	end;

	insert into verification_results
	values ('cross-user composite ownership relationship rejected', failed_as_expected, 'mismatched user_id relationship rejected');
end $$;

select *
from verification_results
order by check_name;

rollback;
