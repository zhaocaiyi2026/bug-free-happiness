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

interface HistoryItem {
  id: number;
  bid_id: number;
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  deadline: string | null;
  is_urgent: boolean;
  viewed_at: string;
}

// 模拟浏览历史数据
const mockHistory: HistoryItem[] = [
  { id: 1, bid_id: 101, title: '某市智慧城市建设项目招标公告', budget: 58000000, province: '广东', city: '深圳', industry: 'IT服务', deadline: '2026-04-15', is_urgent: true, viewed_at: '2026-03-28T10:00:00' },
  { id: 2, bid_id: 102, title: '2026年度医疗设备集中采购项目', budget: 32000000, province: '北京', city: '北京', industry: '医疗设备', deadline: '2026-04-20', is_urgent: false, viewed_at: '2026-03-28T09:30:00' },
  { id: 3, bid_id: 103, title: '城区道路改造提升工程施工招标', budget: 85000000, province: '浙江', city: '杭州', industry: '建筑工程', deadline: '2026-04-18', is_urgent: true, viewed_at: '2026-03-27T16:00:00' },
  { id: 4, bid_id: 104, title: '新能源充电桩建设运营项目', budget: 12000000, province: '江苏', city: '南京', industry: '环保能源', deadline: '2026-04-22', is_urgent: false, viewed_at: '2026-03-27T14:00:00' },
  { id: 5, bid_id: 105, title: '政务服务系统升级改造项目', budget: 8500000, province: '上海', city: '上海', industry: 'IT服务', deadline: '2026-04-25', is_urgent: false, viewed_at: '2026-03-26T11:00:00' },
  { id: 6, bid_id: 106, title: '城市园林绿化养护工程招标', budget: 15000000, province: '四川', city: '成都', industry: '建筑工程', deadline: '2026-04-28', is_urgent: true, viewed_at: '2026-03-26T09:00:00' },
];

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
  return (
    <TouchableOpacity
      style={[
        styles.bidCard,
        item.is_urgent && styles.bidCardUrgent,
        { width: CARD_WIDTH - 4 }
      ]}
      onPress={() => onPress(item.bid_id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText} numberOfLines={1}>
            {item.industry?.slice(0, 4) || '项目'}
          </Text>
        </View>
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}元</Text>
      <Text style={styles.bidMeta} numberOfLines={1}>{item.province} · {item.city}</Text>
      <Text style={styles.bidTime}>浏览于 {formatViewedAt(item.viewed_at)}</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<HistoryItem[]>(mockHistory);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleClearHistory = () => {
    Alert.alert('清空历史', '确定要清空所有浏览历史吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => setHistory([]),
      },
    ]);
  };

  if (loading) {
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
            <Text style={styles.statsText}>共 {history.length} 条浏览记录</Text>
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
            </View>
          }
        />
      </View>
    </Screen>
  );
}
