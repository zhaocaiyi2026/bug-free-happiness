import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2;

interface Bid {
  id: number;
  title: string;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  announcement_type?: string | null;  // 实际公告类型：招标、废标公告、终止公告等
  publish_date: string | null;
  deadline: string | null;
  is_urgent: boolean;
  view_count: number;
  isWinBid?: boolean;
  winCompany?: string;
}

interface Stats {
  todayCount: number;
  urgentCount: number;
  winBidCount: number;
}

interface UserLocation {
  province: string;
  city: string;
}

interface Province {
  id: number;
  name: string;
  code: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
  code: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  // 各标签数据缓存
  const [bidsCache, setBidsCache] = useState<Record<string, Bid[]>>({
    all: [],
    province: [],
    city: [],
    provinceWin: [],
  });
  // 各标签是否已加载过
  const [hasLoaded, setHasLoaded] = useState<Record<string, boolean>>({
    all: false,
    province: false,
    city: false,
    provinceWin: false,
  });
  // 各标签的分页状态
  const [pageCache, setPageCache] = useState<Record<string, number>>({
    all: 1,
    province: 1,
    city: 1,
    provinceWin: 1,
  });
  // 各标签是否还有更多数据
  const [hasMoreCache, setHasMoreCache] = useState<Record<string, boolean>>({
    all: true,
    province: true,
    city: true,
    provinceWin: true,
  });
  
  const [stats, setStats] = useState<Stats>({ 
    todayCount: 156, 
    urgentCount: 8, 
    winBidCount: 32,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeFilter, setActiveFilter] = useState('all');
  
  // 地区选择相关
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationStep, setLocationStep] = useState<'province' | 'city'>('province');
  const [loadingCities, setLoadingCities] = useState(false);
  
  const activeFilterRef = useRef<string>('all');
  const loadingRef = useRef(false);
  
  // 当前标签的数据
  const bids = bidsCache[activeFilter] || [];
  const page = pageCache[activeFilter] || 1;
  const hasMore = hasMoreCache[activeFilter] ?? true;

  // 快捷入口 - 固定4个
  const quickActions = [
    { key: 'all', label: '全部招标', icon: 'layer-group', color: '#2563EB', bgColor: '#EFF6FF', activeBgColor: '#2563EB' },
    { key: 'province', label: '本省招标', icon: 'map-location-dot', color: '#7C3AED', bgColor: '#F5F3FF', activeBgColor: '#7C3AED' },
    { key: 'city', label: '本市招标', icon: 'city', color: '#EA580C', bgColor: '#FFF7ED', activeBgColor: '#EA580C' },
    { key: 'provinceWin', label: '本省中标', icon: 'trophy', color: '#059669', bgColor: '#ECFDF5', activeBgColor: '#059669' },
  ];

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/bids/stats`);
      const data = await res.json();
      if (data.success) {
        setStats({
          todayCount: data.data.todayBids || 0,
          urgentCount: data.data.urgentBids || 0,
          winBidCount: data.data.todayWinBids || 0,
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchData = async (pageNum: number, filterKey: string, province?: string, city?: string, isRefresh = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const isWinBidFilter = filterKey === 'provinceWin' || filterKey === 'cityWin';
      
      if (filterKey === 'all') {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        const res = await fetch(`${API_BASE_URL}/api/v1/bids?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const bidItems = data.data.list.map((item: Bid) => ({
            ...item,
            isWinBid: false,
          }));
          
          setBidsCache(prev => ({
            ...prev,
            [filterKey]: pageNum === 1 ? bidItems : [...prev[filterKey], ...bidItems]
          }));
          setPageCache(prev => ({ ...prev, [filterKey]: pageNum }));
          setHasMoreCache(prev => ({ ...prev, [filterKey]: data.data.page < data.data.totalPages }));
          setHasLoaded(prev => ({ ...prev, [filterKey]: true }));
        } else {
          if (pageNum === 1) {
            setBidsCache(prev => ({ ...prev, [filterKey]: [] }));
          }
          setHasMoreCache(prev => ({ ...prev, [filterKey]: false }));
        }
      } else if (isWinBidFilter) {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (province) {
          params.append('province', province);
        }
        if (city) {
          params.append('city', city);
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/win-bids?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const winBidItems = data.data.list.map((item: any) => ({
            id: item.id,
            title: item.title,
            budget: item.win_amount,
            province: item.province,
            city: item.city,
            industry: item.industry,
            bid_type: item.bid_type || '中标',
            announcement_type: item.bid_type || item.data_type || '中标公告',
            publish_date: item.publish_date,
            deadline: null,
            is_urgent: false,
            view_count: 0,
            isWinBid: true,
            winCompany: item.win_company,
          }));
          
          setBidsCache(prev => ({
            ...prev,
            [filterKey]: pageNum === 1 ? winBidItems : [...prev[filterKey], ...winBidItems]
          }));
          setPageCache(prev => ({ ...prev, [filterKey]: pageNum }));
          setHasMoreCache(prev => ({ ...prev, [filterKey]: data.data.page < data.data.totalPages }));
          setHasLoaded(prev => ({ ...prev, [filterKey]: true }));
        } else {
          if (pageNum === 1) {
            setBidsCache(prev => ({ ...prev, [filterKey]: [] }));
          }
          setHasMoreCache(prev => ({ ...prev, [filterKey]: false }));
        }
      } else {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (province) {
          params.append('province', province);
        }
        if (city) {
          params.append('city', city);
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/bids?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const bidItems = data.data.list.map((item: Bid) => ({
            ...item,
            isWinBid: false,
            bidType: '招标' as const,
          }));
          
          setBidsCache(prev => ({
            ...prev,
            [filterKey]: pageNum === 1 ? bidItems : [...prev[filterKey], ...bidItems]
          }));
          setPageCache(prev => ({ ...prev, [filterKey]: pageNum }));
          setHasMoreCache(prev => ({ ...prev, [filterKey]: data.data.page < data.data.totalPages }));
          setHasLoaded(prev => ({ ...prev, [filterKey]: true }));
        } else {
          if (pageNum === 1) {
            setBidsCache(prev => ({ ...prev, [filterKey]: [] }));
          }
          setHasMoreCache(prev => ({ ...prev, [filterKey]: false }));
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setHasMoreCache(prev => ({ ...prev, [filterKey]: false }));
      if (pageNum === 1) {
        setBidsCache(prev => ({ ...prev, [filterKey]: [] }));
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 获取省份列表
  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/common/provinces`);
      const data = await res.json();
      if (data.success && data.data) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('获取省份列表失败:', error);
    }
  };

  // 获取城市列表
  const fetchCities = async (provinceId: number) => {
    try {
      setLoadingCities(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/common/cities?provinceId=${provinceId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCities(data.data);
      }
    } catch (error) {
      console.error('获取城市列表失败:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // 页面首次加载时获取数据
  // 使用 useEffect 而非 useFocusEffect，避免从详情页返回时自动刷新
  useEffect(() => {
    // 并行请求：统计数据 + 省份列表 + 首屏招标列表
    Promise.all([
      fetchStats(),
      fetchProvinces(),
      fetchData(1, 'all', undefined, undefined, true),
    ]);
  }, []);

  const handleFilterPress = async (filterKey: string) => {
    // 如果点击的是当前已选中的标签，不做任何操作
    if (filterKey === activeFilter) return;
    
    // 先切换标签
    setActiveFilter(filterKey);
    activeFilterRef.current = filterKey;
    
    // 如果已经加载过数据且有缓存，直接显示缓存，不刷新
    if (hasLoaded[filterKey] && bidsCache[filterKey]?.length > 0) {
      return;
    }
    
    // 如果没有缓存数据，需要根据情况获取数据
    if (filterKey === 'province' || filterKey === 'provinceWin') {
      if (selectedProvince) {
        // 已选择省份，发起请求获取数据
        fetchData(1, filterKey, selectedProvince.name);
        return;
      }
      // 未选择省份，提示用户先选择地区
      Alert.alert('提示', '请先在顶部选择地区，或点击地区图标设置您的关注地区');
      return;
    }
    
    if (filterKey === 'city') {
      if (selectedProvince && selectedCity) {
        // 已选择城市，获取该市数据
        fetchData(1, filterKey, selectedProvince.name, selectedCity.name);
        return;
      } else if (selectedProvince && !selectedCity) {
        // 只选了省份但未选城市，提示用户选择城市
        Alert.alert('提示', '您已选择省份，请点击顶部地区图标选择具体城市，或使用"本省招标"查看全省数据');
        return;
      }
      // 未选择地区，提示用户
      Alert.alert('提示', '请先在顶部选择地区，或点击地区图标设置您的关注地区');
      return;
    }
    
    // 全部招标 - 如果没有数据则获取
    if (!hasLoaded.all) {
      fetchData(1, 'all');
    }
  };

  // 选择省份后的处理 - 立即切换到城市选择页面，不等待加载
  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    
    // 立即切换到城市选择页面
    setLocationStep('city');
    
    // 异步加载城市列表
    fetchCities(province.id);
  };

  // 选择城市后的处理 - 只保存选择，不跳转标签不加载数据
  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    
    // 清除地区相关缓存（因为地区变了）
    setBidsCache(prev => ({
      ...prev,
      province: [],
      city: [],
      provinceWin: [],
    }));
    setHasLoaded(prev => ({
      ...prev,
      province: false,
      city: false,
      provinceWin: false,
    }));
    
    setLocationModalVisible(false);
    // 不再自动跳转到城市标签，不再自动获取数据
  };

  // 不选择城市，只按省份筛选 - 只保存选择，关闭弹窗
  const handleConfirmProvince = () => {
    if (!selectedProvince) return;
    
    // 清除地区相关缓存（因为地区变了）
    setBidsCache(prev => ({
      ...prev,
      province: [],
      city: [],
      provinceWin: [],
    }));
    setHasLoaded(prev => ({
      ...prev,
      province: false,
      city: false,
      provinceWin: false,
    }));
    
    setLocationModalVisible(false);
    // 不再自动跳转标签，不再自动获取数据
  };

  // 清除地区选择
  const handleClearLocation = () => {
    setSelectedProvince(null);
    setSelectedCity(null);
    setCities([]);
    
    // 清除地区相关缓存
    setBidsCache(prev => ({
      ...prev,
      province: [],
      city: [],
      provinceWin: [],
    }));
    setHasLoaded(prev => ({
      ...prev,
      province: false,
      city: false,
      provinceWin: false,
    }));
    // 不再自动切换到全部招标标签
  };

  const handleRefresh = () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    
    // 重置当前标签的缓存
    setPageCache(prev => ({ ...prev, [activeFilter]: 1 }));
    setHasMoreCache(prev => ({ ...prev, [activeFilter]: true }));
    
    // 刷新统计数据
    fetchStats();
    
    // 根据当前标签获取数据
    if (activeFilter === 'province' || activeFilter === 'provinceWin') {
      fetchData(1, activeFilter, selectedProvince?.name, undefined, true);
    } else if (activeFilter === 'city') {
      fetchData(1, activeFilter, selectedProvince?.name, selectedCity?.name, true);
    } else {
      fetchData(1, activeFilter, undefined, undefined, true);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingRef.current && !loadingMore) {
      const nextPage = page + 1;
      
      // 根据当前标签加载更多
      if (activeFilter === 'province' || activeFilter === 'provinceWin') {
        fetchData(nextPage, activeFilter, selectedProvince?.name);
      } else if (activeFilter === 'city') {
        fetchData(nextPage, activeFilter, selectedProvince?.name, selectedCity?.name);
      } else {
        fetchData(nextPage, activeFilter);
      }
    }
  };

  const handleBidPress = useCallback((bidId: number, isWinBid?: boolean) => {
    if (isWinBid) {
      router.push('/win-bid-detail', { id: bidId });
    } else {
      router.push('/detail', { id: bidId });
    }
  }, [router]);

  const handleSearchPress = () => {
    router.navigate('/search');
  };

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

  const renderBidItem = useCallback(({ item, index }: { item: Bid; index: number }) => {
    const isWinBid = item.isWinBid;
    // 规范化公告类型名称
    const displayType = item.announcement_type || item.bid_type || (isWinBid ? '中标' : '招标');
    
    // 规范化行业名称：如果industry是代码格式（如S912），则显示bid_type
    const displayIndustry = item.industry && !/^[A-Z]\d{3}$/.test(item.industry) 
      ? item.industry 
      : displayType;
    
    return (
      <TouchableOpacity
        style={[
          styles.bidCard,
          item.is_urgent && styles.bidCardUrgent,
          isWinBid && styles.bidCardWin,
        ]}
        onPress={() => handleBidPress(item.id, isWinBid)}
        activeOpacity={0.7}
      >
        {/* 左侧信息 */}
        <View style={styles.bidCardLeft}>
          <Text style={styles.bidTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.bidMetaRow}>
            <View style={[styles.bidTag, isWinBid && styles.bidTagWin]}>
              <Text style={[styles.bidTagText, isWinBid && styles.bidTagWinText]}>
                {displayIndustry?.slice(0, 6) || '项目'}
              </Text>
            </View>
            <View style={[styles.bidTag, isWinBid && styles.bidTagWin]}>
              <Text style={[styles.bidTagText, isWinBid && styles.bidTagWinText]}>
                {displayType}
              </Text>
            </View>
          </View>
          <Text style={styles.bidLocation} numberOfLines={1}>
            {item.province} · {item.city}
          </Text>
        </View>
        
        {/* 右侧金额和日期 */}
        <View style={styles.bidCardRight}>
          <Text style={[styles.bidBudget, isWinBid && styles.bidBudgetWin]} numberOfLines={1}>
            {formatBudget(item.budget)}
          </Text>
          {isWinBid && item.winCompany && (
            <Text style={styles.bidWinCompany} numberOfLines={1}>
              {item.winCompany}
            </Text>
          )}
          {!isWinBid && item.deadline && (
            <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>
          )}
          {isWinBid && item.publish_date && (
            <Text style={styles.bidPublishDate}>{formatDeadline(item.publish_date)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [styles, handleBidPress]);

  // 首次加载状态（无数据显示loading）
  if (loading && page === 1 && bids.length === 0 && !hasLoaded[activeFilter]) {
    return (
      <Screen backgroundColor="#F5F7FA" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F7FA" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1 }}>
        {/* Header - 延伸到状态栏下方 */}
        <View 
          style={[
            styles.headerGradient, 
            { 
              paddingTop: insets.top + Spacing.sm,
              backgroundColor: '#2563EB',
            }
          ]}
        >
          <View style={styles.headerContent}>
            {/* Top Row */}
            <View style={styles.headerTop}>
              <View style={styles.appBrand}>
                <View style={styles.appLogo}>
                  <FontAwesome6 name="gavel" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.appTitleRow}>
                  <Text style={styles.appTitle}>招采易</Text>
                  <Text style={styles.appSubtitle}>一站式招标采购信息平台 v1.0.1</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <Text style={styles.locationButtonText}>
                  {selectedCity ? selectedCity.name : (selectedProvince ? selectedProvince.name : '选择地区')}
                </Text>
                <TouchableOpacity 
                  style={[styles.locationButton, selectedProvince && styles.locationButtonActive]} 
                  onPress={() => {
                    setLocationStep('province');
                    setLocationModalVisible(true);
                  }}
                >
                  <FontAwesome6 
                    name="map-location-dot" 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 地区选择提示 */}
            {selectedProvince && (
              <View style={styles.locationInfo}>
                <FontAwesome6 name="location-dot" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationInfoText}>
                  {selectedProvince.name}{selectedCity ? ` · ${selectedCity.name}` : ''}
                </Text>
                <TouchableOpacity onPress={handleClearLocation} style={styles.clearLocationButton}>
                  <FontAwesome6 name="circle-xmark" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Search Bar */}
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#64748B" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>搜索招标采购信息、行业、地区...</Text>
              <View style={styles.searchButton}>
                <Text style={styles.searchButtonText}>搜索</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/bidList', { type: 'today' })}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrapper, styles.statIconToday]}>
                <FontAwesome6 name="file-circle-plus" size={14} color="#2563EB" />
              </View>
              <Text style={[styles.statValue, styles.statValueBlue]}>{stats.todayCount}</Text>
              <Text style={styles.statLabel}>今日新增</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/bidList', { type: 'urgent' })}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrapper, styles.statIconUrgent]}>
                <FontAwesome6 name="fire" size={14} color="#DC2626" />
              </View>
              <Text style={[styles.statValue, styles.statValueRed]}>{stats.urgentCount}</Text>
              <Text style={styles.statLabel}>紧急招标</Text>
            </TouchableOpacity>
            
            <View style={styles.statDivider} />
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => router.push('/bidList', { type: 'win' })}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconWrapper, styles.statIconWin]}>
                <FontAwesome6 name="trophy" size={14} color="#059669" />
              </View>
              <Text style={[styles.statValue, styles.statValueGreen]}>{stats.winBidCount}</Text>
              <Text style={styles.statLabel}>今日中标</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions - 横向长条标签 */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => {
              const isActive = activeFilter === action.key;
              return (
                <TouchableOpacity
                  key={action.key}
                  style={[styles.quickActionTab, isActive && styles.quickActionTabActive]}
                  onPress={() => handleFilterPress(action.key)}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 
                    name={action.icon as any} 
                    size={14} 
                    color={isActive ? '#FFFFFF' : action.color} 
                  />
                  <Text style={[
                    styles.quickActionTabText,
                    isActive && styles.quickActionTabTextActive
                  ]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bid List */}
        <FlatList
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
            loadingMore ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: Spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            !loading && !loadingMore ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={48} color="#CBD5E1" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* 地区选择弹窗 */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  if (locationStep === 'city') {
                    setLocationStep('province');
                    setSelectedCity(null);
                  } else {
                    setLocationModalVisible(false);
                  }
                }}
                style={styles.modalBackButton}
              >
                {locationStep === 'city' && (
                  <FontAwesome6 name="chevron-left" size={18} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {locationStep === 'province' ? '选择省份' : '选择城市'}
              </Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* 省份列表 */}
            {locationStep === 'province' && (
              <FlatList
                data={provinces}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator
                contentContainerStyle={styles.provinceList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.provinceItem,
                      selectedProvince?.id === item.id && styles.provinceItemActive,
                    ]}
                    onPress={() => handleProvinceSelect(item)}
                  >
                    <Text
                      style={[
                        styles.provinceText,
                        selectedProvince?.id === item.id && styles.provinceTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              />
            )}
            
            {/* 城市列表 */}
            {locationStep === 'city' && (
              <>
                {loadingCities ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>加载城市...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={cities}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator
                    contentContainerStyle={styles.provinceList}
                    ListHeaderComponent={
                      <View>
                        {/* 全省选项 */}
                        <TouchableOpacity
                          style={[styles.provinceItem, styles.allProvinceItem]}
                          onPress={handleConfirmProvince}
                        >
                          <View style={styles.allProvinceContent}>
                            <FontAwesome6 name="map" size={16} color={theme.primary} />
                            <Text style={[styles.provinceText, { color: theme.primary, marginLeft: 8 }]}>
                              全部 {selectedProvince?.name}
                            </Text>
                          </View>
                          <FontAwesome6 name="check" size={16} color={theme.primary} />
                        </TouchableOpacity>
                        
                        {cities.length > 0 && (
                          <Text style={styles.cityListHeader}>或选择城市</Text>
                        )}
                      </View>
                    }
                    ListEmptyComponent={
                      <View style={styles.emptyCityContainer}>
                        <FontAwesome6 name="city" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyCityText}>该省份暂无城市数据</Text>
                        <Text style={styles.emptyCityHint}>
                          {`请直接选择"全部${selectedProvince?.name}"`}
                        </Text>
                      </View>
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.provinceItem,
                          selectedCity?.id === item.id && styles.provinceItemActive,
                        ]}
                        onPress={() => handleCitySelect(item)}
                      >
                        <Text
                          style={[
                            styles.provinceText,
                            selectedCity?.id === item.id && styles.provinceTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {selectedCity?.id === item.id && (
                          <FontAwesome6 name="check" size={16} color={theme.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
