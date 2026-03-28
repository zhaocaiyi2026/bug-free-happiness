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

export default function CityBidsTab() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCity, setUserCity] = useState<string>('北京市');

  useEffect(() => {
    loadUserCity();
  }, []);

  useEffect(() => {
    if (userCity) {
      fetchBids();
    }
  }, [userCity]);

  const loadUserCity = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('userCity');
      if (savedCity) {
        setUserCity(savedCity);
      }
    } catch (error) {
      console.error('获取用户城市失败:', error);
    }
  };

  const fetchBids = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '20');
      params.append('city', userCity);

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

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const renderBidItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity
      style={[styles.bidCard, item.is_urgent && styles.bidCardUrgent]}
      onPress={() => handleBidPress(item.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.industry?.slice(0, 4) || '项目'}</Text>
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
      <Text style={styles.bidMeta}>{item.province} · {item.city}</Text>
      <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <FlatList
      key="city-bids-list"
      data={bids}
      renderItem={renderBidItem}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />}
      ListHeaderComponent={
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoText}>当前：{userCity}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无{userCity}的招标信息</Text>
        </View>
      }
    />
  );
}
