CREATE POLICY "Users can upload own deposit proof" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deposit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own deposit proof" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deposit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all deposit proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deposit-proofs' AND public.is_admin(auth.uid()));