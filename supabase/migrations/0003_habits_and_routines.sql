-- Milestone 1 universal habits and routines.
-- Non-destructive: creates new tables, constraints, indexes, triggers, grants, and RLS policies only.

create table public.habits (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	name text not null,
	description text,
	category text not null,
	icon text,
	tracking_type text not null,
	target_value numeric,
	target_unit text,
	time_group text not null default 'anytime',
	start_date date not null default current_date,
	end_date date,
	active boolean not null default true,
	include_in_glow_score boolean not null default true,
	display_order integer not null default 0,
	archived_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint habits_tracking_type_check
		check (tracking_type in ('checkbox', 'numeric', 'duration', 'quantity')),
	constraint habits_time_group_check
		check (time_group in ('morning', 'afternoon', 'evening', 'anytime')),
	constraint habits_target_value_positive_check
		check (target_value is null or target_value > 0),
	constraint habits_date_range_check
		check (end_date is null or end_date >= start_date),
	constraint habits_archived_inactive_check
		check (archived_at is null or active = false),
	constraint habits_id_user_id_unique
		unique (id, user_id)
);

create unique index habits_user_active_name_unique
	on public.habits (user_id, lower(name))
	where archived_at is null;

create index habits_user_active_display_idx
	on public.habits (user_id, active, display_order);

create index habits_user_category_idx
	on public.habits (user_id, category);

create trigger set_habits_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

create table public.habit_schedules (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	habit_id uuid not null,
	schedule_type text not null,
	weekdays smallint[],
	times_per_week integer,
	times_per_month integer,
	interval_days integer,
	anchor_date date,
	start_date date not null,
	end_date date,
	archived_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint habit_schedules_habit_user_fk
		foreign key (habit_id, user_id)
		references public.habits(id, user_id)
		on delete cascade,
	constraint habit_schedules_id_user_id_unique
		unique (id, user_id),
	constraint habit_schedules_type_check
		check (schedule_type in (
			'daily',
			'weekdays',
			'times_per_week',
			'times_per_month',
			'every_x_days',
			'optional'
		)),
	constraint habit_schedules_date_range_check
		check (end_date is null or end_date >= start_date),
	constraint habit_schedules_weekdays_values_check
		check (
			weekdays is null
			or (
				cardinality(weekdays) between 1 and 7
				and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
			)
		),
	constraint habit_schedules_shape_check
		check (
			(
				schedule_type = 'daily'
				and weekdays is null
				and times_per_week is null
				and times_per_month is null
				and interval_days is null
				and anchor_date is null
			)
			or (
				schedule_type = 'weekdays'
				and weekdays is not null
				and times_per_week is null
				and times_per_month is null
				and interval_days is null
				and anchor_date is null
			)
			or (
				schedule_type = 'times_per_week'
				and weekdays is null
				and times_per_week is not null
				and times_per_week between 1 and 7
				and times_per_month is null
				and interval_days is null
				and anchor_date is null
			)
			or (
				schedule_type = 'times_per_month'
				and weekdays is null
				and times_per_week is null
				and times_per_month is not null
				and times_per_month between 1 and 31
				and interval_days is null
				and anchor_date is null
			)
			or (
				schedule_type = 'every_x_days'
				and weekdays is null
				and times_per_week is null
				and times_per_month is null
				and interval_days is not null
				and interval_days > 0
				and anchor_date is not null
			)
			or (
				schedule_type = 'optional'
				and weekdays is null
				and times_per_week is null
				and times_per_month is null
				and interval_days is null
				and anchor_date is null
			)
		)
);

-- Keep V1 simple: one unarchived schedule definition per habit. If the schedule changes,
-- archive/end-date the old row and create a replacement.
create unique index habit_schedules_one_current_per_habit_unique
	on public.habit_schedules (habit_id)
	where archived_at is null;

create index habit_schedules_user_habit_start_idx
	on public.habit_schedules (user_id, habit_id, start_date);

create index habit_schedules_user_type_idx
	on public.habit_schedules (user_id, schedule_type);

create trigger set_habit_schedules_updated_at
before update on public.habit_schedules
for each row
execute function public.set_updated_at();

create table public.habit_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	habit_id uuid not null,
	entry_date date not null,
	completed boolean not null default false,
	value_numeric numeric,
	value_duration_minutes integer,
	value_quantity numeric,
	notes text,
	source text not null default 'manual',
	deleted_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint habit_entries_habit_user_fk
		foreign key (habit_id, user_id)
		references public.habits(id, user_id)
		on delete cascade,
	constraint habit_entries_numeric_nonnegative_check
		check (value_numeric is null or value_numeric >= 0),
	constraint habit_entries_duration_nonnegative_check
		check (value_duration_minutes is null or value_duration_minutes >= 0),
	constraint habit_entries_quantity_nonnegative_check
		check (value_quantity is null or value_quantity >= 0),
	constraint habit_entries_source_check
		check (source in ('manual', 'routine_check_all', 'routine_step', 'backfill'))
);

create unique index habit_entries_one_active_per_habit_date_unique
	on public.habit_entries (habit_id, entry_date)
	where deleted_at is null;

create index habit_entries_user_entry_date_idx
	on public.habit_entries (user_id, entry_date);

create index habit_entries_habit_entry_date_idx
	on public.habit_entries (habit_id, entry_date);

create trigger set_habit_entries_updated_at
before update on public.habit_entries
for each row
execute function public.set_updated_at();

create table public.routine_groups (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	name text not null,
	category text,
	time_group text not null default 'anytime',
	display_order integer not null default 0,
	active boolean not null default true,
	archived_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint routine_groups_time_group_check
		check (time_group in ('morning', 'afternoon', 'evening', 'anytime')),
	constraint routine_groups_archived_inactive_check
		check (archived_at is null or active = false),
	constraint routine_groups_id_user_id_unique
		unique (id, user_id)
);

create unique index routine_groups_user_active_name_unique
	on public.routine_groups (user_id, lower(name))
	where archived_at is null;

create index routine_groups_user_active_display_idx
	on public.routine_groups (user_id, active, time_group, display_order);

create trigger set_routine_groups_updated_at
before update on public.routine_groups
for each row
execute function public.set_updated_at();

create table public.routine_steps (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	routine_group_id uuid not null,
	linked_habit_id uuid,
	name text not null,
	display_order integer not null default 0,
	active boolean not null default true,
	archived_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint routine_steps_group_user_fk
		foreign key (routine_group_id, user_id)
		references public.routine_groups(id, user_id)
		on delete cascade,
	constraint routine_steps_habit_user_fk
		foreign key (linked_habit_id, user_id)
		references public.habits(id, user_id)
		on delete set null (linked_habit_id),
	constraint routine_steps_archived_inactive_check
		check (archived_at is null or active = false),
	constraint routine_steps_id_user_id_unique
		unique (id, user_id)
);

create unique index routine_steps_group_active_name_unique
	on public.routine_steps (routine_group_id, lower(name))
	where archived_at is null;

create index routine_steps_group_active_display_idx
	on public.routine_steps (routine_group_id, active, display_order);

create index routine_steps_user_linked_habit_idx
	on public.routine_steps (user_id, linked_habit_id)
	where linked_habit_id is not null;

create trigger set_routine_steps_updated_at
before update on public.routine_steps
for each row
execute function public.set_updated_at();

create table public.routine_step_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	routine_step_id uuid not null,
	entry_date date not null,
	completed boolean not null default false,
	notes text,
	source text not null default 'manual',
	deleted_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	constraint routine_step_entries_step_user_fk
		foreign key (routine_step_id, user_id)
		references public.routine_steps(id, user_id)
		on delete cascade,
	constraint routine_step_entries_source_check
		check (source in ('manual', 'routine_check_all', 'backfill'))
);

create unique index routine_step_entries_one_active_per_step_date_unique
	on public.routine_step_entries (routine_step_id, entry_date)
	where deleted_at is null;

create index routine_step_entries_user_entry_date_idx
	on public.routine_step_entries (user_id, entry_date);

create index routine_step_entries_step_entry_date_idx
	on public.routine_step_entries (routine_step_id, entry_date);

create trigger set_routine_step_entries_updated_at
before update on public.routine_step_entries
for each row
execute function public.set_updated_at();

create or replace function public.prevent_linked_routine_step_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if exists (
		select 1
		from public.routine_steps
		where id = new.routine_step_id
			and user_id = new.user_id
			and linked_habit_id is not null
	) then
		raise exception 'Linked routine steps must use habit_entries for completion';
	end if;

	return new;
end;
$$;

create trigger prevent_linked_routine_step_entries
before insert or update on public.routine_step_entries
for each row
execute function public.prevent_linked_routine_step_entries();

alter table public.habits enable row level security;
alter table public.habit_schedules enable row level security;
alter table public.habit_entries enable row level security;
alter table public.routine_groups enable row level security;
alter table public.routine_steps enable row level security;
alter table public.routine_step_entries enable row level security;

create policy "Users can read their own habits"
on public.habits
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habits.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own habits"
on public.habits
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = habits.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own habits"
on public.habits
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habits.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = habits.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own habit schedules"
on public.habit_schedules
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habit_schedules.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own habit schedules"
on public.habit_schedules
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = habit_schedules.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own habit schedules"
on public.habit_schedules
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habit_schedules.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = habit_schedules.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own habit entries"
on public.habit_entries
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habit_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own habit entries"
on public.habit_entries
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = habit_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own habit entries"
on public.habit_entries
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = habit_entries.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = habit_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own routine groups"
on public.routine_groups
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_groups.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own routine groups"
on public.routine_groups
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_groups.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own routine groups"
on public.routine_groups
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_groups.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_groups.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own routine steps"
on public.routine_steps
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_steps.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own routine steps"
on public.routine_steps
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_steps.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own routine steps"
on public.routine_steps
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_steps.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_steps.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can read their own routine step entries"
on public.routine_step_entries
for select
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_step_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can insert their own routine step entries"
on public.routine_step_entries
for insert
to authenticated
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_step_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

create policy "Users can update their own routine step entries"
on public.routine_step_entries
for update
to authenticated
using (exists (
	select 1 from public.profiles
	where profiles.id = routine_step_entries.user_id
		and profiles.auth_user_id = auth.uid()
))
with check (exists (
	select 1 from public.profiles
	where profiles.id = routine_step_entries.user_id
		and profiles.auth_user_id = auth.uid()
));

revoke all on table public.habits from anon;
revoke all on table public.habit_schedules from anon;
revoke all on table public.habit_entries from anon;
revoke all on table public.routine_groups from anon;
revoke all on table public.routine_steps from anon;
revoke all on table public.routine_step_entries from anon;

revoke all on table public.habits from authenticated;
revoke all on table public.habit_schedules from authenticated;
revoke all on table public.habit_entries from authenticated;
revoke all on table public.routine_groups from authenticated;
revoke all on table public.routine_steps from authenticated;
revoke all on table public.routine_step_entries from authenticated;

grant select, insert, update on table public.habits to authenticated;
grant select, insert, update on table public.habit_schedules to authenticated;
grant select, insert, update on table public.habit_entries to authenticated;
grant select, insert, update on table public.routine_groups to authenticated;
grant select, insert, update on table public.routine_steps to authenticated;
grant select, insert, update on table public.routine_step_entries to authenticated;
