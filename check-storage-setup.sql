-- Supabase Storage設定確認用SQL
-- これをSupabaseダッシュボードのSQL Editorで実行して設定を確認

-- 1. バケットの存在確認
SELECT * FROM storage.buckets WHERE name = 'treatment-images';

-- 2. 現在のStorage RLSポリシー確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. もしバケットが存在しない場合は作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('treatment-images', 'treatment-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']; 