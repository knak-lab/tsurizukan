# つりずかん React移行 実装依頼

## 目的
現状の単一HTMLプロトタイプ（`tsurizukan.html`）とモックアップ（`tsurizukan_mockup.html`）で
固めた仕様・デザインを、他アプリと同じ構成（React + Vite + Tailwind + GitHub Pages）に
移植し、今後の機能追加に耐えられる形にする。

## アーキテクチャ方針

- **フロントエンド**: React + Vite + Tailwind CSS
- **ホスティング**: GitHub Pages
- **データ保存**: 現段階は **localStorage のみ**（バックエンドなし、完全無料）
  - 将来、複数端末同期や販売時のユーザー分離が必要になったら **Firebase**（Firestore + Auth）へ移行する前提で設計する
  - GAS + Google Sheets 構成は今回は使わない（複数ユーザー分離ができないため）
- **リポジトリ名（案）**: `tsurizukan`（knak-labアカウント想定、他アプリと合わせる）

## 初期セットアップ

```bash
npm create vite@latest tsurizukan -- --template react
cd tsurizukan
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Tailwind設定は `frontend-design` の考え方に沿って、モックアップで使った
デザイントークン（ネイビー系背景、コーラル・ティール差し色、Zen Maru Gothic）を
`tailwind.config.js` にカスタムカラー・フォントとして登録する。

## 移植するデータ

1. **魚種マスターデータ（71種）**
   - `つりずかん_魚種リスト.md` の内容を `src/data/fishMaster.json`（または `.ts`）に変換
   - フィールド: `id, name, en, tax(fish/cephalo/crust), env(salt/brackish/fresh),
     rarity, sizeMin, sizeMax, illustration, tokuchou(特徴), miwake(見分け方),
     standard(標準サイズ), tsurikata(釣り方)`
   - `tokuchou/miwake/standard/tsurikata` の文章データは、これまでスズキ・キジハタ等
     サンプルで作った4項目構成をベースに、71種分をこのチャットで一緒に作成していく

2. **イラスト素材（71種、透過PNG）**
   - `illustration_pipeline/assets/fish/` の全PNGを `src/assets/fish/` にコピー
   - 各PNGのファイル名(`id_魚名.png`)と `fishMaster.json` の `id` を突き合わせて
     `illustration` フィールドに相対パスをセット

## 移植するUI（`tsurizukan_mockup.html`のロジックをReactコンポーネント化）

- `<FishCard />`: リボン型の名前タグ、クラスバッジ（ベビー/ひよっこ/おとな/ヌシ）、
  イラスト表示、サイズ範囲
- `<FilterTabs />`: 生息環境（すべて/海水/汽水/淡水）と分類（すべて/魚類/頭足類/甲殻類）の
  2段タブ、件数表示、AND条件での絞り込み
- `<FishDetailSheet />`: ボトムシート形式の詳細表示。クラス帯グラフ（今回の記録がどのクラスか）、
  特徴・見分け方・標準サイズ・釣り方の4セクション
- クラス判定ロジック（`classifyBySize`）は `src/utils/classify.ts` として関数化

## 状態管理（localStorage）

- `records`: ユーザーが記録した釣果データ（種ID、日時、サイズ、判定クラスなど）を配列で保存
- キー設計例: `tsurizukan:records`（JSON文字列としてlocalStorageに保存）
- 将来Firebase移行時に差し替えやすいよう、`src/services/storage.ts` のような
  抽象化レイヤーを挟み、コンポーネント側は直接localStorageを触らない設計にする
  （例: `saveRecord()`, `getRecords()`, `deleteRecord()` の関数だけを公開）

## 今回のセットアップでは実装しない（別途相談）

- 写真からの自動魚種判定（Claude API連携）
- 称号・ランク、レアリティ演出、自己ベスト更新演出などの「わくわく要素」
- 季節限定魚、地図記録、シェア対戦
- 甲殻類の追加種

これらは基本のCRUD（記録の追加・閲覧・図鑑表示）が動いてから順次追加する。

## 進め方

1. Claude Codeでプロジェクトを初期化
2. `fishMaster.json` の変換（このチャットで用意したリストを元に）
3. イラストアセットの配置
4. モックアップのUIをコンポーネント分割して移植
5. localStorageでの記録保存・図鑑コレクション判定を実装
6. ローカルで動作確認（`npm run dev`）
7. 問題なければGitHub Pagesへデプロイ設定
