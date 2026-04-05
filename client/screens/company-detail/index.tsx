import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
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
  contact_person: string | null;
  contact_phone: string | null;
  address: string | null;
  content: string | null;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleCall = (phone: string) => {
    const url = `tel:${phone}`;
    if (Platform.OS === 'web') {
      window.location.href = url;
    } else {
      Linking.openURL(url);
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
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderProjectItem = ({ item }: { item: Project }) => {
    const isWin = item.type === '中标';
    const isExpanded = expandedId === item.id;
    const hasContent = item.content && item.content.length > 50;
    
    return (
      <TouchableOpacity 
        style={styles.projectCard}
        activeOpacity={0.7}
      >
        {/* 标题区 */}
        <View style={styles.projectHeader}>
          <View style={styles.projectTags}>
            <View style={[styles.industryTag, isWin && styles.industryTagWin]}>
              <Text style={[styles.industryTagText, isWin && styles.industryTagTextWin]}>
                {item.industry || '未分类'}
              </Text>
            </View>
            <View style={[styles.typeTag, isWin && styles.typeTagWin]}>
              <Text style={[styles.typeTagText, isWin && styles.typeTagTextWin]}>
                {isWin ? '已中标' : '招标中'}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.projectTitle} numberOfLines={isExpanded ? undefined : 2}>{item.title}</Text>
        
        {/* 金额 */}
        {item.budget && (
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>{isWin ? '中标金额' : '预算金额'}</Text>
            <Text style={[styles.budgetValue, isWin && styles.budgetValueWin]}>
              {formatBudget(item.budget)}
            </Text>
          </View>
        )}
        
        {/* 信息网格 */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <FontAwesome6 name="location-dot" size={12} color="#6B7280" />
            <Text style={styles.infoText}>
              {item.province}{item.city ? `·${item.city}` : ''}
            </Text>
          </View>
          {item.deadline && (
            <View style={styles.infoItem}>
              <FontAwesome6 name="calendar" size={12} color="#6B7280" />
              <Text style={styles.infoText}>
                {isWin ? '中标' : '截止'}：{formatDate(item.deadline)}
              </Text>
            </View>
          )}
          <View style={styles.infoItem}>
            <FontAwesome6 name="clock" size={12} color="#6B7280" />
            <Text style={styles.infoText}>发布：{formatDate(item.publish_date)}</Text>
          </View>
        </View>
        
        {/* 地址信息 */}
        {item.address && (
          <View style={styles.addressRow}>
            <FontAwesome6 name="building" size={12} color="#6B7280" />
            <Text style={styles.addressText} numberOfLines={2}>{item.address}</Text>
          </View>
        )}
        
        {/* 项目详情 */}
        {hasContent && (
          <View style={styles.contentSection}>
            <TouchableOpacity 
              style={styles.contentToggle}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <Text style={styles.contentToggleText}>
                {isExpanded ? '收起详情' : '展开详情'}
              </Text>
              <FontAwesome6 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={12} 
                color="#2563EB" 
              />
            </TouchableOpacity>
            {isExpanded && (
              <Text style={styles.contentText}>{item.content}</Text>
            )}
          </View>
        )}
        
        {/* 联系方式 */}
        {item.contact_phone && (
          <View style={styles.contactRow}>
            <View style={styles.contactInfo}>
              <FontAwesome6 name="phone" size={12} color="#2563EB" />
              <Text style={styles.contactText}>{item.contact_phone}</Text>
              {item.contact_person && (
                <Text style={styles.contactPerson}>({item.contact_person})</Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.callButton, isWin && styles.callButtonWin]}
              onPress={(e) => {
                e.stopPropagation();
                handleCall(item.contact_phone!);
              }}
            >
              <FontAwesome6 name="phone" size={12} color="#FFFFFF" />
              <Text style={styles.callButtonText}>拨打</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* 底部 */}
        <View style={styles.projectFooter}>
          <Text style={styles.roleText}>
            {item.role === '招标方' ? '作为招标方' : '作为中标方'}
          </Text>
          <FontAwesome6 name="chevron-right" size={12} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

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
            <Text style={[styles.statValue, { color: '#60A5FA' }]}>{stats.bidCount}</Text>
            <Text style={styles.statLabel}>招标</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#34D399' }]}>{stats.winBidCount}</Text>
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
