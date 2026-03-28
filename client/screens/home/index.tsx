import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';

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

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [urgentBids, setUrgentBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 并行获取招标列表和紧急招标
      const [bidsRes, urgentRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?page=1&pageSize=20`),
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids/urgent/list`),
      ]);

      const bidsData = await bidsRes.json();
      const urgentData = await urgentRes.json();

      if (bidsData.success) {
        setBids(bidsData.data.list);
      }
      if (urgentData.success) {
        setUrgentBids(urgentData.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return '预算面议';
    if (budget >= 100000000) {
      return `${(budget / 100000000).toFixed(2)}亿元`;
    } else if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万元`;
    }
    return `${budget}元`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleSearchPress = () => {
    router.navigate('/search');
  };

  const renderUrgentItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity style={styles.urgentCard} onPress={() => handleBidPress(item.id)}>
      <View style={styles.urgentBadge}>
        <FontAwesome6 name="triangle-exclamation" size={14} color="#C8102E" />
        <Text style={styles.urgentBadgeText}>紧急招标</Text>
      </View>
      <Text style={styles.urgentTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.urgentBudget}>{formatBudget(item.budget)}</Text>
      <Text style={styles.urgentMeta}>
        {item.province} {item.city} · 截止 {formatDate(item.deadline)}
      </Text>
    </TouchableOpacity>
  );

  const renderBidItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity style={styles.bidCard} onPress={() => handleBidPress(item.id)}>
      <Text style={styles.bidCategory}>{item.industry || '综合'}</Text>
      <Text style={styles.bidTitle} numberOfLines={3}>
        {item.title}
      </Text>
      <View style={styles.bidMetaRow}>
        <Text style={styles.bidMetaItem}>{item.province} {item.city}</Text>
        {item.bid_type && (
          <>
            <View style={{ width: 1, height: 12, backgroundColor: '#E5E5E5', marginRight: Spacing.md }} />
            <Text style={styles.bidMetaItem}>{item.bid_type}</Text>
          </>
        )}
      </View>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}</Text>
      <Text style={styles.bidDate}>发布于 {formatDate(item.publish_date)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>招标信息</Text>
              <Text style={styles.headerSubtitle}>TENDER INFO</Text>
            </View>
            <TouchableOpacity onPress={() => router.navigate('/profile')}>
              <FontAwesome6 name="user" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#8C8C8C" />
            <Text style={styles.searchButtonText}>搜索招标信息...</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* 紧急招标 */}
          {urgentBids.length > 0 && (
            <View style={styles.urgentContainer}>
              <Text style={styles.sectionTitle}>紧急招标</Text>
              <FlatList
                data={urgentBids}
                renderItem={renderUrgentItem}
                keyExtractor={(item) => `urgent-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.urgentScroll}
              />
            </View>
          )}

          {/* 招标列表 */}
          <Text style={styles.sectionTitle}>最新招标</Text>
          <View style={styles.listContainer}>
            {bids.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : (
              bids.map((item) => (
                <View key={item.id}>{renderBidItem({ item })}</View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

// 需要导入 Spacing
import { Spacing } from '@/constants/theme';
