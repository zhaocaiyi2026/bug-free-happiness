import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
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

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState(1);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites?userId=${userId}`
      );
      const data = await res.json();

      if (data.success) {
        setFavorites(data.data.list);
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleRemoveFavorite = async (bidId: number) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites/${bidId}?userId=${userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (data.success) {
        setFavorites(favorites.filter((f) => f.bids.id !== bidId));
        Alert.alert('成功', '已取消收藏');
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
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

  if (loading) {
    return (
      <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的收藏</Text>
          <Text style={styles.headerSubtitle}>共 {favorites.length} 条收藏</Text>
        </View>

        <View style={styles.content}>
          {favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="heart" size={48} color="#E5E5E5" />
              <Text style={styles.emptyText}>暂无收藏</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.navigate('/')}
              >
                <Text style={styles.emptyButtonText}>去浏览招标信息</Text>
              </TouchableOpacity>
            </View>
          ) : (
            favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.bidCard}
                onPress={() => handleBidPress(item.bids.id)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.bidCategory}>{item.bids.industry || '综合'}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFavorite(item.bids.id)}>
                    <FontAwesome6 name="heart-crack" size={16} color="#C8102E" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.bidTitle} numberOfLines={2}>
                  {item.bids.title}
                </Text>
                <View style={styles.bidMetaRow}>
                  <Text style={styles.bidMetaItem}>
                    {item.bids.province} {item.bids.city}
                  </Text>
                  <Text style={styles.bidMetaItem}>截止 {formatDate(item.bids.deadline)}</Text>
                </View>
                <Text style={styles.bidBudget}>{formatBudget(item.bids.budget)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
