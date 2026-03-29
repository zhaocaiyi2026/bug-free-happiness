import { API_BASE_URL } from '@/constants/api';
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
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
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

interface WinBid {
  id: number;
  title: string;
  win_amount: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  win_company: string | null;
  publish_date: string | null;
}

type ListType = 'today' | 'urgent' | 'nearby' | 'search' | 'win';

const LIST_CONFIG: Record<ListType, { title: string; icon: string; isWinBid?: boolean }> = {
  today: { title: '今日新增', icon: 'calendar-day' },
  urgent: { title: '紧急招标', icon: 'bolt' },
  nearby: { title: '本省项目', icon: 'location-dot' },
  search: { title: '搜索结果', icon: 'magnifying-glass' },
  win: { title: '今日中标', icon: 'trophy', isWinBid: true },
};

export default function BidListScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ type: ListType; keyword?: string; industry?: string }>();
  const insets = useSafeAreaInsets();

  const listType = params.type || 'today';
  const config = LIST_CONFIG[listType] || LIST_CONFIG.today;
  const isWinBidList = config.isWinBid === true;

  const [bids, setBids] = useState<Bid[]>([]);
  const [winBids, setWinBids] = useState<WinBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData(1);
  }, [listType, params.keyword, params.industry]);

  const fetchData = async (pageNum: number) => {
    try {
      // 中标信息使用不同的API
      if (isWinBidList) {
        await fetchWinBids(pageNum);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('page', String(pageNum));
      queryParams.append('pageSize', '20');

      // 根据类型设置筛选条件
      switch (listType) {
        case 'today': {
          // 今日新增：发布日期为今天（使用本地日期，避免时区问题）
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;
          
          // 明天的日期
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowYear = tomorrow.getFullYear();
          const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
          const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
          const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
          
          queryParams.append('publishDateFrom', todayStr);
          queryParams.append('publishDateTo', tomorrowStr);
          break;
        }
        case 'urgent':
          // 紧急招标：投标截止日期在4天内且未过期
          queryParams.append('isUrgent', 'true');
          break;
        case 'nearby':
          // 本省项目（默认广东省）
          queryParams.append('province', '广东省');
          break;
        case 'search':
          // 搜索结果
          if (params.keyword) {
            queryParams.append('keyword', params.keyword);
          }
          if (params.industry) {
            queryParams.append('industry', params.industry);
          }
          break;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/v1/bids?${queryParams.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setBids(data.data.list);
          setTotal(data.data.total);
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

  // 获取今日中标信息
  const fetchWinBids = async (pageNum: number) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(pageNum));
      queryParams.append('pageSize', '20');
      queryParams.append('today', 'true');

      const res = await fetch(
        `${API_BASE_URL}/api/v1/win-bids?${queryParams.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setWinBids(data.data.list);
          setTotal(data.data.total);
        } else {
          setWinBids((prev) => [...prev, ...data.data.list]);
        }
        setHasMore(data.data.page < data.data.totalPages);
      }
    } catch (error) {
      console.error('获取中标列表失败:', error);
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

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleWinBidPress = (winBidId: number) => {
    router.push('/win-bid-detail', { id: winBidId });
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

  const formatPublishDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日发布`;
  };

  const renderBidItem = useCallback(({ item, index }: { item: Bid; index: number }) => (
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
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>招标</Text>
        </View>
        {item.is_urgent && (
          <View style={styles.urgentTag}>
            <Text style={styles.urgentTagText}>紧急</Text>
          </View>
        )}
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}元</Text>
      <Text style={styles.bidMeta} numberOfLines={1}>{item.province} · {item.city}</Text>
      {listType === 'today' ? (
        <Text style={styles.bidDeadline}>{formatPublishDate(item.publish_date)}</Text>
      ) : listType === 'urgent' ? (
        <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>
      ) : (
        <Text style={styles.bidDeadline}>发布 {formatPublishDate(item.publish_date)}</Text>
      )}
    </TouchableOpacity>
  ), [styles, CARD_WIDTH, listType]);

  const renderWinBidItem = useCallback(({ item, index }: { item: WinBid; index: number }) => (
    <TouchableOpacity
      style={[styles.bidCard, styles.winBidCard, { width: CARD_WIDTH - 4 }]}
      onPress={() => handleWinBidPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryTag, styles.winCategoryTag]}>
          <Text style={styles.categoryTagText} numberOfLines={1}>
            {item.industry?.slice(0, 4) || '中标'}
          </Text>
        </View>
        <View style={styles.winTag}>
          <FontAwesome6 name="trophy" size={10} color="#FFFFFF" />
          <Text style={styles.winTagText}>中标</Text>
        </View>
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.bidBudget, styles.winBudget]}>{formatBudget(item.win_amount)}元</Text>
      <Text style={styles.bidMeta} numberOfLines={1}>{item.province} · {item.city}</Text>
      <Text style={[styles.bidDeadline, styles.winCompany]} numberOfLines={1}>
        {formatPublishDate(item.publish_date)} · {item.win_company}
      </Text>
    </TouchableOpacity>
  ), [styles, CARD_WIDTH]);

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isWinBidList ? '#059669' : '#2563EB'} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, isWinBidList && styles.winHeader, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <FontAwesome6 name={config.icon as any} size={16} color="#FFFFFF" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>{config.title}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerCount}>{total}条</Text>
            </View>
          </View>
        </View>

        {/* 统计条 */}
        <View style={styles.statsBar}>
          <View style={styles.statsItem}>
            <FontAwesome6 
              name={isWinBidList ? "trophy" : "file-lines"} 
              size={14} 
              color={isWinBidList ? '#059669' : '#2563EB'} 
            />
            <Text style={styles.statsText}>
              共 {total} 条{isWinBidList ? '今日中标' : '招标'}信息
            </Text>
          </View>
          <View style={styles.statsItem}>
            <FontAwesome6 name="clock" size={14} color="#6B7280" />
            <Text style={styles.statsTextMuted}>
              {isWinBidList ? '今日发布' : listType === 'today' ? '今日发布' : listType === 'urgent' ? '紧急处理' : '本省项目'}
            </Text>
          </View>
        </View>

        {/* 双列网格列表 */}
        {isWinBidList ? (
          <FlatList
            key="win-bids-list"
            data={winBids}
            renderItem={renderWinBidItem}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#059669']}
                tintColor="#059669"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && page > 1 ? (
                <ActivityIndicator size="small" color="#059669" style={{ marginVertical: Spacing.md }} />
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome6 name="trophy" size={40} color="#D1D5DB" style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>暂无今日中标信息</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            key={`bids-list-${listType}`}
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
        )}
      </View>
    </Screen>
  );
}
