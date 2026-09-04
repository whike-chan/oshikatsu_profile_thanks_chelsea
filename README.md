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

静的サイトとして出力し、次の2か所で公開しています。

- [ChatGPT Sites版](https://oshikatsu-profile-thanks-chelsea.pekomaro1001.chatgpt.site/)
- [GitHub Pages版](https://whike-chan.github.io/oshikatsu_profile_thanks_chelsea/)

GitHub Pages版は、`main` ブランチへpushするとGitHub Actionsでテストとビルドを実行し、問題がなければ自動的に公開されます。GitHubのActions画面から `Deploy to GitHub Pages` を手動実行して再公開することもできます。

ChatGPT Sites版はGitHub Pagesとは別に、同じアカウントのWeb版ChatGPTまたはデスクトップアプリから公開・管理します。

## メンバー情報

モーニング娘。現役メンバーの候補は `app/profile-types.ts` で管理しています。2026年9月4日に公式サイトを確認した内容です。
