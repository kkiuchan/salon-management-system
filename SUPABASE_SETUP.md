# 美容室管理システム - Supabase 設定ガイド

## 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下を記述：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 2. データベーステーブルの作成

Supabase ダッシュボードの「SQL Editor」で以下の SQL を実行：

```sql
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
```

## 3. サンプルデータの挿入（オプション）

テスト用のサンプルデータが必要な場合は以下を実行：

```sql
INSERT INTO public.customers (name, gender, date_of_birth, phone, email, notes) VALUES
    ('田中花子', '女性', '1990-05-15', '090-1234-5678', 'tanaka@example.com', '初回来店時はカットのみ希望'),
    ('佐藤太郎', '男性', '1985-10-20', '080-9876-5432', 'sato@example.com', 'ビジネスマン、短時間での施術を希望'),
    ('山田美咲', '女性', '1992-03-08', '070-5555-1234', 'yamada@example.com', 'カラーリングとパーマの相談あり');
```

## 4. Supabase Storage の設定

### 4.1 バケット作成

1. Supabase ダッシュボード → 「Storage」
2. 「Create bucket」をクリック
3. バケット名: `treatment-images`
4. 「Public bucket」のチェックを**オン**にする
5. 「Save」をクリック

### 4.2 ストレージポリシー設定

Storage → treatment-images → Configuration → Policies で以下を設定：

```sql
-- 認証されたユーザーは画像をアップロード可能
CREATE POLICY "認証されたユーザーは画像をアップロード可能" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'treatment-images'
    AND auth.role() = 'authenticated'
);

-- 誰でも画像を閲覧可能（公開画像として）
CREATE POLICY "誰でも画像を閲覧可能" ON storage.objects
FOR SELECT USING (bucket_id = 'treatment-images');

-- 認証されたユーザーは画像を削除可能
CREATE POLICY "認証されたユーザーは画像を削除可能" ON storage.objects
FOR DELETE USING (
    bucket_id = 'treatment-images'
    AND auth.role() = 'authenticated'
);
```

## 5. 認証設定

### 5.1 Email 認証の有効化

1. Supabase ダッシュボード → 「Authentication」 → 「Settings」
2. 「Email」タブで以下を確認：
   - 「Enable email confirmations」: オフ（開発時）
   - 「Enable email invites」: お好みで設定

### 5.2 テストユーザー作成

1. 「Authentication」 → 「Users」 → 「Add user」
2. メールアドレスとパスワードを入力
3. 「Auto Confirm User」にチェック
4. 「Create user」をクリック

## 6. 実行手順

1. 上記の設定を全て完了
2. プロジェクトルートで以下のコマンドを実行：

```bash
npm install
npm run dev
```

3. ブラウザで `http://localhost:3000` にアクセス
4. 作成したテストユーザーでログイン
5. 顧客管理システムを使用開始

## トラブルシューティング

### よくある問題と解決方法

1. **ログインできない**

   - 環境変数が正しく設定されているか確認
   - Supabase プロジェクトのステータスを確認
   - ユーザーが作成されているか確認

2. **画像アップロードエラー**

   - Storage バケットが作成されているか確認
   - バケットが公開設定になっているか確認
   - ストレージポリシーが正しく設定されているか確認

3. **データが表示されない**

   - RLS ポリシーが正しく設定されているか確認
   - テーブルが正しく作成されているか確認

4. **API 接続エラー**
   - 環境変数の URL とキーが正しいか確認
   - ネットワーク接続を確認
