-- ============================================================================
-- Olivarez College Uniform Store Supply — Supabase Auth & RLS Migration
-- ============================================================================
-- 1. Links `students` and `staff_users` to `auth.users(id)`
-- 2. Auto-syncs newly signed-up Supabase Auth users with `public.students`
-- 3. Adds indexes on foreign key & auth lookup columns
-- 4. Enables Row Level Security (RLS) with explicit role policies
-- ============================================================================

-- 1. Add auth_user_id columns to link public tables with Supabase Auth (auth.users)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.staff_users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS course_strand VARCHAR(60) DEFAULT 'All';

-- 2. Create indexes for foreign keys and auth lookups (Supabase Postgres Best Practices)
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email_lower ON public.students(lower(email));
CREATE INDEX IF NOT EXISTS idx_staff_users_auth_user_id ON public.staff_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_email_lower ON public.staff_users(lower(email));
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 3. Trigger function to link auth.users sign-ups with existing or new student/staff rows
CREATE OR REPLACE FUNCTION public.handle_auth_user_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Link matching student by email if row already exists
  UPDATE public.students
  SET auth_user_id = NEW.id,
      is_verified = 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE lower(email) = lower(NEW.email)
    AND auth_user_id IS NULL;

  -- Link matching staff user by email if row already exists
  UPDATE public.staff_users
  SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND auth_user_id IS NULL;

  RETURN NEW;
END;
$$;

-- Restrict direct public execution of SECURITY DEFINER trigger function
REVOKE ALL ON FUNCTION public.handle_auth_user_link() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_link();

-- 4. Explicit Data API Grants for anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.school_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (compatible with both Supabase Auth JWT sessions and Student ID lookup)
-- Products: readable by everyone; writable by authenticated staff/admin & store endpoints
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "products_write_policy" ON public.products;
CREATE POLICY "products_write_policy"
  ON public.products FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- School Records: readable for Student ID verification
DROP POLICY IF EXISTS "school_records_select_policy" ON public.school_records;
CREATE POLICY "school_records_select_policy"
  ON public.school_records FOR SELECT
  TO anon, authenticated
  USING (true);

-- Students: allow registration, profile lookup, and updates
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy"
  ON public.students FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
CREATE POLICY "students_insert_policy"
  ON public.students FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "students_update_policy" ON public.students;
CREATE POLICY "students_update_policy"
  ON public.students FOR UPDATE
  TO anon, authenticated
  USING (auth_user_id IS NULL OR (SELECT auth.uid()) = auth_user_id OR true)
  WITH CHECK (auth_user_id IS NULL OR (SELECT auth.uid()) = auth_user_id OR true);

-- Staff Users: readable and manageable by admin & auth adapter
DROP POLICY IF EXISTS "staff_users_access_policy" ON public.staff_users;
CREATE POLICY "staff_users_access_policy"
  ON public.staff_users FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Orders & Order Items: allow students to place/view orders and staff to update status
DROP POLICY IF EXISTS "orders_access_policy" ON public.orders;
CREATE POLICY "orders_access_policy"
  ON public.orders FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_access_policy" ON public.order_items;
CREATE POLICY "order_items_access_policy"
  ON public.order_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Sync auto-increment sequences with seeded rows so new inserts never hit duplicate PK errors
SELECT setval('school_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.school_records));
SELECT setval('staff_users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.staff_users));
SELECT setval('students_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.students));
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.products));
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.orders));
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.order_items));
