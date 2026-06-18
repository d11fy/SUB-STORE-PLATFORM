-- Saba Store — Platform Admin Role
-- Idempotent script to add 'platform_admin' to user_role ENUM

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_admin';
