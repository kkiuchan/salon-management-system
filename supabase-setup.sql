-- 美容室管理システム用データベーススキーマ
-- 更新日: 2024年12月 (管理者システム対応版)

-- 顧客テーブル
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(50),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 施術テーブル
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    menu VARCHAR(255) NOT NULL,
    stylist_name VARCHAR(255) NOT NULL,
    price INTEGER,
    duration INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 施術画像テーブル
CREATE TABLE IF NOT EXISTS public.treatment_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 管理者テーブル（基本作成、詳細設定は setup-admin-system.sql で行う）
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_treatments_customer_id ON public.treatments(customer_id);
CREATE INDEX IF NOT EXISTS idx_treatments_date ON public.treatments(date);
CREATE INDEX IF NOT EXISTS idx_treatment_images_treatment_id ON public.treatment_images(treatment_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON public.admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- updated_at自動更新用の関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at 
    BEFORE UPDATE ON public.treatments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON public.admins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 有効化
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 基本RLSポリシー（管理者のみアクセス可能）
-- 注意: 詳細なポリシー設定は setup-admin-system.sql で行います

CREATE POLICY "管理者のみ顧客データにアクセス可能" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "管理者のみ施術データにアクセス可能" ON public.treatments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "管理者のみ施術画像にアクセス可能" ON public.treatment_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

-- 管理者テーブルの基本ポリシー
CREATE POLICY "管理者のみ管理者テーブルにアクセス可能" ON public.admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE auth_user_id = auth.uid() AND is_active = true
        )
    );

-- 空の管理者テーブルへの初回INSERT許可（初期セットアップ用）
CREATE POLICY "空のテーブルへの初回管理者登録を許可" ON public.admins
    FOR INSERT WITH CHECK (
        NOT EXISTS (SELECT 1 FROM public.admins)
    );

-- ストレージバケット作成
-- 注意: これはSupabaseダッシュボードで手動作成するか、ダッシュボードのSQLエディターで実行してください
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'treatment-images', 
    'treatment-images', 
    true, 
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
*/

-- サンプルデータ挿入（オプション）
-- 注意: 本番環境では削除してください
DO $$
BEGIN
    -- サンプル顧客データがまだ存在しない場合のみ挿入
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE email = 'tanaka@example.com') THEN
        INSERT INTO public.customers (name, gender, date_of_birth, phone, email, notes) VALUES
            ('田中花子', '女性', '1990-05-15', '090-1234-5678', 'tanaka@example.com', '初回来店時はカットのみ希望'),
            ('佐藤太郎', '男性', '1985-10-20', '080-9876-5432', 'sato@example.com', 'ビジネスマン、短時間での施術を希望'),
            ('山田美咲', '女性', '1992-03-08', '070-5555-1234', 'yamada@example.com', 'カラーリングとパーマの相談あり');
        
        -- サンプル施術データ
        INSERT INTO public.treatments (customer_id, date, menu, stylist_name, price, duration, notes)
        SELECT 
            c.id,
            CURRENT_DATE - INTERVAL '7 days',
            'カット',
            'スタイリストA',
            3000,
            60,
            'サンプル施術データ'
        FROM public.customers c 
        WHERE c.email = 'tanaka@example.com'
        LIMIT 1;
    END IF;
END $$;

-- セットアップ完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '美容室管理システム - データベース設定完了';
    RAISE NOTICE '============================================';
    RAISE NOTICE '次の手順:';
    RAISE NOTICE '1. setup-admin-system.sql を実行してください';
    RAISE NOTICE '2. Supabaseダッシュボードでストレージバケット "treatment-images" を作成してください';
    RAISE NOTICE '3. 初回管理者アカウントを作成してください';
    RAISE NOTICE '============================================';
END $$;