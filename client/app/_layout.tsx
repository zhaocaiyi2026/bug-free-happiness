import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useSegments, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ColorSchemeProvider } from '@/hooks/useColorScheme';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

// 认证重定向组件
function AuthGuard({ children }: { children: React.ReactNode }) {
  const rootState = useRootNavigationState();
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // 导航未挂载或鉴权正在加载中，直接返回
    if (!rootState?.key || isLoading) return;

    // 判断是否在登录页
    const inLoginRoute = segments.includes('login');

    // 未登录保护：未登录且不在登录页 → 跳转登录页
    if (!isAuthenticated && !inLoginRoute) {
      router.replace('/login');
    }

    // 已登录保护：已登录但在登录页 → 跳转首页
    if (isAuthenticated && inLoginRoute) {
      router.replace('/');
    }
  }, [rootState?.key, isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ColorSchemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark"></StatusBar>
          <AuthGuard>
            <Stack screenOptions={{
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              headerShown: false
            }}>
              <Stack.Screen name="(tabs)" options={{ title: "" }} />
              <Stack.Screen name="login" options={{ title: "登录" }} />
              <Stack.Screen name="detail" options={{ title: "招标详情" }} />
              <Stack.Screen name="win-bid-detail" options={{ title: "中标详情" }} />
              <Stack.Screen name="bidList" options={{ title: "招标列表" }} />
              <Stack.Screen name="search" options={{ title: "搜索" }} />
              <Stack.Screen name="favorites" options={{ title: "我的收藏" }} />
              <Stack.Screen name="history" options={{ title: "浏览历史" }} />
              <Stack.Screen name="subscribe" options={{ title: "订阅管理" }} />
              <Stack.Screen name="settings" options={{ title: "设置" }} />
              <Stack.Screen name="feedback" options={{ title: "意见反馈" }} />
            </Stack>
          </AuthGuard>
          <Toast />
        </GestureHandlerRootView>
      </ColorSchemeProvider>
    </AuthProvider>
  );
}
