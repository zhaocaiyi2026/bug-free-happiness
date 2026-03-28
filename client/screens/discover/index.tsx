import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const categories = [
  { id: 1, name: '建筑工程', icon: '🏗️', count: 1280, color: '#2563EB' },
  { id: 2, name: 'IT服务', icon: '💻', count: 856, color: '#059669' },
  { id: 3, name: '医疗设备', icon: '🏥', count: 432, color: '#DC2626' },
  { id: 4, name: '教育培训', icon: '📚', count: 367, color: '#7C3AED' },
  { id: 5, name: '交通运输', icon: '🚛', count: 298, color: '#EA580C' },
  { id: 6, name: '环保能源', icon: '🌱', count: 245, color: '#16A34A' },
  { id: 7, name: '政府采购', icon: '🏛️', count: 189, color: '#0891B2' },
  { id: 8, name: '更多', icon: '📋', count: 0, color: '#6B7280' },
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

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [recommendBids, setRecommendBids] = useState<Bid[]>([]);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'today', label: '今日新增' },
    { key: 'urgent', label: '紧急招标' },
    { key: 'high_budget', label: '大额项目' },
  ];

  const handleCategoryPress = (category: typeof categories[0]) => {
    if (category.name === '更多') {
      // 跳转到完整分类页
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
      return `${(budget / 100000000).toFixed(2)}亿`;
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
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.headerTitle}>发现</Text>
          <TouchableOpacity style={styles.searchContainer} onPress={() => router.navigate('/search')}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 热门行业 */}
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
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                    <Text style={styles.categoryIconText}>{category.icon}</Text>
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.count > 0 && (
                    <Text style={styles.categoryCount}>{category.count}条</Text>
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
                    {tag.isHot && '🔥 '}{tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 筛选条件 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>快捷筛选</Text>
            </View>
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

          {/* 热门推荐 */}
          <View style={[styles.sectionContainer, { marginBottom: Spacing.lg }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门推荐</Text>
              <TouchableOpacity>
                <Text style={styles.sectionMore}>更多</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <View style={styles.listContainer}>
                {/* 模拟推荐数据 */}
                {[
                  { id: 1, title: '某市智慧城市建设项目招标公告', budget: 58000000, province: '广东', city: '深圳', industry: 'IT服务', deadline: '2026-04-15', is_urgent: true },
                  { id: 2, title: '2026年度医疗设备集中采购项目', budget: 32000000, province: '北京', city: '北京', industry: '医疗设备', deadline: '2026-04-20', is_urgent: false },
                  { id: 3, title: '城区道路改造提升工程施工招标', budget: 85000000, province: '浙江', city: '杭州', industry: '建筑工程', deadline: '2026-04-18', is_urgent: true },
                ].map((bid) => (
                  <TouchableOpacity
                    key={bid.id}
                    style={[styles.bidCard, bid.is_urgent && styles.bidCardUrgent]}
                    onPress={() => handleBidPress(bid.id)}
                  >
                    <View style={styles.bidCardHeader}>
                      <View style={styles.bidCategory}>
                        <Text style={styles.bidCategoryText}>{bid.industry}</Text>
                      </View>
                      {bid.is_urgent && (
                        <View style={styles.bidUrgentBadge}>
                          <Text style={styles.bidUrgentText}>紧急</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.bidTitle} numberOfLines={2}>{bid.title}</Text>
                    <View style={styles.bidInfoRow}>
                      <Text style={styles.bidBudget}>{formatBudget(bid.budget)}元</Text>
                      <Text style={styles.bidMeta}>{bid.province} · {bid.city}</Text>
                    </View>
                    <Text style={styles.bidDeadline}>截止 {formatDeadline(bid.deadline)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
