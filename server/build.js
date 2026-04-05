import * as esbuild from 'esbuild';
import fs from 'fs';

try {
  // 编译为ESM格式（Docker容器支持完整Node.js环境）
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: ['node20'],
    format: 'esm',
    outdir: 'dist',
    external: [
      // 外部依赖（运行时安装）
      '@alicloud/nlp-automl20191111',
      '@alicloud/openapi-client',
      '@supabase/supabase-js',
      'axios',
      'cheerio',
      'cors',
      'coze-coding-dev-sdk',
      'dayjs',
      'dotenv',
      'drizzle-orm',
      'drizzle-zod',
      'express',
      'multer',
      'node-cron',
      'pg',
      'playwright',
      'playwright-extra',
      'puppeteer-core',
      'puppeteer-extra-plugin-stealth',
      'zod',
    ],
    banner: {
      js: `// Built for Docker Container Deployment
`,
    },
  });
  
  // 创建dist目录下的package.json
  const distPkg = {
    name: 'zcy-api',
    version: '1.0.0',
    main: 'index.js',
    type: 'module'
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));
  
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
