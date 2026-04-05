import * as esbuild from 'esbuild';
import fs from 'fs';

try {
  // 编译为CommonJS格式，target设为Node.js 18
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: ['node18'],
    format: 'cjs',
    outfile: 'dist/index.js',
    banner: {
      js: `// Built for Alibaba Cloud FC Node.js 18
`,
    },
  });
  
  // 创建dist目录下的package.json，指定为CommonJS
  const distPkg = {
    name: 'zcy-api-dist',
    version: '1.0.0',
    main: 'index.js',
    type: 'commonjs'
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));
  
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
