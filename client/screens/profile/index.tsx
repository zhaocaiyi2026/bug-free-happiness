import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';
import { useFocusEffect } from 'expo-router';

interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar: string | null;
  vip_level: number;
  vip_expire_at: string | null;
  points: number;
}

const VIP_LEVELS = ['普通会员', '青铜VIP', '白银VIP', '黄金VIP', '钻石VIP'];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(56);
  const [subscribeCount, setSubscribeCount] = useState(8);
  const [loading, setLoading] = useState(true);

  // 使用 useFocusEffect 确保每次页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

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
        router.navigate('/favorites');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'subscribe':
        router.push('/subscribe');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'feedback':
        router.push('/feedback');
        break;
      case 'about':
        Alert.alert('关于招标通', '招标通 v1.0.0\n\n专业的招标信息聚合平台\n\n整合20,000+数据源\n提供实时招标、中标信息\n助力企业把握商机');
        break;
    }
  };

  const handleUpgradeVIP = () => {
    Alert.alert('VIP会员服务', '开通VIP会员，解锁全部高级功能\n\n• 实时推送招标信息\n• 智能数据分析报告\n• 专属客服优先响应\n• 历史数据无限制查看', [
      { text: '暂不需要', style: 'cancel' },
      { text: '立即开通', onPress: () => console.log('开通VIP') },
    ]);
  };

  const services = [
    { key: 'favorites', name: '收藏', icon: 'heart', color: '#C8102E', count: favoriteCount },
    { key: 'history', name: '历史', icon: 'clock-rotate-left', color: '#2563EB', count: historyCount },
    { key: 'subscribe', name: '订阅', icon: 'bookmark', color: '#059669', count: subscribeCount },
    { key: 'settings', name: '设置', icon: 'gear', color: '#6B7280', count: 0 },
  ];

  const vipBenefits = [
    '实时推送',
    '数据分析',
    '优先客服',
    '专属报告',
  ];

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  const userInitial = user?.nickname?.charAt(0) || user?.phone?.slice(-2) || 'U';

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>我的</Text>
            <TouchableOpacity style={styles.settingButton} onPress={() => handleMenuPress('settings')}>
              <FontAwesome6 name="gear" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{user?.nickname || '招标用户'}</Text>
              <Text style={styles.phone}>{user?.phone || '138****8000'}</Text>
              {(user?.vip_level ?? 0) > 0 && (
                <View style={styles.vipBadge}>
                  <FontAwesome6 name="crown" size={12} color="#FFD700" solid />
                  <Text style={styles.vipBadgeText}>{VIP_LEVELS[user?.vip_level || 0]}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* VIP卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipHeader}>
              <Text style={styles.vipTitle}>VIP会员服务</Text>
              <Text style={styles.vipLevel}>{VIP_LEVELS[user?.vip_level || 0]}</Text>
            </View>
            <Text style={styles.vipExpire}>
              {user?.vip_level && user.vip_level > 0
                ? `有效期至 ${new Date(user.vip_expire_at!).toLocaleDateString()}`
                : '开通VIP，解锁全部高级功能'}
            </Text>
            <View style={styles.vipBenefits}>
              {vipBenefits.map((benefit, index) => (
                <View key={index} style={styles.vipBenefit}>
                  <FontAwesome6 name="check" size={10} color="#059669" />
                  <Text style={styles.vipBenefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeVIP}>
              <Text style={styles.upgradeButtonText}>
                {user?.vip_level && user.vip_level > 0 ? '续费升级' : '立即开通'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 服务宫格 */}
          <View style={styles.serviceGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.key}
                style={styles.serviceItem}
                onPress={() => handleMenuPress(service.key)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                  <FontAwesome6 name={service.icon} size={20} color={service.color} />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.count > 0 && (
                  <Text style={styles.serviceCount}>{service.count}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>收藏项目</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>我的积分</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{subscribeCount}</Text>
              <Text style={styles.statLabel}>订阅关键词</Text>
            </View>
          </View>

          {/* 菜单列表 */}
          <View style={styles.menuSection}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>更多功能</Text>
            </View>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('favorites')}>
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, styles.menuIconFavorite]}>
                  <FontAwesome6 name="heart" size={18} color="#C8102E" />
                </View>
                <Text style={styles.menuText}>我的收藏</Text>
                {favoriteCount > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{favoriteCount}</Text>
                  </View>
                )}
                <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('history')}>
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, styles.menuIconHistory]}>
                  <FontAwesome6 name="clock-rotate-left" size={18} color="#2563EB" />
                </View>
                <Text style={styles.menuText}>浏览历史</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('subscribe')}>
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, styles.menuIconSubscribe]}>
                  <FontAwesome6 name="bookmark" size={18} color="#059669" />
                </View>
                <Text style={styles.menuText}>订阅管理</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => handleMenuPress('feedback')}>
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, styles.menuIconSetting]}>
                  <FontAwesome6 name="comment-dots" size={18} color="#6B7280" />
                </View>
                <Text style={styles.menuText}>意见反馈</Text>
                <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 关于 */}
          <TouchableOpacity style={[styles.menuSection, { padding: Spacing.lg }]} onPress={() => handleMenuPress('about')}>
            <View style={styles.menuItemContent}>
              <View style={[styles.menuIcon, { backgroundColor: '#F5F5F5' }]}>
                <FontAwesome6 name="circle-info" size={18} color="#6B7280" />
              </View>
              <Text style={styles.menuText}>关于招标通</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginRight: Spacing.sm }}>v1.0.0</Text>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
