-- 美容室管理システム用データベーススキーマ

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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_treatments_customer_id ON public.treatments(customer_id);
CREATE INDEX IF NOT EXISTS idx_treatments_date ON public.treatments(date);
CREATE INDEX IF NOT EXISTS idx_treatment_images_treatment_id ON public.treatment_images(treatment_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);

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

-- Row Level Security (RLS) 有効化
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_images ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（認証されたユーザーのみアクセス可能）
CREATE POLICY "認証されたユーザーは顧客を操作可能" ON public.customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "認証されたユーザーは施術を操作可能" ON public.treatments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "認証されたユーザーは施術画像を操作可能" ON public.treatment_images
    FOR ALL USING (auth.role() = 'authenticated');

-- サンプルデータ挿入（オプション）
INSERT INTO public.customers (name, gender, date_of_birth, phone, email, notes) VALUES
    ('田中花子', '女性', '1990-05-15', '090-1234-5678', 'tanaka@example.com', '初回来店時はカットのみ希望'),
    ('佐藤太郎', '男性', '1985-10-20', '080-9876-5432', 'sato@example.com', 'ビジネスマン、短時間での施術を希望'),
    ('山田美咲', '女性', '1992-03-08', '070-5555-1234', 'yamada@example.com', 'カラーリングとパーマの相談あり')
ON CONFLICT (id) DO NOTHING;