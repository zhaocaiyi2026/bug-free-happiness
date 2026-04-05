import { API_BASE_URL } from '@/constants/api';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

const FAVORITE_VIEWED_KEY = 'favorite_last_viewed_count';

const VIP_LEVELS = ['普通会员', '青铜VIP', '白银VIP', '黄金VIP', '钻石VIP'];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();

  const [favoriteCount, setFavoriteCount] = useState(0);
  const [lastViewedFavoriteCount, setLastViewedFavoriteCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [subscribeCount, setSubscribeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSignedIn, setHasSignedIn] = useState(false);

  const hasNewFavorite = favoriteCount > lastViewedFavoriteCount;
  const newFavoriteCount = Math.max(0, favoriteCount - lastViewedFavoriteCount);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchLastViewedCount();
    }, [])
  );

  const fetchLastViewedCount = async () => {
    try {
      const lastCount = await AsyncStorage.getItem(FAVORITE_VIEWED_KEY);
      if (lastCount) {
        setLastViewedFavoriteCount(parseInt(lastCount, 10));
      }
    } catch (error) {
      console.error('获取上次查看数量失败:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      await refreshUser();

      // 获取收藏数量
      const favRes = await fetch(
        `${API_BASE_URL}/api/v1/favorites?userId=${user?.id || 1}&pageSize=1`
      );
      const favData = await favRes.json();

      if (favData.success) {
        setFavoriteCount(favData.data.total);
      }

      // 获取订阅数量
      const subRes = await fetch(
        `${API_BASE_URL}/api/v1/subscriptions?userId=${user?.id || 1}`
      );
      const subData = await subRes.json();

      if (subData.success) {
        setSubscribeCount(subData.data?.length || 0);
      }

      // 获取搜索历史数量
      const historyRes = await fetch(
        `${API_BASE_URL}/api/v1/search-history?userId=${user?.id || 1}`
      );
      const historyData = await historyRes.json();

      if (historyData.success) {
        setHistoryCount(historyData.count || 0);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = async (menu: string) => {
    switch (menu) {
      case 'favorites':
        await AsyncStorage.setItem(FAVORITE_VIEWED_KEY, String(favoriteCount));
        setLastViewedFavoriteCount(favoriteCount);
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
      case 'exclusive':
        if (Platform.OS === 'web') {
          window.alert('专属服务\n\nVIP专属功能开发中，敬请期待！');
        } else {
          Alert.alert('专属服务', 'VIP专属功能开发中，敬请期待！');
        }
        break;
      case 'logout':
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('确定要退出登录吗？');
          if (confirmed) {
            logout();
          }
        } else {
          Alert.alert(
            '退出登录',
            '确定要退出登录吗？',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '确定',
                style: 'destructive',
                onPress: () => logout(),
              },
            ],
            { cancelable: true }
          );
        }
        break;
      case 'about':
        Alert.alert('关于招采易', '招采易 v1.0.0\n\n一站式招标采购信息平台\n\n整合全国公共资源交易平台\n提供实时招标、中标信息\n助力企业把握商机');
        break;
    }
  };

  const handleUpgradeVIP = () => {
    Alert.alert('VIP会员服务', '开通VIP会员，解锁全部高级功能\n\n• 实时推送招标采购信息\n• 智能数据分析报告\n• 专属客服优先响应\n• 历史数据无限制查看', [
      { text: '暂不需要', style: 'cancel' },
      { text: '立即开通', onPress: () => console.log('开通VIP') },
    ]);
  };

  const vipBenefits = ['实时推送', '数据分析', '优先客服', '专属报告'];

  if (loading) {
    return (
      <Screen backgroundColor="#2563EB" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </Screen>
    );
  }

  const userInitial = user?.nickname?.charAt(0) || user?.phone?.slice(-2) || 'U';
  const vipLevel = user?.vip_level ?? 0;
  const userPoints = user?.points || 0;
  
  // 计算等级进度（假设每升一级需要100积分）
  const currentLevelPoints = vipLevel * 100;
  const nextLevelPoints = (vipLevel + 1) * 100;
  const levelProgress = Math.min(100, Math.max(0, ((userPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100));

  const handleSignIn = () => {
    if (hasSignedIn) {
      Alert.alert('签到', '今日已签到，明天再来吧！');
      return;
    }
    Alert.alert('签到成功', '恭喜获得 +10 积分！', [
      { text: '好的', onPress: () => setHasSignedIn(true) }
    ]);
  };

  const handleEditProfile = () => {
    router.push('/profile-edit');
  };

  return (
    <Screen backgroundColor="#2563EB" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户卡片 - 蓝色背景延伸到顶部 */}
        <View style={[styles.userCard, { paddingTop: Spacing.md + (insets.top > 0 ? insets.top : 0) }]}>
          <View style={styles.userMain}>
            <TouchableOpacity style={styles.avatar} onPress={handleEditProfile}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <View style={styles.userRow}>
                <Text style={styles.nickname}>{user?.nickname || '招标用户'}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
                  <FontAwesome6 name="pen" size={12} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.phone}>{user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '未登录'}</Text>
              
              {/* 会员等级 + 积分 */}
              <View style={styles.userTags}>
                <View style={[styles.vipBadge, vipLevel === 0 && styles.normalBadge]}>
                  <FontAwesome6 
                    name={vipLevel > 0 ? "crown" : "user"} 
                    size={11} 
                    color={vipLevel > 0 ? "#FFD700" : "#FFFFFF"} 
                    solid 
                  />
                  <Text style={[styles.vipBadgeText, vipLevel === 0 && styles.normalBadgeText]}>
                    {VIP_LEVELS[vipLevel]}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <FontAwesome6 name="coins" size={11} color="#FFD700" />
                  <Text style={styles.pointsText}>{userPoints}</Text>
                </View>
              </View>
              
              {/* 等级进度条 */}
              {vipLevel < 4 && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>还需{nextLevelPoints - userPoints}积分升级</Text>
                </View>
              )}
            </View>
            
            {/* 签到入口 */}
            <TouchableOpacity 
              style={[styles.signInBtn, hasSignedIn && styles.signedInBtn]} 
              onPress={handleSignIn}
            >
              <FontAwesome6 
                name={hasSignedIn ? "check-circle" : "calendar-check"} 
                size={18} 
                color={hasSignedIn ? "rgba(255,255,255,0.5)" : "#FFD700"} 
              />
              <Text style={[styles.signInText, hasSignedIn && styles.signedInText]}>
                {hasSignedIn ? '已签到' : '签到'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 快捷入口行 - 统计数据 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickItem} onPress={async () => {
              await AsyncStorage.setItem(FAVORITE_VIEWED_KEY, String(favoriteCount));
              setLastViewedFavoriteCount(favoriteCount);
              router.navigate('/favorites');
            }}>
              <Text style={styles.quickItemValue}>{favoriteCount}</Text>
              <Text style={styles.quickItemText}>收藏</Text>
            </TouchableOpacity>
            <View style={styles.quickDivider} />
            <TouchableOpacity style={styles.quickItem} onPress={() => router.push('/history')}>
              <Text style={styles.quickItemValue}>{historyCount}</Text>
              <Text style={styles.quickItemText}>历史</Text>
            </TouchableOpacity>
            <View style={styles.quickDivider} />
            <TouchableOpacity style={styles.quickItem} onPress={() => router.push('/subscribe')}>
              <Text style={styles.quickItemValue}>{subscribeCount}</Text>
              <Text style={styles.quickItemText}>订阅</Text>
            </TouchableOpacity>
            <View style={styles.quickDivider} />
            <TouchableOpacity style={styles.quickItem} onPress={() => Alert.alert('邀请好友', '分享给好友，双方各得50积分！')}>
              <FontAwesome6 name="gift" size={18} color="#FFD700" />
              <Text style={styles.quickItemText}>邀请有礼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP卡片 */}
        <View style={styles.vipCard}>
          <View style={styles.vipHeader}>
            <View style={styles.vipIcon}>
              <FontAwesome6 name="crown" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.vipHeaderContent}>
              <Text style={styles.vipTitle}>VIP会员服务</Text>
              <Text style={styles.vipDesc}>
                {user?.vip_level && user.vip_level > 0
                  ? VIP_LEVELS[user.vip_level]
                  : '开通VIP，解锁全部高级功能'}
              </Text>
            </View>
            <TouchableOpacity style={styles.vipButton} onPress={handleUpgradeVIP}>
              <Text style={styles.vipButtonText}>
                {user?.vip_level && user.vip_level > 0 ? '续费' : '开通'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.vipBenefits}>
            {vipBenefits.map((benefit, index) => (
              <View key={index} style={styles.vipBenefit}>
                <FontAwesome6 name="check" size={10} color="#92400E" />
                <Text style={styles.vipBenefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/favorites')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(200,16,46,0.1)' }]}>
              <FontAwesome6 name="heart" size={18} color="#C8102E" />
            </View>
            <Text style={styles.menuText}>我的收藏</Text>
            {newFavoriteCount > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{newFavoriteCount > 99 ? '99+' : newFavoriteCount}</Text>
              </View>
            )}
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
              <FontAwesome6 name="clock-rotate-left" size={18} color="#2563EB" />
            </View>
            <Text style={styles.menuText}>浏览历史</Text>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/subscribe')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(5,150,105,0.1)' }]}>
              <FontAwesome6 name="bookmark" size={18} color="#059669" />
            </View>
            <Text style={styles.menuText}>订阅管理</Text>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('中标记录', '您参与投标的项目中标信息将在这里展示。')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(234,179,8,0.1)' }]}>
              <FontAwesome6 name="trophy" size={18} color="#EAB308" />
            </View>
            <Text style={styles.menuText}>中标记录</Text>
            <View style={styles.comingBadge}>
              <Text style={styles.comingBadgeText}>NEW</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => Alert.alert('关注企业', '您关注的企业发布的新招标信息会优先推送给您。')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
              <FontAwesome6 name="building" size={18} color="#A855F7" />
            </View>
            <Text style={styles.menuText}>关注企业</Text>
            <View style={styles.comingBadge}>
              <Text style={styles.comingBadgeText}>NEW</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        {/* 其他功能 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('数据报告', `您的使用统计：\n\n• 浏览项目：${historyCount}个\n• 收藏项目：${favoriteCount}个\n• 订阅关键词：${subscribeCount}个\n• 累计积分：${userPoints}分`)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <FontAwesome6 name="chart-pie" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>数据报告</Text>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('exclusive')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(217,119,6,0.1)' }]}>
              <FontAwesome6 name="gem" size={18} color="#D97706" />
            </View>
            <Text style={styles.menuText}>专属服务</Text>
            <View style={styles.vipTagSmall}>
              <FontAwesome6 name="crown" size={8} color="#D97706" />
              <Text style={styles.vipTagSmallText}>VIP</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => handleMenuPress('feedback')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
              <FontAwesome6 name="comment-dots" size={18} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>意见反馈</Text>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        {/* 设置 */}
        <TouchableOpacity 
          style={[styles.menuSection, { flexDirection: 'row', alignItems: 'center', padding: Spacing.md }]} 
          onPress={() => handleMenuPress('settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
            <FontAwesome6 name="gear" size={18} color="#6B7280" />
          </View>
          <Text style={styles.menuText}>设置</Text>
          <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
        </TouchableOpacity>

        {/* 管理员入口 */}
        {user?.role === 'admin' && (
          <TouchableOpacity 
            style={[styles.menuSection, { flexDirection: 'row', alignItems: 'center', padding: Spacing.md }]} 
            onPress={() => router.push('/user-manage')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome6 name="users-gear" size={18} color="#D97706" />
            </View>
            <Text style={styles.menuText}>用户管理</Text>
            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
              <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '600' }}>管理员</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" style={styles.menuArrow} />
          </TouchableOpacity>
        )}

        {/* 关于 */}
        <TouchableOpacity style={[styles.menuSection, { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm }]} onPress={() => handleMenuPress('about')}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
            <FontAwesome6 name="circle-info" size={18} color="#6B7280" />
          </View>
          <Text style={styles.menuText}>关于招采易</Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginRight: Spacing.sm }}>v1.0.1</Text>
          <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 退出登录 */}
        <TouchableOpacity 
          style={[styles.menuSection, { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm }]} 
          onPress={() => handleMenuPress('logout')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(200,16,46,0.1)' }]}>
            <FontAwesome6 name="right-from-bracket" size={18} color="#C8102E" />
          </View>
          <Text style={[styles.menuText, { color: '#C8102E' }]}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
