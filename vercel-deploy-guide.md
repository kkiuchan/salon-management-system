# 美容室管理システム - Vercel デプロイガイド

## 🚀 デプロイ手順

### 1. GitHub リポジトリにプッシュ

```bash
git add .
git commit -m "美容室管理システム完成 - デプロイ準備"
git push origin main
```

### 2. Vercel でデプロイ

1. **[Vercel](https://vercel.com)** にアクセスしてログイン
2. **「New Project」**をクリック
3. **GitHub リポジトリを接続**
4. **プロジェクトを選択**
5. **「Deploy」**をクリック

### 3. 環境変数の設定

Vercel ダッシュボードで以下を設定：

**Project Settings** → **Environment Variables**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 再デプロイ

環境変数設定後：

1. **「Deployments」**タブ
2. 最新のデプロイの**「...」**メニュー
3. **「Redeploy」**をクリック

## ✅ デプロイ成功の確認

- ✅ ログイン機能が動作する
- ✅ 顧客管理機能が動作する
- ✅ 施術履歴が正常に表示される
- ✅ 画像アップロードが機能する

## 🔧 トラブルシューティング

### よくある問題と解決方法

1. **ログインできない**

   - 環境変数が正しく設定されているか確認
   - Supabase の認証設定を確認

2. **画像が表示されない**

   - Supabase Storage の公開設定を確認
   - next.config.ts の画像ドメイン設定を確認

3. **API エラーが発生する**
   - Supabase 接続設定を確認
   - RLS ポリシーが正しく設定されているか確認

## 📊 本番環境での設定

### Supabase 本番設定

1. **Row Level Security (RLS)** が有効になっていることを確認
2. **Storage Policies** が正しく設定されていることを確認
3. **認証設定** が本番環境に適していることを確認

### セキュリティ設定

- 本番環境では`SUPABASE_SERVICE_ROLE_KEY`の取り扱いに注意
- CORS 設定の確認
- SSL 証明書の確認（Vercel が自動で設定）

## 🌐 カスタムドメイン設定（オプション）

1. Vercel ダッシュボード → **「Domains」**
2. **「Add Domain」**をクリック
3. ドメイン名を入力
4. DNS 設定を更新

## 📈 本番運用のベストプラクティス

### 監視とログ

- Vercel の**Analytics**を有効化
- Supabase の**Logs**を定期的に確認
- エラー監視の設定

### バックアップ

- Supabase データの定期バックアップ
- 画像ファイルのバックアップ

### パフォーマンス

- 画像の最適化
- データベースクエリの最適化
- キャッシュ戦略の検討

## 🚀 デプロイ完了後のテスト項目

- [ ] ログイン/ログアウト
- [ ] 顧客の新規作成
- [ ] 顧客情報の編集
- [ ] 施術履歴の追加
- [ ] 画像のアップロード
- [ ] 画像の表示
- [ ] 検索機能
- [ ] モバイル表示の確認
