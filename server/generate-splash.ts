import { ImageGenerationClient, Config } from 'coze-coding-dev-sdk';
import axios from 'axios';
import fs from 'fs';

async function generateSplash() {
  const config = new Config();
  const client = new ImageGenerationClient(config);

  const response = await client.generate({
    prompt: 'A clean minimalist mobile app splash screen with white background. In the center, a blue gradient circle icon with a white document/bid symbol inside, below the icon shows Chinese text "招采易" in bold blue color, simple modern design, professional business style, no borders, no frames, pure white background around, centered composition, high quality digital design',
    size: '1284x2778',
    watermark: false,
  });

  const helper = client.getResponseHelper(response);

  if (helper.success && helper.imageUrls[0]) {
    console.log('Image URL:', helper.imageUrls[0]);
    
    const imageData = await axios.get(helper.imageUrls[0], { responseType: 'arraybuffer' });
    fs.writeFileSync('/workspace/projects/client/assets/images/splash.png', imageData.data);
    console.log('Splash image saved!');
  } else {
    console.error('Generation failed:', helper.errorMessages);
  }
}

generateSplash().catch(console.error);
