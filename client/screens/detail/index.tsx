import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface Bid {
  id: number;
  title: string;
  content: string | null;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  publish_date: string | null;
  deadline: string | null;
  source: string | null;
  source_url: string | null;
  is_urgent: boolean;
  view_count: number;
}

export default function DetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ id: number }>();

  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId] = useState(1); // 模拟用户ID，实际应从登录状态获取

  useEffect(() => {
    if (params.id) {
      fetchBidDetail();
      checkFavorite();
    }
  }, [params.id]);

  const fetchBidDetail = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids/${params.id}`
      );
      const data = await res.json();

      if (data.success) {
        setBid(data.data);
      } else {
        Alert.alert('错误', data.message || '获取招标详情失败');
        router.back();
      }
    } catch (error) {
      console.error('获取招标详情失败:', error);
      Alert.alert('错误', '获取招标详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites/check?userId=${userId}&bidId=${params.id}`
      );
      const data = await res.json();

      if (data.success) {
        setIsFavorite(data.data.isFavorite);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        // 取消收藏
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites/${params.id}?userId=${userId}`,
          { method: 'DELETE' }
        );
        const data = await res.json();

        if (data.success) {
          setIsFavorite(false);
          Alert.alert('成功', '已取消收藏');
        }
      } else {
        // 添加收藏
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/favorites`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bidId: params.id }),
          }
        );
        const data = await res.json();

        if (data.success) {
          setIsFavorite(true);
          Alert.alert('成功', '收藏成功');
        } else {
          Alert.alert('提示', data.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      Alert.alert('错误', '操作失败，请重试');
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
    if (!dateStr) return '暂无';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

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

  if (!bid) return null;

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>招标详情</Text>
          </View>
          <Text style={styles.category}>{bid.industry || '综合'}</Text>
          <Text style={styles.title}>{bid.title}</Text>
          {bid.is_urgent && (
            <View style={styles.urgentBadge}>
              <FontAwesome6 name="triangle-exclamation" size={12} color="#FFFFFF" />
              <Text style={styles.urgentBadgeText}>紧急招标</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* 元信息卡片 */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <FontAwesome6 name="money-bill-wave" size={20} color="#C8102E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>项目预算</Text>
                <Text style={styles.budgetValue}>{formatBudget(bid.budget)}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <FontAwesome6 name="location-dot" size={20} color="#1A1A1A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>项目地点</Text>
                <Text style={styles.metaValue}>
                  {bid.province} {bid.city}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <FontAwesome6 name="calendar" size={20} color="#1A1A1A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>发布时间</Text>
                <Text style={styles.metaValue}>{formatDate(bid.publish_date)}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <FontAwesome6 name="clock" size={20} color="#C8102E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>截止时间</Text>
                <Text style={styles.metaValue}>{formatDate(bid.deadline)}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <FontAwesome6 name="eye" size={20} color="#1A1A1A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>浏览次数</Text>
                <Text style={styles.metaValue}>{bid.view_count} 次</Text>
              </View>
            </View>
          </View>

          {/* 项目详情 */}
          <Text style={styles.sectionTitle}>项目详情</Text>
          <Text style={styles.contentText}>{bid.content || '暂无详情'}</Text>

          <View style={styles.divider} />

          {/* 信息来源 */}
          <View style={styles.sourceCard}>
            <Text style={styles.sourceLabel}>信息来源</Text>
            <Text style={styles.sourceValue}>{bid.source || '官方渠道'}</Text>
            {bid.source_url && (
              <Text style={{ fontSize: 12, color: '#C8102E' }}>查看原文</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleToggleFavorite}
        >
          <FontAwesome6
            name={isFavorite ? 'heart' : 'heart'}
            size={18}
            color={isFavorite ? '#C8102E' : '#1A1A1A'}
          />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            {isFavorite ? '已收藏' : '收藏'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
          <FontAwesome6 name="bell" size={18} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>设置提醒</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
