-- Supabase Storageのポリシー修正
-- これをSupabaseダッシュボードのSQL Editorで実行してください

-- 既存のポリシーを削除（エラーが出ても気にしない）
DROP POLICY IF EXISTS "認証されたユーザーは画像をアップロード可能" ON storage.objects;
DROP POLICY IF EXISTS "誰でも画像を閲覧可能" ON storage.objects;  
DROP POLICY IF EXISTS "認証されたユーザーは画像を削除可能" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON storage.objects;

-- 新しいポリシーを作成
CREATE POLICY "Enable insert for authenticated users only" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'treatment-images');

CREATE POLICY "Enable select for all users" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'treatment-images');

CREATE POLICY "Enable delete for authenticated users only" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'treatment-images');

CREATE POLICY "Enable update for authenticated users only" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'treatment-images')
WITH CHECK (bucket_id = 'treatment-images'); 