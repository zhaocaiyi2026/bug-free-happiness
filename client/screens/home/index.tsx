import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface Bid {
  id: number;
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  publish_date: string | null;
  deadline: string | null;
  is_urgent: boolean;
  view_count: number;
}

interface Stats {
  todayCount: number;
  urgentCount: number;
  nearbyCount: number;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<Stats>({ todayCount: 0, urgentCount: 0, nearbyCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'province', label: '本省' },
    { key: 'city', label: '本市' },
    { key: 'follow', label: '关注' },
  ];

  useEffect(() => {
    fetchData(1);
  }, [activeFilter]);

  const fetchData = async (pageNum: number) => {
    try {
      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('pageSize', '20');
      
      if (activeFilter === 'province') {
        params.append('province', '广东省');
      } else if (activeFilter === 'city') {
        params.append('city', '深圳市');
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setBids(data.data.list);
          // 模拟统计数据
          setStats({
            todayCount: data.data.total || 156,
            urgentCount: data.data.list.filter((b: Bid) => b.is_urgent).length || 12,
            nearbyCount: Math.floor((data.data.total || 156) * 0.3),
          });
        } else {
          setBids((prev) => [...prev, ...data.data.list]);
        }
        setHasMore(data.data.page < data.data.totalPages);
      }
    } catch (error) {
      console.error('获取招标列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const handleFilterPress = (filterKey: string) => {
    setActiveFilter(filterKey);
    setPage(1);
    setLoading(true);
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleSearchPress = () => {
    router.navigate('/search');
  };

  const handleFavoritePress = () => {
    router.navigate('/favorites');
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

  const renderBidItem = useCallback(({ item }: { item: Bid }) => (
    <TouchableOpacity
      style={[styles.bidCard, item.is_urgent && styles.bidCardUrgent]}
      onPress={() => handleBidPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.bidCardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.industry?.slice(0, 6) || '项目招标'}</Text>
        </View>
        {item.is_urgent && (
          <View style={styles.urgentTag}>
            <FontAwesome6 name="bolt" size={9} color="#FFFFFF" />
            <Text style={styles.urgentTagText}>紧急</Text>
          </View>
        )}
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}元</Text>
      <View style={styles.bidFooter}>
        <Text style={styles.bidMeta}>{item.province} · {item.city}</Text>
        <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>
      </View>
    </TouchableOpacity>
  ), [styles]);

  const ListHeaderComponent = useMemo(() => (
    <>
      {/* 今日数据概览 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.todayCount}</Text>
          <Text style={styles.statLabel}>今日新增</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueRed]}>{stats.urgentCount}</Text>
          <Text style={styles.statLabel}>紧急招标</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.nearbyCount}</Text>
          <Text style={styles.statLabel}>本省项目</Text>
        </View>
      </View>

      {/* 快捷筛选 */}
      <View style={styles.filterSection}>
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => handleFilterPress(filter.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 列表标题 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>最新招标</Text>
        <TouchableOpacity>
          <Text style={styles.sectionMore}>更多</Text>
        </TouchableOpacity>
      </View>
    </>
  ), [stats, activeFilter, styles]);

  if (loading && page === 1) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.appTitle}>
              招标<Text style={styles.appTitleAccent}>通</Text>
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
                <FontAwesome6 name="magnifying-glass" size={18} color="#1C1917" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavoritePress}>
                <FontAwesome6 name="heart" size={18} color="#C8102E" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
          </TouchableOpacity>
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
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.appTitle}>
              招标<Text style={styles.appTitleAccent}>通</Text>
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
                <FontAwesome6 name="magnifying-glass" size={18} color="#1C1917" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavoritePress}>
                <FontAwesome6 name="heart" size={18} color="#C8102E" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
          </TouchableOpacity>
        </View>

        {/* 招标列表 */}
        <FlatList
          key="home-bids-list"
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeaderComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: Spacing.lg }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={48} color="#D1D5DB" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
