DROP POLICY IF EXISTS "Profiles visible to signed-in users" ON public.profiles;
CREATE POLICY "Profiles visible to self, order partners and admins" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (select auth.uid())
  OR (select public.has_role((select auth.uid()), 'admin'))
  OR id IN (select creator_id from public.orders where editor_user_id = (select auth.uid()))
  OR id IN (select editor_user_id from public.orders where creator_id = (select auth.uid()))
);