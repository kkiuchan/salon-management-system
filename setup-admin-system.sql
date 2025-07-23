-- 管理者テーブルの作成
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLSを有効化
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 管理者のみが管理者テーブルにアクセス可能
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can insert new admins" ON public.admins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can update admin info" ON public.admins
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can delete admins" ON public.admins
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

-- 既存のcustomersやtreatmentsテーブルのポリシーを管理者ベースに更新
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.treatments;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.treatment_images;

-- 管理者のみアクセス可能なポリシーに変更
CREATE POLICY "Admins can manage customers" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage treatments" ON public.treatments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage treatment images" ON public.treatment_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 最初の管理者を作成（現在ログインしているユーザー）
-- 注意: 実際の運用では手動で実行してください
-- INSERT INTO public.admins (auth_user_id, email, name, role)
-- SELECT auth.uid(), auth.email(), 'システム管理者', 'super_admin'
-- WHERE NOT EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()); 