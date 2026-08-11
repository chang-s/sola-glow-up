with expected_tables(table_name) as (
	values
		('habits'),
		('habit_schedules'),
		('habit_entries'),
		('routine_groups'),
		('routine_steps'),
		('routine_step_entries')
),
table_access as (
	select
		e.table_name,
		c.relrowsecurity as rls_enabled,
		has_table_privilege('anon', format('public.%I', e.table_name), 'select') as anon_select,
		has_table_privilege('anon', format('public.%I', e.table_name), 'insert') as anon_insert,
		has_table_privilege('anon', format('public.%I', e.table_name), 'update') as anon_update,
		has_table_privilege('anon', format('public.%I', e.table_name), 'delete') as anon_delete,
		has_table_privilege('authenticated', format('public.%I', e.table_name), 'select') as auth_select,
		has_table_privilege('authenticated', format('public.%I', e.table_name), 'insert') as auth_insert,
		has_table_privilege('authenticated', format('public.%I', e.table_name), 'update') as auth_update,
		has_table_privilege('authenticated', format('public.%I', e.table_name), 'delete') as auth_delete
	from expected_tables e
	join pg_class c on c.relname = e.table_name
	join pg_namespace n on n.oid = c.relnamespace
		and n.nspname = 'public'
),
policy_counts as (
	select
		tablename as table_name,
		count(*) filter (where cmd = 'SELECT' and roles::text[] = array['authenticated']) as select_policies,
		count(*) filter (where cmd = 'INSERT' and roles::text[] = array['authenticated']) as insert_policies,
		count(*) filter (where cmd = 'UPDATE' and roles::text[] = array['authenticated']) as update_policies,
		count(*) as total_policies
	from pg_policies
	where schemaname = 'public'
		and tablename in (select table_name from expected_tables)
	group by tablename
),
trigger_counts as (
	select
		event_object_table as table_name,
		count(distinct trigger_name) filter (where trigger_name like 'set_%_updated_at') as updated_at_triggers,
		count(distinct trigger_name) filter (where trigger_name = 'prevent_linked_routine_step_entries') as linked_step_guard_triggers
	from information_schema.triggers
	where event_object_schema = 'public'
		and event_object_table in (select table_name from expected_tables)
	group by event_object_table
),
expected_constraints(name) as (
	values
		('habits_tracking_type_check'),
		('habits_time_group_check'),
		('habits_target_value_positive_check'),
		('habits_date_range_check'),
		('habits_archived_inactive_check'),
		('habits_id_user_id_unique'),
		('habit_schedules_habit_user_fk'),
		('habit_schedules_id_user_id_unique'),
		('habit_schedules_type_check'),
		('habit_schedules_date_range_check'),
		('habit_schedules_weekdays_values_check'),
		('habit_schedules_shape_check'),
		('habit_entries_habit_user_fk'),
		('habit_entries_numeric_nonnegative_check'),
		('habit_entries_duration_nonnegative_check'),
		('habit_entries_quantity_nonnegative_check'),
		('habit_entries_source_check'),
		('routine_groups_time_group_check'),
		('routine_groups_archived_inactive_check'),
		('routine_groups_id_user_id_unique'),
		('routine_steps_group_user_fk'),
		('routine_steps_habit_user_fk'),
		('routine_steps_archived_inactive_check'),
		('routine_steps_id_user_id_unique'),
		('routine_step_entries_step_user_fk'),
		('routine_step_entries_source_check')
),
expected_indexes(name) as (
	values
		('habits_user_active_name_unique'),
		('habits_user_active_display_idx'),
		('habits_user_category_idx'),
		('habit_schedules_one_current_per_habit_unique'),
		('habit_schedules_user_habit_start_idx'),
		('habit_schedules_user_type_idx'),
		('habit_entries_one_active_per_habit_date_unique'),
		('habit_entries_user_entry_date_idx'),
		('habit_entries_habit_entry_date_idx'),
		('routine_groups_user_active_name_unique'),
		('routine_groups_user_active_display_idx'),
		('routine_steps_group_active_name_unique'),
		('routine_steps_group_active_display_idx'),
		('routine_steps_user_linked_habit_idx'),
		('routine_step_entries_one_active_per_step_date_unique'),
		('routine_step_entries_user_entry_date_idx'),
		('routine_step_entries_step_entry_date_idx')
)
select
	'all six milestone 1 tables exist' as check_name,
	count(*) = 6 as passed,
	count(*)::text || ' tables found' as details
from table_access
union all
select
	'table access: ' || table_name as check_name,
	(
		rls_enabled
		and not anon_select
		and not anon_insert
		and not anon_update
		and not anon_delete
		and auth_select
		and auth_insert
		and auth_update
		and not auth_delete
	) as passed,
	concat(
		'rls=', rls_enabled,
		', anon=', anon_select, '/', anon_insert, '/', anon_update, '/', anon_delete,
		', authenticated=', auth_select, '/', auth_insert, '/', auth_update, '/', auth_delete
	) as details
from table_access
union all
select
	'policies: ' || e.table_name,
	coalesce(p.select_policies, 0) = 1
		and coalesce(p.insert_policies, 0) = 1
		and coalesce(p.update_policies, 0) = 1
		and coalesce(p.total_policies, 0) = 3,
	coalesce(p.total_policies, 0)::text || ' authenticated policies'
from expected_tables e
left join policy_counts p using (table_name)
union all
select
	'updated_at trigger: ' || e.table_name,
	coalesce(t.updated_at_triggers, 0) = 1,
	coalesce(t.updated_at_triggers, 0)::text || ' updated_at triggers'
from expected_tables e
left join trigger_counts t using (table_name)
union all
select
	'linked routine step trigger',
	coalesce(max(t.linked_step_guard_triggers), 0) = 1,
	coalesce(max(t.linked_step_guard_triggers), 0)::text || ' guard triggers'
from trigger_counts t
where t.table_name = 'routine_step_entries'
union all
select
	'constraint: ' || e.name,
	c.conname is not null,
	coalesce(c.contype::text, 'missing')
from expected_constraints e
left join pg_constraint c on c.conname = e.name
union all
select
	'index: ' || e.name,
	i.indexname is not null,
	case when i.indexname is null then 'missing' else 'present' end
from expected_indexes e
left join pg_indexes i on i.schemaname = 'public'
	and i.indexname = e.name
order by check_name;
