# 美容室管理システム (Salon Management System)

> 🌟 **美容室・サロン向けの包括的な顧客・施術管理システム**  
> 顧客情報管理、施術履歴記録、画像管理、QR コード受付、データエクスポートまで対応

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Ready-green.svg)

## 📋 目次

- [✨ 特徴](#-特徴)
- [🛠️ 技術スタック](#️-技術スタック)
- [🚀 主要機能](#-主要機能)
- [📦 セットアップ手順](#-セットアップ手順)
- [🔧 Supabase 設定](#-supabase設定)
- [☁️ Vercel デプロイ](#️-vercel-デプロイ)
- [💻 使用方法](#-使用方法)
- [📱 QR コード機能](#-qrコード機能)
- [📊 データエクスポート](#-データエクスポート)
- [🔐 管理者システム](#-管理者システム)
- [🎯 トラブルシューティング](#-トラブルシューティング)

## ✨ 特徴

- **📱 完全レスポンシブ** - スマホ・タブレット・PC 対応
- **🔐 セキュア認証** - Supabase Auth + 管理者システム
- **📊 データエクスポート** - CSV・JSON 形式での一括バックアップ
- **📱 QR コード受付** - 顧客自己情報入力システム
- **🖼️ 画像管理** - 施術前後の写真アップロード・管理
- **🎨 モダン UI** - shadcn/ui + Tailwind CSS による美しいデザイン
- **⚡ 高速** - Next.js 15 + Supabase による高パフォーマンス

## 🛠️ 技術スタック

### **フロントエンド**

- **[Next.js 15](https://nextjs.org/)** - React フレームワーク
- **[TypeScript](https://www.typescriptlang.org/)** - 型安全な開発
- **[Tailwind CSS](https://tailwindcss.com/)** - ユーティリティファースト CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - 美しい UI コンポーネント
- **[Lucide React](https://lucide.dev/)** - アイコンライブラリ

### **バックエンド**

- **[Supabase](https://supabase.com/)** - PostgreSQL + 認証 + ストレージ
- **[Supabase Storage](https://supabase.com/storage)** - 画像ファイル管理
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - データベースセキュリティ

### **デプロイメント**

- **[Vercel](https://vercel.com/)** - フロントエンドホスティング
- **[GitHub](https://github.com/)** - ソースコード管理

### **その他**

- **[react-qr-code](https://www.npmjs.com/package/react-qr-code)** - QR コード生成
- **[zod](https://zod.dev/)** - スキーマ検証
- **[react-hook-form](https://react-hook-form.com/)** - フォーム管理

## 🚀 主要機能

### **👥 顧客管理**

- 顧客基本情報の登録・編集・削除
- 検索・フィルタリング機能
- ページネーション対応

### **💇 施術履歴管理**

- 施術記録の作成・編集・削除
- 施術画像のアップロード・管理
- 料金・時間・スタイリスト情報管理

### **📱 QR コード受付システム**

- 新規顧客用 QR コード生成
- 顧客自己情報入力ページ
- 印刷機能付き QR コード管理

### **📊 データエクスポート**

- 全データ一括 CSV/JSON エクスポート
- 個別顧客データエクスポート
- Excel 対応（BOM 付き CSV）

### **🔐 管理者システム**

- 複数管理者対応

## 📦 セットアップ手順

### **1. リポジトリのクローン**

```bash
git clone https://github.com/yourusername/salon-management-system.git
cd salon-management-system
```

### **2. パッケージインストール**

```bash
npm install
# または
yarn install
```

### **3. 環境変数設定**

`.env.local` ファイルを作成し、以下を記述：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **4. 開発サーバー起動**

```bash
npm run dev
```

http://localhost:3000 でアクセス

## 🔧 Supabase 設定

### **1. Supabase プロジェクト作成**

1. [Supabase](https://supabase.com/) にアクセス
2. **"New project"** をクリック
3. プロジェクト名・データベースパスワードを設定
4. **"Create new project"** をクリック

### **2. データベーステーブル作成**

Supabase ダッシュボードの **SQL Editor** で `supabase-setup.sql` を実行

```sql
-- 📁 supabase-setup.sql の内容を実行
-- 顧客、施術、施術画像、管理者テーブルが作成されます
```

### **3. Row Level Security 設定**

`setup-admin-system.sql` を実行して管理者システムを設定

```sql
-- 📁 setup-admin-system.sql の内容を実行
-- 管理者認証とRLSポリシーが設定されます
```

### **4. ストレージ設定**

1. **Storage** セクションで **"Create bucket"**
2. バケット名: `treatment-images`
3. **Public bucket** にチェック
4. **Create bucket** をクリック

### **5. Authentication（認証）設定**

#### **5-1. 基本認証設定**

1. **Authentication** → **Settings** → **General**
2. 以下の項目を設定：

```
Site URL: https://yourdomain.vercel.app
Additional Redirect URLs:
  https://yourdomain.vercel.app/login
  http://localhost:3000/login (開発用)
```

#### **5-2. セキュリティ設定**

1. **Authentication** → **Settings** → **Auth**
2. 推奨設定：

```
Enable email confirmations: OFF（システムで自動確認）
Enable phone confirmations: OFF
Minimum password length: 8
Password requirements:
  ✅ Require uppercase letters
  ✅ Require lowercase letters
  ✅ Require numbers
Session timeout: 24 hours
```

**注意**: このシステムは管理者が直接アカウント作成するため、メール招待機能は使用しません。

### **6. 初回管理者アカウント作成**

⚠️ **重要**: 最初の管理者作成は以下の手順で行ってください。

#### **手順 1: Supabase Auth でユーザー作成**

1. **Authentication** → **Users** → **"Add user"**
2. メールアドレス・パスワードを入力
3. **"Auto Confirm User"** にチェック
4. **"Create user"** をクリック

#### **手順 2: システムで管理者登録**

1. 作成したアカウントでシステムにログイン（`/login`）
2. ダッシュボードで **"管理者として登録"** ボタンをクリック
3. 管理者テーブルに自動登録完了

**注意**:

- 最初の管理者は自動的に **super_admin** 権限が付与されます
- 2 人目以降の管理者は既存管理者が作成できます

### **7. 環境変数取得**

**Settings** → **API** から以下をコピー：

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## ☁️ Vercel デプロイ

### **1. GitHub リポジトリ作成**

```bash
git add .
git commit -m "初期コミット"
git branch -M main
git remote add origin https://github.com/yourusername/salon-management-system.git
git push -u origin main
```

### **2. Vercel プロジェクト作成**

1. [Vercel](https://vercel.com/) にアクセス
2. **"New Project"** をクリック
3. GitHub リポジトリをインポート
4. **"Deploy"** をクリック

### **3. 環境変数設定**

Vercel ダッシュボード → **Settings** → **Environment Variables**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **4. 再デプロイ**

環境変数設定後、**Deployments** → **Redeploy**

## 💻 使用方法

### **🔐 初回ログイン**

⚠️ **最初の管理者作成は 2 ステップで行います**：

#### **ステップ 1: Supabase でユーザー作成**

1. Supabase ダッシュボード → **Authentication** → **Users**
2. **"Add user"** で管理者アカウント作成
3. **"Auto Confirm User"** にチェック ✅

#### **ステップ 2: システムで管理者登録**

1. 作成したアカウントでシステムにログイン
2. ダッシュボード画面で **"管理者として登録"** ボタンをクリック
3. 自動的に **super_admin** として登録完了 🎉

**これで美容室管理システムが使用開始できます！**

### **👥 顧客管理**

#### **新規顧客追加**

1. **"新規顧客追加"** ボタンをクリック
2. 基本情報を入力
3. **"追加"** をクリック

#### **顧客情報編集**

1. 顧客カードをクリック
2. **編集ボタン（✏️）** をクリック
3. 情報を更新して **"更新"** をクリック

### **💇 施術履歴管理**

#### **施術記録追加**

1. 顧客詳細ページの **"施術追加"** をクリック
2. 施術情報を入力
3. **"追加"** をクリック

#### **施術画像アップロード**

1. 施術履歴から **"画像追加"** をクリック
2. 画像ファイルを選択
3. 自動でアップロード完了

## 📱 QR コード機能

### **QR コード設置手順**

1. **ダッシュボード** → **"顧客 QR コード"** タブ
2. **"印刷用表示"** ボタンをクリック
3. QR コードを印刷して受付に設置

### **顧客側の使用方法**

1. QR コードをスマホで読み取り
2. `/customer-register` ページが開く
3. 基本情報を入力
4. **"登録する"** をクリック
5. 完了画面が表示

### **管理者による確認**

新規登録された顧客は：

- ダッシュボードの顧客一覧に自動追加
- 備考欄に **"【顧客入力】"** と表示

## 📊 データエクスポート

### **全データエクスポート**

1. **ダッシュボード** → **"データエクスポート"** タブ
2. **"CSV 形式"** または **"JSON 形式"** を選択
3. 自動でダウンロード開始

### **個別顧客エクスポート**

#### **方法 1: ダッシュボードから**

1. **"データエクスポート"** タブ
2. **顧客を選択** ドロップダウン
3. **"CSV"** または **"JSON"** ボタン

#### **方法 2: 顧客詳細ページから**

1. 顧客詳細ページの **ダウンロードボタン（⬇️）**
2. **"CSV 形式"** または **"JSON 形式"** を選択

### **エクスポートファイル形式**

#### **CSV 形式の列**

- 顧客 ID、名前、性別、生年月日
- 電話番号、メールアドレス、備考
- 施術 ID、施術日、施術内容、スタイリスト名
- 料金、施術時間、施術備考、画像 URL

#### **JSON 形式**

```json
{
  "id": "customer_id",
  "name": "顧客名",
  "treatments": [
    {
      "id": "treatment_id",
      "date": "2024-01-01",
      "menu": "カット",
      "treatment_images": [...]
    }
  ]
}
```

## 🔐 管理者システム

### **管理者追加**

1. **ダッシュボード** → **"管理者管理"** タブ
2. **"新規管理者追加"** をクリック
3. 基本情報を入力：
   - **名前**：管理者の表示名
   - **メールアドレス**：ログイン用メール
   - **パスワード**：ログイン用パスワード（8 文字以上推奨）
   - **役割**：admin または super_admin
4. **"追加"** をクリック

**注意**: 新しい管理者は即座にログイン可能になります。メール確認は不要です。

### **パスワード管理**

このシステムでは **Supabase Auth** でパスワードを管理：

1. **管理者追加時**：システムが直接アカウント作成（パスワード指定）
2. **パスワード変更**：管理者が個別に Supabase で変更
3. **ログイン認証**：メール・パスワードによる標準認証

**注意**: メール招待やパスワードリセット機能は実装していません。パスワード管理は Supabase ダッシュボードから行ってください。

## 🎯 トラブルシューティング

### **よくある問題**

#### **❌ 「認証が必要です」エラー**

**原因**: 管理者として登録されていない  
**解決策**: ダッシュボードで「管理者として登録」ボタンをクリック

#### **❌ 画像アップロードエラー**

**原因**: Supabase ストレージの設定不備  
**解決策**:

1. `treatment-images` バケットが作成されているか確認
2. パブリックアクセスが有効か確認

#### **❌ データベース接続エラー**

**原因**: 環境変数の設定ミス  
**解決策**: `.env.local` の値を再確認

#### **❌ Vercel デプロイエラー**

**原因**: 環境変数が Vercel に設定されていない  
**解決策**: Vercel ダッシュボードで環境変数を設定

### **デバッグ方法**

```bash
# 開発サーバーでのエラー確認
npm run dev

# ビルドエラーの確認
npm run build

# 型チェック
npx tsc --noEmit
```

### **サポート**

問題が解決しない場合：

1. [Issues](https://github.com/yourusername/salon-management-system/issues) を確認
2. 新しい Issue を作成
3. エラーメッセージと実行環境を記載

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🤝 貢献

プルリクエストや Issue はいつでも歓迎です！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 サポート

**美容室管理システム**についてご質問がありましたら、お気軽にお問い合わせください。

---

**⭐ このプロジェクトが役に立ったら、ぜひスターをお願いします！**
