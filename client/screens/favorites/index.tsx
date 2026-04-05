import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
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
  deadline: string | null;
  is_urgent: boolean;
}

interface Favorite {
  id: number;
  bids: Bid;
  created_at: string;
}

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId] = useState(1);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const fetchFavorites = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/favorites?userId=${userId}`
      );
      const data = await res.json();

      if (data.success) {
        setFavorites(data.data.list);
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleBidPress = useCallback((bidId: number) => {
    router.push('/detail', { id: bidId });
  }, [router]);

  const handleRemoveFavorite = useCallback((bidId: number, title: string) => {
    Alert.alert('取消收藏', `确定要取消收藏「${title.slice(0, 20)}...」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/v1/favorites/${bidId}?userId=${userId}`,
              { method: 'DELETE' }
            );
            const data = await res.json();

            if (data.success) {
              // 使用函数式更新确保状态正确
              setFavorites(prev => prev.filter((f) => f.bids.id !== bidId));
              Alert.alert('成功', '已取消收藏');
            } else {
              Alert.alert('错误', data.message || '取消收藏失败');
            }
          } catch (error) {
            console.error('取消收藏失败:', error);
            Alert.alert('错误', '取消收藏失败，请重试');
          }
        },
      },
    ]);
  }, [userId]);

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

  const renderFavoriteItem = useCallback(({ item }: { item: Favorite }) => (
    <TouchableOpacity
      style={[styles.bidCard, item.bids.is_urgent && styles.bidCardUrgent]}
      onPress={() => handleBidPress(item.bids.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText} numberOfLines={1}>
            {item.bids.industry?.slice(0, 4) || '项目'}
          </Text>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{item.bids.bid_type || '招标'}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.bids.id, item.bids.title)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome6 name="heart" size={16} color="#C8102E" solid />
        </TouchableOpacity>
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>
        {item.bids.title}
      </Text>
      <Text style={styles.bidBudget}>{formatBudget(item.bids.budget)}元</Text>
      <View style={styles.bidFooter}>
        <Text style={styles.bidMeta} numberOfLines={1}>{item.bids.province} · {item.bids.city}</Text>
        {item.bids.deadline && <Text style={styles.bidDeadline}>截止 {formatDeadline(item.bids.deadline)}</Text>}
      </View>
    </TouchableOpacity>
  ), [styles, handleRemoveFavorite]);

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>我的收藏</Text>
            <View style={{ width: 36 }} />
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
            <Text style={styles.headerTitle}>我的收藏</Text>
            <Text style={styles.headerCount}>{favorites.length}条</Text>
          </View>
        </View>

        {/* 统计条 */}
        <View style={styles.statsBar}>
          <View style={styles.statsItem}>
            <FontAwesome6 name="heart" size={14} color="#C8102E" />
            <Text style={styles.statsText}>共 {favorites.length} 条收藏</Text>
          </View>
        </View>

        {/* 收藏列表 */}
        <FlatList
          key="favorites-list"
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => String(item.id)}
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
              <FontAwesome6 name="heart" size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>暂无收藏</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.navigate('/')}
              >
                <Text style={styles.emptyButtonText}>去浏览招标信息</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
