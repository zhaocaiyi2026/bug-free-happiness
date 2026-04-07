import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

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
  deadline: string | null;
  is_urgent: boolean;
}

interface HistoryItem {
  id: number;
  viewed_at: string;
  bids: Bid;
}

const formatBudget = (budget: number | null) => {
  if (!budget) return '面议';
  if (budget >= 100000000) {
    return `${(budget / 100000000).toFixed(1)}亿`;
  } else if (budget >= 10000) {
    return `${(budget / 10000).toFixed(0)}万`;
  }
  return `${budget}`;
};

const formatViewedAt = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 独立的列表项组件
interface HistoryItemCardProps {
  item: HistoryItem;
  styles: ReturnType<typeof createStyles>;
  onPress: (bidId: number) => void;
}

function HistoryItemCard({ item, styles, onPress }: HistoryItemCardProps) {
  const bid = item.bids;
  return (
    <TouchableOpacity
      style={[
        styles.bidCard,
        bid.is_urgent && styles.bidCardUrgent,
        { width: CARD_WIDTH - 4 }
      ]}
      onPress={() => onPress(bid.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText} numberOfLines={1}>
            {bid.classifiedIndustry && bid.classifiedIndustry.trim() !== '' ? bid.classifiedIndustry.slice(0, 4) : '项目'}
          </Text>
        </View>
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {bid.title}
      </Text>
      <Text style={styles.bidBudget}>{formatBudget(bid.budget)}元</Text>
      <Text style={styles.bidMeta} numberOfLines={1}>{bid.province} · {bid.city}</Text>
      <Text style={styles.bidTime}>浏览于 {formatViewedAt(item.viewed_at)}</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const [userId] = useState(1);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  /**
   * 服务端文件：server/src/routes/browse-history.ts
   * 接口：GET /api/v1/browse-history
   * Query 参数：userId: number, page: number, pageSize: number
   */
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/v1/browse-history?userId=${userId}&page=1&pageSize=50`
      );
      const data = await res.json();

      if (data.success) {
        setHistory(data.data.list as HistoryItem[]);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('获取浏览历史失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  /**
   * 服务端文件：server/src/routes/browse-history.ts
   * 接口：DELETE /api/v1/browse-history
   * Query 参数：userId: number
   */
  const handleClearHistory = () => {
    Alert.alert('清空历史', '确定要清空所有浏览历史吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/v1/browse-history?userId=${userId}`,
              { method: 'DELETE' }
            );
            const data = await res.json();

            if (data.success) {
              setHistory([]);
              setTotal(0);
            }
          } catch (error) {
            console.error('清空历史失败:', error);
            Alert.alert('错误', '清空历史失败');
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>浏览历史</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>浏览历史</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearButton}>清空</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 统计条 */}
        <View style={styles.statsBar}>
          <View style={styles.statsItem}>
            <FontAwesome6 name="clock-rotate-left" size={14} color="#2563EB" />
            <Text style={styles.statsText}>共 {total} 条浏览记录</Text>
          </View>
        </View>

        {/* 双列网格列表 */}
        <FlatList
          key="history-list"
          data={history}
          renderItem={({ item }) => (
            <HistoryItemCard item={item} styles={styles} onPress={handleBidPress} />
          )}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="clock" size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>暂无浏览记录</Text>
              <Text style={styles.emptySubtext}>浏览过的招标信息会在这里显示</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
