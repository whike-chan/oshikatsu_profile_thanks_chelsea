# 推し活プロフィールメーカー ～Thanks, Chelsea!～

フォームへ入力した内容を、推し活プロフィール画像として保存できるブラウザアプリです。
入力内容と画像生成は端末内で完結し、外部サーバーへ送信しません。

## 開発

Node.js 22を使用します。

```bash
pnpm install
pnpm dev
```

## 確認

```bash
pnpm lint
pnpm typecheck
pnpm build
```

初回のみ、E2Eテスト用ブラウザをインストールします。

```bash
pnpm exec playwright install chromium
```

ユーザー操作を含む自動テストは次のコマンドで実行できます。

```bash
pnpm test:e2e
```

リリース前の確認をまとめて実行する場合は、次のコマンドを使います。

```bash
pnpm check
```

自動テストでは、画面表示とmeta情報、入力内容の端末内保存・復元、誕生日の入力制限、推し活タイプ、画像保存、入力内容の消去、X共有文を確認します。GitHubへのpushやPull Request時にも同じ確認が自動実行されます。

## 公開

静的サイトとして出力し、ChatGPT Sitesで公開しています。

## メンバー情報

モーニング娘。現役メンバーの候補は `app/profile-types.ts` で管理しています。2026年9月4日に公式サイトを確認した内容です。
