import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';
import * as Location from 'expo-location';

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
  publish_date: string | null;
  deadline: string | null;
  is_urgent: boolean;
  view_count: number;
  isWinBid?: boolean;
  winCompany?: string;
  bidType?: '招标' | '中标';
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

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    todayCount: 156, 
    urgentCount: 8, 
    winBidCount: 32,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  
  const userLocationRef = useRef<UserLocation | null>(null);
  const activeFilterRef = useRef<string>('all');
  const loadingRef = useRef(false);

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

  const fetchData = async (pageNum: number, filterKey: string) => {
    if (loadingRef.current) return;
    
    const currentLocation = userLocationRef.current;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const isWinBidFilter = filterKey === 'provinceWin' || filterKey === 'cityWin';
      
      if (filterKey === 'all') {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');
        if (currentLocation?.province) {
          params.append('province', currentLocation.province);
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/bids?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const bidItems = data.data.list.map((item: Bid) => ({
            ...item,
            isWinBid: false,
            bidType: '招标' as const,
          }));
          
          if (pageNum === 1) {
            setBids(bidItems);
          } else {
            setBids((prev) => [...prev, ...bidItems]);
          }
          setHasMore(data.data.page < data.data.totalPages);
        } else {
          if (pageNum === 1) setBids([]);
          setHasMore(false);
        }
      } else if (isWinBidFilter) {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (filterKey === 'provinceWin' && currentLocation?.province) {
          params.append('province', currentLocation.province);
        } else if (filterKey === 'cityWin' && currentLocation?.city) {
          params.append('city', currentLocation.city);
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
            bid_type: '中标',
            publish_date: item.publish_date,
            deadline: null,
            is_urgent: false,
            view_count: 0,
            isWinBid: true,
            winCompany: item.win_company,
            bidType: '中标' as const,
          }));
          
          if (pageNum === 1) {
            setBids(winBidItems);
          } else {
            setBids((prev) => [...prev, ...winBidItems]);
          }
          setHasMore(data.data.page < data.data.totalPages);
        } else {
          if (pageNum === 1) setBids([]);
          setHasMore(false);
        }
      } else {
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (filterKey === 'province' && currentLocation?.province) {
          params.append('province', currentLocation.province);
        } else if (filterKey === 'city' && currentLocation?.city) {
          params.append('city', currentLocation.city);
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/bids?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const bidItems = data.data.list.map((item: Bid) => ({
            ...item,
            isWinBid: false,
            bidType: '招标' as const,
          }));
          
          if (pageNum === 1) {
            setBids(bidItems);
          } else {
            setBids((prev) => [...prev, ...bidItems]);
          }
          setHasMore(data.data.page < data.data.totalPages);
        } else {
          if (pageNum === 1) setBids([]);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setHasMore(false);
      if (pageNum === 1) setBids([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(1, activeFilterRef.current);
      fetchStats();
    }, [])
  );

  const openLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert('提示', '无法自动打开设置，请手动前往系统设置开启定位服务');
    }
  };

  const requestLocation = async () => {
    try {
      setLocating(true);
      
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          '定位服务未开启', 
          '请在手机设置中开启定位服务（GPS），以便使用位置相关功能',
          [
            { text: '取消', style: 'cancel' },
            { text: '去设置', onPress: openLocationSettings }
          ]
        );
        setLocating(false);
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '定位权限被拒绝', 
          '需要定位权限才能使用此功能，请在手机设置中为应用开启定位权限',
          [
            { text: '取消', style: 'cancel' },
            { text: '去设置', onPress: openLocationSettings }
          ]
        );
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const province = address.region || address.subregion || '';
        const city = address.city || address.subregion || '';
        
        const newLocation = { province, city };
        setUserLocation(newLocation);
        userLocationRef.current = newLocation;
        Alert.alert('定位成功', `已定位到：${province} ${city}`);
      }
    } catch (error) {
      console.error('定位失败:', error);
      Alert.alert('定位失败', '无法获取您的位置，请检查定位服务是否开启');
    } finally {
      setLocating(false);
    }
  };

  const handleRefresh = () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchData(1, activeFilterRef.current);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, activeFilterRef.current);
    }
  };

  const handleFilterPress = async (filterKey: string) => {
    if (filterKey !== 'all' && !userLocation) {
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          '定位服务未开启', 
          '使用此功能需要开启定位服务，请在手机设置中开启GPS定位',
          [
            { text: '取消', style: 'cancel' },
            { text: '去设置', onPress: openLocationSettings },
            { text: '重试定位', onPress: requestLocation }
          ]
        );
        return;
      }
      
      Alert.alert(
        '需要定位', 
        '使用此功能需要先获取您的位置，是否现在定位？',
        [
          { text: '取消', style: 'cancel' },
          { text: '定位', onPress: requestLocation }
        ]
      );
      return;
    }
    
    setPage(1);
    setHasMore(true);
    setBids([]);
    setActiveFilter(filterKey);
    activeFilterRef.current = filterKey;
    fetchData(1, filterKey);
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

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
    
    return (
      <TouchableOpacity
        style={[
          styles.bidCard,
          item.is_urgent && styles.bidCardUrgent,
          isWinBid && styles.bidCardWin,
        ]}
        onPress={() => handleBidPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText} numberOfLines={1}>
              {item.industry?.slice(0, 4) || '项目'}
            </Text>
          </View>
          <View style={styles.tagRow}>
            {item.is_urgent && (
              <View style={styles.urgentTag}>
                <Text style={styles.urgentTagText}>紧急</Text>
              </View>
            )}
            <View style={[styles.typeTag, isWinBid && styles.typeTagWin]}>
              <Text style={[styles.typeTagText, isWinBid && styles.typeTagTextWin]} numberOfLines={1}>
                {item.bidType || (isWinBid ? '中标' : '招标')}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.bidTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.bidBudget, isWinBid && styles.bidBudgetWin]}>{formatBudget(item.budget)}元</Text>
        {isWinBid && item.winCompany && (
          <Text style={styles.bidWinCompany} numberOfLines={1}>
            中标单位: {item.winCompany}
          </Text>
        )}
        <Text style={styles.bidMeta} numberOfLines={1}>{item.province} · {item.city}</Text>
        {!isWinBid && <Text style={styles.bidDeadline}>截止 {formatDeadline(item.deadline)}</Text>}
        {isWinBid && item.publish_date && <Text style={styles.bidPublishDate}>发布 {formatDeadline(item.publish_date)}</Text>}
      </TouchableOpacity>
    );
  }, [styles]);

  if (loading && page === 1 && bids.length === 0) {
    return (
      <Screen backgroundColor="#F5F7FA" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F7FA" statusBarStyle="light">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View 
          style={[
            styles.headerGradient, 
            { 
              paddingTop: insets.top + Spacing.md,
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
                  <Text style={styles.appTitle}>招标通</Text>
                  <Text style={styles.appSubtitle}>专业招标信息平台</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={[styles.locationButton, userLocation && styles.locationButtonActive]} 
                  onPress={requestLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <FontAwesome6 
                      name="location-crosshairs" 
                      size={16} 
                      color="#FFFFFF" 
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search Bar */}
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#64748B" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>搜索招标信息、行业、地区...</Text>
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
                <FontAwesome6 name="file-circle-plus" size={18} color="#2563EB" />
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
                <FontAwesome6 name="fire" size={18} color="#DC2626" />
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
                <FontAwesome6 name="trophy" size={18} color="#059669" />
              </View>
              <Text style={[styles.statValue, styles.statValueGreen]}>{stats.winBidCount}</Text>
              <Text style={styles.statLabel}>今日中标</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions - 四宫格卡片 */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => {
              const isActive = activeFilter === action.key;
              return (
                <TouchableOpacity
                  key={action.key}
                  style={[styles.quickActionCard]}
                  onPress={() => handleFilterPress(action.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.quickActionIconWrapper,
                    { 
                      backgroundColor: isActive ? action.activeBgColor : action.bgColor,
                    }
                  ]}>
                    <FontAwesome6 
                      name={action.icon as any} 
                      size={20} 
                      color={isActive ? '#FFFFFF' : action.color} 
                    />
                  </View>
                  <Text style={[
                    styles.quickActionLabel,
                    isActive && { color: action.color }
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: Spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={48} color="#CBD5E1" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
