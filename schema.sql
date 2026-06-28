-- ============================================================================
-- HOME INVENTORY MANAGEMENT SYSTEM - DATABASE SCHEMA (PREFIXED)
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. MASTER TABLES
-- ============================================================================

-- Item Types (e.g. groceries, stationery, spices, masala, etc)
create table if not exists home_inventory_item_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    is_active boolean not null default true
);

-- Status Types (available, expired, consumed, open, purchased)
create table if not exists home_inventory_status_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique
);

-- Priority Types (low, medium, high, urgent)
create table if not exists home_inventory_priority_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique
);

-- ============================================================================
-- 2. MAIN TABLES
-- ============================================================================

-- Inventory Items Table
create table if not exists home_inventory_inventory_items (
    id uuid primary key default gen_random_uuid(),
    item_code text not null unique,
    item_name text not null,
    item_quantity numeric not null default 0 check (item_quantity >= 0),
    unit_type text not null check (unit_type in ('gm', 'kg', 'ml', 'ltr')),
    item_type_id uuid not null references home_inventory_item_types(id),
    status_id uuid not null references home_inventory_status_types(id),
    priority_id uuid not null references home_inventory_priority_types(id),
    
    updated_by uuid references auth.users(id) on delete set null,
    updated_on timestamp with time zone not null default now(),
    
    low_stock_threshold numeric not null default 0 check (low_stock_threshold >= 0),
    is_purchased boolean not null default false,
    notes text,
    is_active boolean not null default true,
    user_id uuid not null references auth.users(id) on delete cascade
);

-- Notifications Table
create table if not exists home_inventory_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    item_id uuid references home_inventory_inventory_items(id) on delete cascade,
    message text not null,
    is_read boolean not null default false,
    created_at timestamp with time zone not null default now()
);

-- User Settings Table
create table if not exists home_inventory_user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    phone_number text,
    notifications_enabled boolean not null default true,
    email_notifications_enabled boolean not null default false,
    updated_at timestamp with time zone not null default now()
);

-- Audit Logs Table
create table if not exists home_inventory_audit_logs (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null,
    item_code text not null,
    action text not null, -- 'CREATE', 'UPDATE', 'DELETE'
    changes jsonb,       -- stores before/after state
    performed_by uuid references auth.users(id) on delete set null,
    performed_at timestamp with time zone not null default now()
);

-- ============================================================================
-- 3. SEED INITIAL MASTER DATA
-- ============================================================================

insert into home_inventory_item_types (name, is_active) values
    ('groceries', true),
    ('meat', true),
    ('spices', true),
    ('masala', true),
    ('stationery', true),
    ('cleaning', true),
    ('beverages', true)
on conflict (name) do nothing;

insert into home_inventory_status_types (name) values
    ('available'),
    ('expired'),
    ('consumed'),
    ('open'),
    ('purchased')
on conflict (name) do nothing;

insert into home_inventory_priority_types (name) values
    ('low'),
    ('medium'),
    ('high'),
    ('urgent')
on conflict (name) do nothing;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table home_inventory_item_types enable row level security;
alter table home_inventory_status_types enable row level security;
alter table home_inventory_priority_types enable row level security;
alter table home_inventory_inventory_items enable row level security;
alter table home_inventory_notifications enable row level security;
alter table home_inventory_user_settings enable row level security;
alter table home_inventory_audit_logs enable row level security;

-- Policies for Master Tables (Viewable by all authenticated users)
create policy "Masters viewable by authenticated users" 
on home_inventory_item_types for select to authenticated using (true);

create policy "Statuses viewable by authenticated users" 
on home_inventory_status_types for select to authenticated using (true);

create policy "Priorities viewable by authenticated users" 
on home_inventory_priority_types for select to authenticated using (true);

-- Policies for Inventory Items (Read/Write owned by authenticated user)
create policy "Users can CRUD their own inventory items"
on home_inventory_inventory_items for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for Notifications
create policy "Users can CRUD their own notifications"
on home_inventory_notifications for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for User Settings
create policy "Users can CRUD their own settings"
on home_inventory_user_settings for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for Audit Logs
create policy "Users can read their own audit logs"
on home_inventory_audit_logs for select to authenticated
using (auth.uid() = performed_by);

-- ============================================================================
-- 5. DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to handle updating inventory timestamp and updated_by user
create or replace function handle_inventory_update_meta()
returns trigger as $$
begin
    new.updated_on = now();
    if auth.uid() is not null then
        new.updated_by = auth.uid();
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_inventory_meta_update
before update on home_inventory_inventory_items
for each row execute function handle_inventory_update_meta();


-- Function to automatically handle user settings creation when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.home_inventory_user_settings (user_id, phone_number, notifications_enabled, email_notifications_enabled)
  values (new.id, null, true, false)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;


-- Function to handle low stock notification automated creation
create or replace function handle_low_stock_notification()
returns trigger as $$
begin
    if new.item_quantity <= new.low_stock_threshold and new.is_active = true then
        if not exists (
            select 1 from home_inventory_notifications 
            where item_id = new.id and is_read = false
        ) then
            insert into home_inventory_notifications (user_id, item_id, message)
            values (
                new.user_id, 
                new.id, 
                'Low Stock Alert: "' || new.item_code || '" is at or below threshold (' || new.item_quantity || ' left).'
            );
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_low_stock_alert
after insert or update of item_quantity, low_stock_threshold, is_active on home_inventory_inventory_items
for each row execute function handle_low_stock_notification();


-- Function to handle audit logging of changes
create or replace function handle_audit_logging()
returns trigger as $$
declare
    old_data jsonb;
    new_data jsonb;
    action_type text;
    item_id_val uuid;
    item_code_val text;
    user_id_val uuid;
begin
    if tg_op = 'INSERT' then
        action_type := 'CREATE';
        item_id_val := new.id;
        item_code_val := new.item_code;
        user_id_val := new.user_id;
        new_data := to_jsonb(new) - 'user_id' - 'updated_by';
        insert into home_inventory_audit_logs (item_id, item_code, action, changes, performed_by)
        values (item_id_val, item_code_val, action_type, jsonb_build_object('new', new_data), user_id_val);
        
    elsif tg_op = 'UPDATE' then
        action_type := 'UPDATE';
        item_id_val := new.id;
        item_code_val := new.item_code;
        user_id_val := new.user_id;
        old_data := to_jsonb(old) - 'user_id' - 'updated_by';
        new_data := to_jsonb(new) - 'user_id' - 'updated_by';
        
        if old_data != new_data then
            insert into home_inventory_audit_logs (item_id, item_code, action, changes, performed_by)
            values (
                item_id_val, 
                item_code_val, 
                action_type, 
                jsonb_build_object('old', old_data, 'new', new_data), 
                user_id_val
            );
        end if;
        
    elsif tg_op = 'DELETE' then
        action_type := 'DELETE';
        item_id_val := old.id;
        item_code_val := old.item_code;
        user_id_val := old.user_id;
        old_data := to_jsonb(old) - 'user_id' - 'updated_by';
        insert into home_inventory_audit_logs (item_id, item_code, action, changes, performed_by)
        values (item_id_val, item_code_val, action_type, jsonb_build_object('old', old_data), user_id_val);
    end if;
    
    return null;
end;
$$ language plpgsql;

create trigger trigger_inventory_audit_log
after insert or update or delete on home_inventory_inventory_items
for each row execute function handle_audit_logging();
