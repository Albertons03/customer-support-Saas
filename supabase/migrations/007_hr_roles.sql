-- =====================================================
-- HR Module: 007 — extend user_role enum
-- (Must be a separate migration: ALTER TYPE ... ADD VALUE
--  cannot be used in the same transaction as queries that
--  reference the new value.)
-- =====================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr_manager';
