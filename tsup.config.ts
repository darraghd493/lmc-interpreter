import { defineConfig } from 'tsup'
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  plugins: [
    TsconfigPathsPlugin({
      tsconfig: './tsconfig.json',
    }),
  ],
})
