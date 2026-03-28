import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Province {
  id: number;
  name: string;
  code: string;
}

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
}

interface Bid {
  id: number;
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  deadline: string | null;
  is_urgent: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: '建筑工程', icon: 'building', count: 0, color: '#2563EB' },
  { id: 2, name: 'IT服务', icon: 'laptop-code', count: 0, color: '#059669' },
  { id: 3, name: '医疗设备', icon: 'hospital', count: 0, color: '#DC2626' },
  { id: 4, name: '教育培训', icon: 'graduation-cap', count: 0, color: '#7C3AED' },
  { id: 5, name: '交通运输', icon: 'truck', count: 0, color: '#EA580C' },
  { id: 6, name: '环保能源', icon: 'leaf', count: 0, color: '#16A34A' },
  { id: 7, name: '政府采购', icon: 'landmark', count: 0, color: '#0891B2' },
  { id: 'more', name: '更多', icon: 'ellipsis', count: 0, color: '#6B7280' },
];

const hotTags = [
  { name: '市政工程', isHot: true },
  { name: '信息化建设', isHot: false },
  { name: '医疗器械', isHot: true },
  { name: '智慧城市', isHot: false },
  { name: '新能源', isHot: false },
  { name: '园林绿化', isHot: true },
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

const CATEGORY_COLORS: string[] = [
  '#2563EB', '#059669', '#DC2626', '#7C3AED', 
  '#EA580C', '#16A34A', '#0891B2', '#6366F1'
];

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recommendBids, setRecommendBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 地址选择相关
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'today', label: '今日新增' },
    { key: 'urgent', label: '紧急招标' },
    { key: 'high_budget', label: '大额项目' },
  ];

  useEffect(() => {
    fetchProvinces();
    fetchData();
  }, [activeFilter]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/provinces`
      );
      const data = await res.json();
      if (data.success) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('获取省份列表失败:', error);
    }
  };

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
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/industries`
      );
      const data = await res.json();

      if (data.success && data.data) {
        const mappedCategories: Category[] = data.data.slice(0, 7).map((industry: Industry, index: number) => ({
          id: industry.id,
          name: industry.name,
          icon: CATEGORY_ICONS[industry.name] || 'folder',
          count: 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }));
        mappedCategories.push({ id: 'more', name: '更多', icon: 'ellipsis', count: 0, color: '#6B7280' });
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

      // 根据筛选条件添加参数
      switch (activeFilter) {
        case 'today': {
          const today = new Date().toISOString().split('T')[0];
          params.append('publishDateFrom', today);
          break;
        }
        case 'urgent':
          params.append('isUrgent', 'true');
          break;
        case 'high_budget':
          params.append('minBudget', '10000000');
          break;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
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
      // 更多行业 - 跳转到搜索页
      router.push('/search', { 
        province: selectedProvince,
        autoSearch: 'true' 
      });
      return;
    }
    // 跳转到搜索页面并自动搜索该行业
    router.push('/search', { 
      industry: category.name,
      province: selectedProvince,
      autoSearch: 'true'
    });
  };

  // 点击热门标签 - 自动搜索该标签
  const handleTagPress = (tag: string) => {
    router.push('/search', { 
      keyword: tag,
      province: selectedProvince,
      autoSearch: 'true'
    });
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleViewAllCategories = () => {
    router.push('/search', { 
      province: selectedProvince,
      autoSearch: 'true' 
    });
  };

  const handleViewAllBids = () => {
    if (activeFilter === 'urgent') {
      router.push('/bidList', { type: 'urgent' });
    } else if (activeFilter === 'today') {
      router.push('/bidList', { type: 'today' });
    } else {
      router.push('/bidList', { type: 'today' });
    }
  };

  const handleProvinceSelect = (provinceName: string) => {
    setSelectedProvince(provinceName === '全部' ? '' : provinceName);
    setProvinceModalVisible(false);
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
            <Text style={styles.typeTagText}>招标</Text>
          </View>
          {bid.is_urgent && (
            <View style={styles.urgentTag}>
              <Text style={styles.urgentTagText}>紧急</Text>
            </View>
          )}
        </View>
        <Text style={styles.bidTitle} numberOfLines={2}>
          {bid.title}
        </Text>
        <Text style={styles.bidBudget}>{formatBudget(bid.budget)}元</Text>
        <Text style={styles.bidMeta} numberOfLines={1}>{bid.province} · {bid.city}</Text>
        <Text style={styles.bidDeadline}>截止 {formatDeadline(bid.deadline)}</Text>
      </View>
    </TouchableOpacity>
  ), [styles]);

  const renderProvinceItem = useCallback(({ item }: { item: { id: number; name: string } }) => {
    const isSelected = selectedProvince === item.name || (item.name === '全部' && !selectedProvince);
    return (
      <TouchableOpacity
        style={[styles.modalItem, isSelected && styles.modalItemActive]}
        onPress={() => handleProvinceSelect(item.name)}
      >
        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
          {item.name}
        </Text>
        {isSelected && <FontAwesome6 name="check" size={14} color="#2563EB" />}
      </TouchableOpacity>
    );
  }, [styles, selectedProvince]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleWrapper}>
              <View style={styles.appLogo}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.appTitleContainer}>
                <Text style={styles.appTitle}>招标</Text>
                <Text style={[styles.appTitle, styles.appTitleAccent]}>通</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.navigate('/search')}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#1C1917" />
            </TouchableOpacity>
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
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header - 品牌增强型 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleWrapper}>
              <View style={styles.appLogo}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.appTitleContainer}>
                <Text style={styles.appTitle}>招标</Text>
                <Text style={[styles.appTitle, styles.appTitleAccent]}>通</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.navigate('/search')}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#1C1917" />
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
          {/* 地址选择 */}
          <View style={styles.locationSection}>
            <TouchableOpacity 
              style={styles.locationSelector}
              onPress={() => setProvinceModalVisible(true)}
            >
              <FontAwesome6 name="location-dot" size={14} color="#2563EB" />
              <Text style={styles.locationText}>
                {selectedProvince || '选择地区'}
              </Text>
              <FontAwesome6 name="chevron-down" size={10} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleViewAllCategories}>
              <Text style={styles.viewAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {/* 热门行业 - 宫格 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门行业</Text>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}10` }]}>
                    <FontAwesome6 name={category.icon} size={20} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.count > 0 && (
                    <Text style={styles.categoryCount}>{category.count}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 热门标签 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门标签</Text>
            </View>
            <View style={styles.tagsContainer}>
              {hotTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, tag.isHot && styles.tagHot]}
                  onPress={() => handleTagPress(tag.name)}
                >
                  <Text style={[styles.tagText, tag.isHot && styles.tagTextHot]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 筛选条件 */}
          <View style={[styles.sectionContainer, { paddingBottom: Spacing.sm }]}>
            <View style={styles.filterContainer}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

        {/* 省份选择弹窗 */}
        <Modal
          visible={provinceModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setProvinceModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setProvinceModalVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>选择地区</Text>
                <TouchableOpacity onPress={() => setProvinceModalVisible(false)}>
                  <FontAwesome6 name="xmark" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={[{ id: 0, name: '全部' }, ...provinces]}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProvinceItem}
                showsVerticalScrollIndicator={false}
                style={styles.modalList}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Screen>
  );
}
