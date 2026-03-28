import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ProvinceBidsTab() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProvince, setUserProvince] = useState<string>('北京市');

  useEffect(() => {
    loadUserProvince();
  }, []);

  useEffect(() => {
    if (userProvince) {
      fetchBids();
    }
  }, [userProvince]);

  const loadUserProvince = async () => {
    try {
      const savedProvince = await AsyncStorage.getItem('userProvince');
      if (savedProvince) {
        setUserProvince(savedProvince);
      }
    } catch (error) {
      console.error('获取用户省份失败:', error);
    }
  };

  const fetchBids = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '20');
      params.append('province', userProvince);

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setBids(data.data.list);
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
    fetchBids();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bids}
      renderItem={renderBidItem}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
          <Text style={{ fontSize: 13, color: '#8C8C8C' }}>
            当前显示：{userProvince}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无{userProvince}的招标信息</Text>
        </View>
      }
    />
  );
}
