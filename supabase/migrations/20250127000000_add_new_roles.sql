-- Add marketing and admin_sales roles to user_role enum
ALTER TYPE public.user_role ADD VALUE 'marketing';
ALTER TYPE public.user_role ADD VALUE 'admin_sales';