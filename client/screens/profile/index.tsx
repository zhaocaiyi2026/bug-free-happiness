import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  vip_level: number;
  vip_expire_at: string | null;
  points: number;
}

const VIP_LEVELS = ['普通会员', '青铜会员', '白银会员', '黄金会员', '钻石会员'];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [user, setUser] = useState<User | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // 模拟用户ID
      const userId = 1;

      // 获取用户信息
      const loginRes = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '13800138000' }),
        }
      );
      const loginData = await loginRes.json();

      if (loginData.success) {
        setUser(loginData.data);
      }

      // 获取收藏数量
      const favRes = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites?userId=${userId}&pageSize=1`
      );
      const favData = await favRes.json();

      if (favData.success) {
        setFavoriteCount(favData.data.total);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = (menu: string) => {
    switch (menu) {
      case 'favorites':
        Alert.alert('提示', '收藏列表功能开发中');
        break;
      case 'reminders':
        Alert.alert('提示', '竞标提醒功能开发中');
        break;
      case 'history':
        Alert.alert('提示', '浏览历史功能开发中');
        break;
      case 'settings':
        Alert.alert('提示', '设置功能开发中');
        break;
      case 'about':
        Alert.alert('关于', '招标信息聚合平台 v1.0.0');
        break;
    }
  };

  const handleUpgradeVIP = () => {
    Alert.alert('提示', 'VIP升级功能开发中');
  };

  if (loading) {
    return (
      <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </Screen>
    );
  }

  const userInitial = user?.nickname?.charAt(0) || user?.phone?.slice(-2) || 'U';

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>个人中心</Text>
            <TouchableOpacity>
              <FontAwesome6 name="gear" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.userDetail}>
              <Text style={styles.nickname}>{user?.nickname || '未登录'}</Text>
              <Text style={styles.phone}>{user?.phone || '点击登录'}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* VIP卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipHeader}>
              <Text style={styles.vipTitle}>会员等级</Text>
              <Text style={styles.vipLevel}>
                {VIP_LEVELS[user?.vip_level || 0]}
              </Text>
            </View>
            <Text style={styles.vipDesc}>
              {user?.vip_level && user.vip_level > 0
                ? `有效期至 ${new Date(user.vip_expire_at!).toLocaleDateString()}`
                : '升级VIP享受更多权益'}
            </Text>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeVIP}>
              <Text style={styles.upgradeButtonText}>
                {user?.vip_level && user.vip_level > 0 ? '续费升级' : '立即升级'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{favoriteCount}</Text>
                <Text style={styles.statLabel}>收藏</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.points || 0}</Text>
                <Text style={styles.statLabel}>积分</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>提醒</Text>
              </View>
            </View>
          </View>

          {/* 菜单 */}
          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>我的服务</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('favorites')}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FontAwesome6 name="heart" size={18} color="#C8102E" />
                </View>
                <Text style={styles.menuText}>我的收藏</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#8C8C8C" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('reminders')}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FontAwesome6 name="bell" size={18} color="#1A1A1A" />
                </View>
                <Text style={styles.menuText}>竞标提醒</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#8C8C8C" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('history')}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FontAwesome6 name="clock-rotate-left" size={18} color="#1A1A1A" />
                </View>
                <Text style={styles.menuText}>浏览历史</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#8C8C8C" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('settings')}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FontAwesome6 name="sliders" size={18} color="#1A1A1A" />
                </View>
                <Text style={styles.menuText}>设置</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#8C8C8C" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('about')}>
              <View style={styles.menuItemContent}>
                <View style={styles.menuIcon}>
                  <FontAwesome6 name="circle-info" size={18} color="#1A1A1A" />
                </View>
                <Text style={styles.menuText}>关于我们</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#8C8C8C" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

import { Alert } from 'react-native';
