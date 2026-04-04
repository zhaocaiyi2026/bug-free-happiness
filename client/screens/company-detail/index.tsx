import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Project {
  id: string;
  type: '招标' | '中标';
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  deadline: string | null;
  publish_date: string | null;
  role: string;
}

export default function CompanyDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  
  const params = useSafeSearchParams<{ company?: string }>();
  const companyName = params?.company || '';
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, bidCount: 0, winBidCount: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (pageNum: number, isRefresh = false) => {
    if (!companyName) return;
    
    try {
      if (pageNum === 1) setLoading(true);
      
      const res = await fetch(
        `${API_BASE_URL}/api/v1/potential-customers/company/${encodeURIComponent(companyName)}?page=${pageNum}&pageSize=20`
      );
      const data = await res.json();
      
      if (data.success) {
        if (pageNum === 1 || isRefresh) {
          setProjects(data.data.list);
        } else {
          setProjects(prev => [...prev, ...data.data.list]);
        }
        setStats({
          total: data.data.total,
          bidCount: data.data.bidCount,
          winBidCount: data.data.winBidCount,
        });
        setHasMore(data.data.page < data.data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取公司信息失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [companyName]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchData(page + 1);
    }
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return '-';
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万元`;
    }
    return `${budget}元`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => {
        if (item.type === '招标') {
          router.push('/detail', { id: item.id.replace('bid_', '') });
        } else {
          router.push('/win-bid-detail', { id: item.id.replace('winbid_', '') });
        }
      }}
    >
      <View style={styles.projectHeader}>
        <View style={[styles.typeTag, item.type === '中标' && styles.typeTagWin]}>
          <Text style={[styles.typeTagText, item.type === '中标' && styles.typeTagTextWin]}>
            {item.type}
          </Text>
        </View>
        <Text style={styles.projectTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      
      <View style={styles.projectInfo}>
        {item.budget && (
          <Text style={styles.budgetText}>预算 {formatBudget(item.budget)}</Text>
        )}
        <Text style={styles.metaText}>
          {item.province}{item.city ? `·${item.city}` : ''}
        </Text>
      </View>
      
      <View style={styles.projectFooter}>
        <Text style={styles.dateText}>发布于 {formatDate(item.publish_date)}</Text>
        <FontAwesome6 name="chevron-right" size={12} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{companyName}</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* 统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>相关项目</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.bidCount}</Text>
            <Text style={styles.statLabel}>招标</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.winBidCount}</Text>
            <Text style={styles.statLabel}>中标</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
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
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="folder-open" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>暂无相关项目信息</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
