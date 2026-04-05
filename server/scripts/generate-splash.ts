import { generateImage } from 'coze-coding-dev-sdk';

async function main() {
  try {
    console.log('正在生成启动画面...');
    
    const result = await generateImage({
      prompt: `A clean, professional mobile app splash screen design for "招采易" (a Chinese government procurement and bidding information platform). 
      
Design requirements:
- Pure white background (#FFFFFF)
- Center composition with no phone frame
- A modern 3D-style blue icon representing bidding/procurement (like a gavel, document, or abstract geometric shape)
- Brand name "招采易" in elegant Chinese typography below the icon
- Subtitle text "专业招标采购管理软件" in smaller gray text
- Minimalist, clean, corporate style
- Suitable for a business-to-government (B2G) platform
- The icon should be in shades of blue (#2563EB primary blue)
- No gradients on background, just pure white
- Modern, professional, trustworthy feeling`,
      width: 1280,
      height: 1920,
    });

    console.log('生成成功！');
    console.log('图片URL:', result.imageUrl);
    
    // 下载图片
    const response = await fetch(result.imageUrl);
    const buffer = await response.arrayBuffer();
    const fs = await import('fs');
    fs.writeFileSync('/workspace/projects/client/assets/images/splash.png', Buffer.from(buffer));
    console.log('图片已保存到 /workspace/projects/client/assets/images/splash.png');
    
  } catch (error) {
    console.error('生成失败:', error);
    process.exit(1);
  }
}

main();
