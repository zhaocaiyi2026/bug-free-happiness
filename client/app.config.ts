import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = '招采易';  // 固定应用名称
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'myapp';

// 后端API地址：优先使用环境变量，否则使用默认值
const backendBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://127.0.0.1:9091';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": `com.anonymous.x${projectId || '0'}`
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "extra": {
      expoPublicBackendBaseUrl: backendBaseUrl,
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 300,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许招采易App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许招采易App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许招采易App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "招采易App需要访问您的位置以提供周边服务及导航功能。",
          "isAndroidBackgroundLocationEnabled": false
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `招采易App需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `招采易App需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
