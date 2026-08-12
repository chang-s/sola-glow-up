-- V0.5 daily tracker.
-- Non-destructive: creates dedicated V0.5 tables, indexes, triggers, grants, RLS policies, and a private Storage bucket.

create table public.v05_daily_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	entry_date date not null,
	weight numeric,
	steps integer,
	sleep_duration_minutes integer,
	bedtime time,
	wake_time time,
	previous_day_calories integer,
	worked_out boolean not null default false,
	workout_activity_type text,
	workout_duration_minutes integer,
	notes text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint v05_daily_entries_user_entry_date_unique
		unique (user_id, entry_date),
	constraint v05_daily_entries_weight_positive_check
		check (weight is null or weight > 0),
	constraint v05_daily_entries_steps_nonnegative_check
		check (steps is null or steps >= 0),
	constraint v05_daily_entries_sleep_duration_nonnegative_check
		check (sleep_duration_minutes is null or sleep_duration_minutes >= 0),
	constraint v05_daily_entries_previous_day_calories_nonnegative_check
		check (previous_day_calories is null or previous_day_calories >= 0),
	constraint v05_daily_entries_workout_duration_nonnegative_check
		check (workout_duration_minutes is null or workout_duration_minutes >= 0),
	constraint v05_daily_entries_workout_details_check
		check (
			worked_out
			or (
				workout_activity_type is null
				and workout_duration_minutes is null
			)
		)
);

create index v05_daily_entries_user_entry_date_idx
	on public.v05_daily_entries (user_id, entry_date desc);

create trigger set_v05_daily_entries_updated_at
before update on public.v05_daily_entries
for each row
execute function public.set_updated_at();

create table public.v05_checklist_completions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	entry_date date not null,
	item_key text not null,
	completed boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint v05_checklist_completions_user_date_item_unique
		unique (user_id, entry_date, item_key),
	constraint v05_checklist_completions_daily_entry_fk
		foreign key (user_id, entry_date)
		references public.v05_daily_entries(user_id, entry_date)
		on delete cascade,
	constraint v05_checklist_completions_item_key_check
		check (item_key in (
			'morning_skincare',
			'evening_skincare',
			'vitamins',
			'minoxidil',
			'workout',
			'iron',
			'irestore_helmet',
			'irestore_mask'
		))
);

-- Application behavior: before inserting checklist completions or food photo metadata,
-- upsert the canonical v05_daily_entries row for that user/date. This preserves a clear
-- tracking-start boundary without weakening the dependent-row foreign keys below.

create index v05_checklist_completions_user_entry_date_idx
	on public.v05_checklist_completions (user_id, entry_date desc);

create trigger set_v05_checklist_completions_updated_at
before update on public.v05_checklist_completions
for each row
execute function public.set_updated_at();

create table public.v05_food_photos (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	entry_date date not null,
	storage_path text not null,
	meal_type text,
	note text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	constraint v05_food_photos_storage_path_unique
		unique (storage_path),
	constraint v05_food_photos_storage_path_not_blank_check
		check (length(btrim(storage_path)) > 0),
	constraint v05_food_photos_storage_path_shape_check
		check (storage_path like user_id::text || '/' || entry_date::text || '/%'),
	constraint v05_food_photos_daily_entry_fk
		foreign key (user_id, entry_date)
		references public.v05_daily_entries(user_id, entry_date)
		on delete cascade
);

create index v05_food_photos_user_entry_date_idx
	on public.v05_food_photos (user_id, entry_date desc)
	where deleted_at is null;

create trigger set_v05_food_photos_updated_at
before update on public.v05_food_photos
for each row
execute function public.set_updated_at();

alter table public.v05_daily_entries enable row level security;
alter table public.v05_checklist_completions enable row level security;
alter table public.v05_food_photos enable row level security;

create policy "Users can read their own V0.5 daily entries"
on public.v05_daily_entries
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_daily_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own V0.5 daily entries"
on public.v05_daily_entries
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_daily_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own V0.5 daily entries"
on public.v05_daily_entries
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_daily_entries.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_daily_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own V0.5 checklist completions"
on public.v05_checklist_completions
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_checklist_completions.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own V0.5 checklist completions"
on public.v05_checklist_completions
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_checklist_completions.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own V0.5 checklist completions"
on public.v05_checklist_completions
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_checklist_completions.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_checklist_completions.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own V0.5 food photos"
on public.v05_food_photos
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_food_photos.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own V0.5 food photos"
on public.v05_food_photos
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_food_photos.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own V0.5 food photos"
on public.v05_food_photos
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = v05_food_photos.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = v05_food_photos.user_id
		and profiles.auth_user_id = auth.uid()
));

revoke all on table public.v05_daily_entries from anon;
revoke all on table public.v05_checklist_completions from anon;
revoke all on table public.v05_food_photos from anon;

revoke all on table public.v05_daily_entries from authenticated;
revoke all on table public.v05_checklist_completions from authenticated;
revoke all on table public.v05_food_photos from authenticated;

grant select, insert, update on table public.v05_daily_entries to authenticated;
grant select, insert, update on table public.v05_checklist_completions to authenticated;
grant select, insert, update on table public.v05_food_photos to authenticated;

insert into storage.buckets (
	id,
	name,
	public,
	file_size_limit,
	allowed_mime_types
)
values (
	'v05-food-photos',
	'v05-food-photos',
	false,
	52428800,
	array[
		'image/jpeg',
		'image/png',
		'image/webp',
		'image/heic',
		'image/heif'
	]
)
on conflict (id) do update
set
	public = false,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own V0.5 food photo objects"
on storage.objects
for select
to authenticated
using (
	bucket_id = 'v05-food-photos'
	and exists (
		select 1 from public.profiles
		where profiles.auth_user_id = auth.uid()
			and profiles.id::text = (storage.foldername(storage.objects.name))[1]
	)
);

create policy "Users can upload their own V0.5 food photo objects"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'v05-food-photos'
	and exists (
		select 1 from public.profiles
		where profiles.auth_user_id = auth.uid()
			and profiles.id::text = (storage.foldername(storage.objects.name))[1]
	)
);

create policy "Users can update their own V0.5 food photo objects"
on storage.objects
for update
to authenticated
using (
	bucket_id = 'v05-food-photos'
	and exists (
		select 1 from public.profiles
		where profiles.auth_user_id = auth.uid()
			and profiles.id::text = (storage.foldername(storage.objects.name))[1]
	)
)
with check (
	bucket_id = 'v05-food-photos'
	and exists (
		select 1 from public.profiles
		where profiles.auth_user_id = auth.uid()
			and profiles.id::text = (storage.foldername(storage.objects.name))[1]
	)
);

create policy "Users can delete their own V0.5 food photo objects"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'v05-food-photos'
	and exists (
		select 1 from public.profiles
		where profiles.auth_user_id = auth.uid()
			and profiles.id::text = (storage.foldername(storage.objects.name))[1]
	)
);
