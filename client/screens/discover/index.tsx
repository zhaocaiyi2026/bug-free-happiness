import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Industry {
  id: number;
  name: string;
  code: string;
}

interface Category {
  id: number | string;
  name: string;
  icon: string;
  count: number;
  color: string;
  bgColor: string;
}

interface Bid {
  id: number;
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  deadline: string | null;
  is_urgent: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: '建筑工程', icon: 'building', count: 0, color: '#2563EB', bgColor: '#EFF6FF' },
  { id: 2, name: 'IT服务', icon: 'laptop-code', count: 0, color: '#059669', bgColor: '#ECFDF5' },
  { id: 3, name: '医疗设备', icon: 'hospital', count: 0, color: '#DC2626', bgColor: '#FEF2F2' },
  { id: 4, name: '教育培训', icon: 'graduation-cap', count: 0, color: '#7C3AED', bgColor: '#F5F3FF' },
  { id: 5, name: '交通运输', icon: 'truck', count: 0, color: '#EA580C', bgColor: '#FFF7ED' },
  { id: 6, name: '环保能源', icon: 'leaf', count: 0, color: '#16A34A', bgColor: '#F0FDF4' },
  { id: 7, name: '政府采购', icon: 'landmark', count: 0, color: '#0891B2', bgColor: '#ECFEFF' },
  { id: 'more', name: '更多', icon: 'ellipsis', count: 0, color: '#6B7280', bgColor: '#F3F4F6' },
];

const CATEGORY_ICONS: Record<string, string> = {
  '建筑工程': 'building',
  'IT服务': 'laptop-code',
  '医疗设备': 'hospital',
  '教育培训': 'graduation-cap',
  '交通运输': 'truck',
  '环保能源': 'leaf',
  '政府采购': 'landmark',
  '市政设施': 'road',
  '水利水电': 'water',
  '农林牧渔': 'seedling',
};

const CATEGORY_COLORS: Array<{ color: string; bgColor: string }> = [
  { color: '#2563EB', bgColor: '#EFF6FF' },
  { color: '#059669', bgColor: '#ECFDF5' },
  { color: '#DC2626', bgColor: '#FEF2F2' },
  { color: '#7C3AED', bgColor: '#F5F3FF' },
  { color: '#EA580C', bgColor: '#FFF7ED' },
  { color: '#16A34A', bgColor: '#F0FDF4' },
  { color: '#0891B2', bgColor: '#ECFEFF' },
  { color: '#6366F1', bgColor: '#EEF2FF' },
];

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recommendBids, setRecommendBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // VIP权限检查
  const checkVipAccess = () => {
    if (user?.vip_level && user.vip_level > 0) {
      return true;
    }
    Alert.alert(
      'VIP专属功能',
      '该功能需要开通VIP会员才能使用，是否前往开通？',
      [
        { text: '取消', style: 'cancel' },
        { text: '立即开通', onPress: () => router.navigate('/profile') },
      ]
    );
    return false;
  };

  // 首次加载数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchIndustries(), fetchRecommendBids()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/common/industries`
      );
      const data = await res.json();

      if (data.success && data.data) {
        const mappedCategories: Category[] = data.data.slice(0, 7).map((industry: Industry, index: number) => {
          const colorConfig = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return {
            id: industry.id,
            name: industry.name,
            icon: CATEGORY_ICONS[industry.name] || 'folder',
            count: 0,
            color: colorConfig.color,
            bgColor: colorConfig.bgColor,
          };
        });
        mappedCategories.push({ 
          id: 'more', 
          name: '更多', 
          icon: 'ellipsis', 
          count: 0, 
          color: '#6B7280', 
          bgColor: '#F3F4F6' 
        });
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error('获取行业列表失败:', error);
    }
  };

  const fetchRecommendBids = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '6');

      const res = await fetch(
        `${API_BASE_URL}/api/v1/bids?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setRecommendBids(data.data.list);
      }
    } catch (error) {
      console.error('获取推荐招标失败:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // 点击热门行业 - 自动搜索该行业
  const handleCategoryPress = (category: Category) => {
    if (category.id === 'more') {
      router.push('/search', { autoSearch: 'true' });
      return;
    }
    router.push('/search', { 
      industry: category.name,
      autoSearch: 'true'
    });
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleViewAllCategories = () => {
    router.push('/search', { autoSearch: 'true' });
  };

  const handleViewAllBids = () => {
    router.push('/bidList', { type: 'today' });
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return '面议';
    if (budget >= 100000000) {
      return `${(budget / 100000000).toFixed(1)}亿`;
    } else if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}`;
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const renderBidCard = useCallback((bid: Bid) => (
    <TouchableOpacity
      key={bid.id}
      style={styles.bidCard}
      onPress={() => handleBidPress(bid.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.bidCardContent, bid.is_urgent && styles.bidCardUrgent]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText} numberOfLines={1}>
              {bid.industry?.slice(0, 4) || '项目'}
            </Text>
          </View>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{bid.bid_type || '招标'}</Text>
          </View>
        </View>
        <Text style={styles.bidTitle} numberOfLines={2}>
          {bid.title}
        </Text>
        <Text style={styles.bidBudget}>{formatBudget(bid.budget)}元</Text>
        <Text style={styles.bidMeta} numberOfLines={1}>{bid.province} · {bid.city}</Text>
        {bid.deadline && <Text style={styles.bidDeadline}>截止 {formatDeadline(bid.deadline)}</Text>}
      </View>
    </TouchableOpacity>
  ), [styles]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#FAFAFA" statusBarStyle="dark" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.brandSection}>
              <View style={styles.brandIcon}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>招采易</Text>
                <Text style={styles.brandSubtitle}>招标采购信息平台</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#FAFAFA" statusBarStyle="dark" safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* Header - 白色极简设计 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.brandSection}>
              <View style={styles.brandIcon}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>招采易</Text>
                <Text style={styles.brandSubtitle}>招标采购信息平台</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={() => router.navigate('/search')}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
              <Text style={styles.searchPlaceholder}>搜索招标信息...</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
        >
          {/* 热门行业 - 宫格 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门行业</Text>
              <TouchableOpacity onPress={handleViewAllCategories}>
                <Text style={styles.sectionMore}>查看全部</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryIconWrapper, { backgroundColor: category.bgColor }]}>
                    <FontAwesome6 name={category.icon} size={22} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.count > 0 && (
                    <Text style={styles.categoryCount}>{category.count}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 特色功能区 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>特色功能</Text>
            </View>
            <View style={styles.featureGrid}>
              {/* 潜在客户 */}
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => {
                  if (checkVipAccess()) {
                    router.push('/potential-customers');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIconWrapper, { backgroundColor: '#EFF6FF' }]}>
                  <FontAwesome6 name="address-book" size={24} color="#2563EB" />
                </View>
                <View style={styles.featureContent}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>潜在客户</Text>
                    <View style={styles.vipTag}>
                      <FontAwesome6 name="crown" size={8} color="#D97706" />
                      <Text style={styles.vipTagText}>VIP</Text>
                    </View>
                  </View>
                  <Text style={styles.featureDesc}>查找招标方/中标方联系方式</Text>
                </View>
                <View style={styles.featureArrow}>
                  <FontAwesome6 name="chevron-right" size={14} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
              
              {/* 前期项目 */}
              <TouchableOpacity
                style={[styles.featureCard, { opacity: 0.6 }]}
                onPress={() => {
                  if (checkVipAccess()) {
                    console.log('前期项目功能开发中');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <FontAwesome6 name="clipboard-list" size={24} color="#D97706" />
                </View>
                <View style={styles.featureContent}>
                  <View style={styles.featureTitleRow}>
                    <Text style={styles.featureTitle}>前期项目</Text>
                    <View style={styles.vipTag}>
                      <FontAwesome6 name="crown" size={8} color="#D97706" />
                      <Text style={styles.vipTagText}>VIP</Text>
                    </View>
                  </View>
                  <Text style={styles.featureDesc}>筹建/备案项目信息查询</Text>
                </View>
                <View style={styles.featureArrow}>
                  <FontAwesome6 name="chevron-right" size={14} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 热门推荐 - 双列网格 */}
          <View style={[styles.sectionContainer, { marginBottom: Spacing.lg }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门推荐</Text>
              <TouchableOpacity onPress={handleViewAllBids}>
                <Text style={styles.sectionMore}>更多</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bidGrid}>
              {recommendBids.map((bid) => renderBidCard(bid))}
            </View>
            {recommendBids.length === 0 && (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={40} color="#D1D5DB" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无推荐招标</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
