import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

const categories = [
  { id: 1, name: '建筑工程', icon: 'building', count: 1280, color: '#2563EB' },
  { id: 2, name: 'IT服务', icon: 'laptop-code', count: 856, color: '#059669' },
  { id: 3, name: '医疗设备', icon: 'hospital', count: 432, color: '#DC2626' },
  { id: 4, name: '教育培训', icon: 'graduation-cap', count: 367, color: '#7C3AED' },
  { id: 5, name: '交通运输', icon: 'truck', count: 298, color: '#EA580C' },
  { id: 6, name: '环保能源', icon: 'leaf', count: 245, color: '#16A34A' },
  { id: 7, name: '政府采购', icon: 'landmark', count: 189, color: '#0891B2' },
  { id: 8, name: '更多', icon: 'ellipsis', count: 0, color: '#6B7280' },
];

const hotTags = [
  { name: '市政工程', isHot: true },
  { name: '信息化建设', isHot: false },
  { name: '医疗器械', isHot: true },
  { name: '智慧城市', isHot: false },
  { name: '新能源', isHot: false },
  { name: '园林绿化', isHot: true },
];

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

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'today', label: '今日新增' },
    { key: 'urgent', label: '紧急招标' },
    { key: 'high_budget', label: '大额项目' },
  ];

  // 模拟推荐数据
  const recommendBids: Bid[] = [
    { id: 1, title: '某市智慧城市建设项目招标公告', budget: 58000000, province: '广东', city: '深圳', industry: 'IT服务', deadline: '2026-04-15', is_urgent: true },
    { id: 2, title: '2026年度医疗设备集中采购项目', budget: 32000000, province: '北京', city: '北京', industry: '医疗设备', deadline: '2026-04-20', is_urgent: false },
    { id: 3, title: '城区道路改造提升工程施工招标', budget: 85000000, province: '浙江', city: '杭州', industry: '建筑工程', deadline: '2026-04-18', is_urgent: true },
    { id: 4, title: '新能源充电桩建设运营项目', budget: 12000000, province: '江苏', city: '南京', industry: '环保能源', deadline: '2026-04-22', is_urgent: false },
    { id: 5, title: '政务服务系统升级改造项目', budget: 8500000, province: '上海', city: '上海', industry: 'IT服务', deadline: '2026-04-25', is_urgent: false },
    { id: 6, title: '城市园林绿化养护工程招标', budget: 15000000, province: '四川', city: '成都', industry: '建筑工程', deadline: '2026-04-28', is_urgent: true },
  ];

  const handleCategoryPress = (category: typeof categories[0]) => {
    if (category.name === '更多') {
      return;
    }
    router.push('/search', { industry: category.name });
  };

  const handleTagPress = (tag: string) => {
    router.push('/search', { keyword: tag });
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
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

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header - 紧凑型 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>发现</Text>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.navigate('/search')}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#1C1917" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchContainer} onPress={() => router.navigate('/search')}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 热门行业 - 宫格 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门行业</Text>
              <TouchableOpacity>
                <Text style={styles.sectionMore}>查看全部</Text>
              </TouchableOpacity>
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
              <TouchableOpacity>
                <Text style={styles.sectionMore}>更多</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bidGrid}>
              {recommendBids.map((bid) => (
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
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
