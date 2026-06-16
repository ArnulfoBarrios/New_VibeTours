-- Clean up PQRS table - remove duplicate/legacy message column
-- Keep only: id, user_id, kind, subject, body, status, admin_response, responded_by, responded_at, created_at, updated_at

alter table public.pqrs drop column if exists message;

-- Verify final structure
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'pqrs'
order by ordinal_position;
