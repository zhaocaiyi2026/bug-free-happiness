import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useSegments, useRootNavigationState, useRouter, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, ActivityIndicator, View } from 'react-native';
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

    // 判断是否在公开页面（不需要登录）
    const publicRoutes = ['login', 'register', 'agreement', 'privacy'];
    const inPublicRoute = segments.some(s => publicRoutes.includes(s));

    console.log('[AuthGuard] isAuthenticated:', isAuthenticated, 'inPublicRoute:', inPublicRoute, 'segments:', segments);

    // 未登录保护：未登录且不在公开页面 → 跳转登录页
    if (!isAuthenticated && !inPublicRoute) {
      console.log('[AuthGuard] Redirecting to login');
      router.replace('/login');
    }

    // 已登录保护：已登录但在登录页或注册页 → 跳转首页
    const authRoutes = ['login', 'register'];
    const inAuthRoute = segments.some(s => authRoutes.includes(s));
    if (isAuthenticated && inAuthRoute) {
      console.log('[AuthGuard] Redirecting to home');
      router.replace('/');
    }
  }, [rootState?.key, isAuthenticated, isLoading, segments, router]);

  // 加载中显示loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

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
              <Stack.Screen name="agreement" options={{ title: "用户协议" }} />
              <Stack.Screen name="privacy" options={{ title: "隐私政策" }} />
              <Stack.Screen name="register" options={{ title: "注册" }} />
              <Stack.Screen name="filter-select" options={{ title: "选择筛选" }} />
              <Stack.Screen name="potential-customers" options={{ title: "潜在客户" }} />
              <Stack.Screen name="message-list" options={{ title: "消息列表" }} />
            </Stack>
          </AuthGuard>
          <Toast />
        </GestureHandlerRootView>
      </ColorSchemeProvider>
    </AuthProvider>
  );
}
