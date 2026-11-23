import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
// モデル制作用ページ（GLB書き出し・プレビュー）。ゲーム本体のビルドとは別。
export default defineConfig({
  root: 'lab', plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  resolve: { alias: { '/src': new URL('./src', import.meta.url).pathname } },
  build: { outDir: '../dist-lab', emptyOutDir: true, target: 'es2020', chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 }
});
