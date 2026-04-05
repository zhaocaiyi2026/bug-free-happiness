import * as esbuild from 'esbuild';
import fs from 'fs';

try {
  // 编译精简版为CommonJS格式
  await esbuild.build({
    entryPoints: ['src/index-lite.ts'],
    bundle: true,
    platform: 'node',
    target: ['node18'],
    format: 'cjs',
    outfile: 'dist/index-lite.js',
    external: [
      // 这些依赖需要运行时安装，但都是轻量级的
      '@supabase/supabase-js',
      'express',
      'cors',
      'axios',
      'dayjs',
      'dotenv',
      'serverless-http',
      'zod',
    ],
    banner: {
      js: `// Built for Alibaba Cloud FC - Lite Mode (No Playwright)
`,
    },
  });
  
  // 创建dist目录下的package.json
  const distPkg = {
    name: 'zcy-api-lite',
    version: '1.0.0',
    main: 'index-lite.js',
    type: 'commonjs'
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));
  
  // 复制node_modules到dist目录（只包含必要依赖）
  console.log('⚡ Build complete (lite mode)!');
  console.log('📦 Note: Run "pnpm install --prod" in dist/ before deployment');
} catch (e) {
  console.error(e);
  process.exit(1);
}
