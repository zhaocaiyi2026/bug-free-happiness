import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;
const CARD_MARGIN = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;

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
  winBidCount: number;
  provinceCount: number;
  cityCount: number;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    todayCount: 156, 
    urgentCount: 8, 
    winBidCount: 32,
    provinceCount: 0,
    cityCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');

  // 快捷筛选入口：全部、今日新增、紧急招标、大额项目
  const filters = [
    { key: 'all', label: '全部', icon: 'layer-group' },
    { key: 'today', label: '今日新增', icon: 'calendar-day' },
    { key: 'urgent', label: '紧急招标', icon: 'bolt' },
    { key: 'large', label: '大额项目', icon: 'sack-dollar' },
  ];

  // 获取首页统计数据
  const fetchStats = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/bids.ts
       * 接口：GET /api/v1/bids/stats
       * 返回：今日新增、紧急招标、今日中标的数量
       */
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids/stats`
      );
      const data = await res.json();

      if (data.success) {
        setStats(prev => ({
          ...prev,
          todayCount: data.data.todayBids || 0,
          urgentCount: data.data.urgentBids || 0,
          winBidCount: data.data.todayWinBids || 0,
        }));
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取招标数据
  const fetchData = async (pageNum: number) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('pageSize', '20');
      
      // 根据筛选类型设置条件
      switch (activeFilter) {
        case 'today': {
          // 今日新增：发布日期为今天
          const today = new Date().toISOString().split('T')[0];
          params.append('publishDateFrom', today);
          break;
        }
        case 'urgent':
          // 紧急招标
          params.append('isUrgent', 'true');
          break;
        case 'large':
          // 大额项目：预算 >= 1000万
          params.append('minBudget', '10000000');
          break;
        case 'all':
        default:
          // 全部：不添加额外筛选条件
          break;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setBids(data.data.list);
        } else {
          setBids((prev) => [...prev, ...data.data.list]);
        }
        setHasMore(data.data.page < data.data.totalPages);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

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
    // 点击筛选按钮时，只更新筛选状态并刷新列表数据
    if (filterKey !== activeFilter) {
      setActiveFilter(filterKey);
      setPage(1);
      // setLoading会由fetchData处理
    }
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

  const renderBidItem = useCallback(({ item, index }: { item: Bid; index: number }) => {
    return (
      <TouchableOpacity
        style={[
          styles.bidCard,
          item.is_urgent && styles.bidCardUrgent,
          { width: CARD_WIDTH - 4 }
        ]}
        onPress={() => handleBidPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText} numberOfLines={1}>
              {item.industry?.slice(0, 4) || '项目'}
            </Text>
          </View>
          <View style={styles.tagRow}>
            {item.is_urgent && (
              <View style={styles.urgentTag}>
                <Text style={styles.urgentTagText}>紧急</Text>
              </View>
            )}
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText} numberOfLines={1}>招标</Text>
            </View>
          </View>
        </View>
        <Text style={styles.bidTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bidBudget}>{formatBudget(item.budget)}元</Text>
        <Text style={styles.bidMeta} numberOfLines={1}>{item.province} · {item.city}</Text>
        <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>
      </TouchableOpacity>
    );
  }, [styles, CARD_WIDTH]);

  if (loading && page === 1) {
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
          </View>
          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
              <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
              <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 统计卡片 - 今日新增、紧急招标、中标信息 */}
        <View style={styles.statsCard}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'today' })}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{stats.todayCount}</Text>
            <Text style={styles.statLabel}>今日新增</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'urgent' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, styles.statValueRed]}>{stats.urgentCount}</Text>
            <Text style={styles.statLabel}>紧急招标</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'win' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, styles.statValueGreen]}>{stats.winBidCount}</Text>
            <Text style={styles.statLabel}>今日中标</Text>
          </TouchableOpacity>
        </View>

        {/* 快捷筛选入口 */}
        <View style={styles.filterSection}>
          <View style={styles.filterContainer}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;
              
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip, 
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterPress(filter.key)}
                >
                  <FontAwesome6 
                    name={filter.icon as any} 
                    size={9} 
                    color={isActive ? '#FFFFFF' : '#1D4ED8'} 
                  />
                  <Text style={[
                    styles.filterChipText, 
                    isActive && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 双列网格招标列表 */}
        <FlatList
          key="home-bids-grid"
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: Spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={40} color="#D1D5DB" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
