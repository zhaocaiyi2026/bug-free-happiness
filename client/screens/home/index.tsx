import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;
const CARD_MARGIN = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;

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

interface WinBid {
  id: number;
  title: string;
  win_amount: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  win_company: string | null;
  publish_date: string | null;
}

interface Stats {
  todayCount: number;
  urgentCount: number;
  winBidCount: number;
  provinceCount: number;
  cityCount: number;
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
  const [winBids, setWinBids] = useState<WinBid[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    todayCount: 156, 
    urgentCount: 8, 
    winBidCount: 32,
    provinceCount: 0,
    cityCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);

  // 快捷筛选入口：全部、本省、本市、本省中标、本市中标
  const filters = [
    { key: 'all', label: '全部', icon: 'layer-group' },
    { key: 'province', label: '本省', icon: 'map' },
    { key: 'city', label: '本市', icon: 'city' },
    { key: 'provinceWin', label: '本省中标', icon: 'trophy' },
    { key: 'cityWin', label: '本市中标', icon: 'award' },
  ];

  // 获取招标数据
  const fetchData = async (pageNum: number) => {
    try {
      setLoading(true);
      // 判断是否为中标筛选
      const isWinBidFilter = activeFilter === 'provinceWin' || activeFilter === 'cityWin';
      
      // "全部"筛选同时获取招标和中标数据
      if (activeFilter === 'all') {
        // 并行获取招标和中标数据
        const [bidsRes, winBidsRes] = await Promise.all([
          fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?page=${pageNum}&pageSize=10`),
          fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/win-bids?page=${pageNum}&pageSize=10`)
        ]);
        
        const bidsData = await bidsRes.json();
        const winBidsData = await winBidsRes.json();
        
        if (bidsData.success && winBidsData.success) {
          // 为招标数据添加类型标识
          const bidItems = bidsData.data.list.map((item: Bid) => ({
            ...item,
            isWinBid: false,
            bidType: '招标' as const,
          }));
          
          // 为中标数据添加类型标识并转换格式
          const winBidItems = winBidsData.data.list.map((item: WinBid) => ({
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
            bidType: '中标' as const,
            winCompany: item.win_company,
          }));
          
          // 合并并按发布时间排序
          const allItems = [...bidItems, ...winBidItems].sort((a, b) => {
            const dateA = a.publish_date ? new Date(a.publish_date).getTime() : 0;
            const dateB = b.publish_date ? new Date(b.publish_date).getTime() : 0;
            return dateB - dateA;
          });
          
          if (pageNum === 1) {
            setBids(allItems);
            setStats(prev => ({
              ...prev,
              todayCount: bidsData.data.total || 156,
              urgentCount: bidsData.data.list.filter((b: Bid) => b.is_urgent).length || 8,
              winBidCount: winBidsData.data.total || 0,
            }));
          } else {
            setBids((prev) => [...prev, ...allItems]);
          }
          // 由于合并了两页数据，需要判断是否还有更多
          setHasMore(bidsData.data.page < bidsData.data.totalPages || winBidsData.data.page < winBidsData.data.totalPages);
        }
      } else if (isWinBidFilter) {
        // 获取中标数据
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (activeFilter === 'provinceWin' && userLocation?.province) {
          params.append('province', userLocation.province);
        } else if (activeFilter === 'cityWin' && userLocation?.city) {
          params.append('city', userLocation.city);
        }

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/win-bids?${params.toString()}`
        );
        const data = await res.json();

        if (data.success) {
          // 将中标数据转换为统一格式显示
          const winBidItems = data.data.list.map((item: WinBid) => ({
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
          }));
          
          if (pageNum === 1) {
            setBids(winBidItems);
          } else {
            setBids((prev) => [...prev, ...winBidItems]);
          }
          setHasMore(data.data.page < data.data.totalPages);
        }
      } else {
        // 获取招标数据
        const params = new URLSearchParams();
        params.append('page', String(pageNum));
        params.append('pageSize', '20');

        if (activeFilter === 'province' && userLocation?.province) {
          params.append('province', userLocation.province);
        } else if (activeFilter === 'city' && userLocation?.city) {
          params.append('city', userLocation.city);
        }

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
        );
        const data = await res.json();

        if (data.success) {
          if (pageNum === 1) {
            setBids(data.data.list);
            // 更新统计数据
            setStats(prev => ({
              ...prev,
              todayCount: data.data.total || 156,
              urgentCount: data.data.list.filter((b: Bid) => b.is_urgent).length || 8,
            }));
          } else {
            setBids((prev) => [...prev, ...data.data.list]);
          }
          setHasMore(data.data.page < data.data.totalPages);
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 获取中标统计数据
  const fetchWinBids = async () => {
    try {
      // 获取今日中标数量
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/win-bids?page=1&pageSize=1&today=true`
      );
      const data = await res.json();

      if (data.success) {
        setWinBids(data.data.list);
        setStats(prev => ({
          ...prev,
          winBidCount: data.data.total || 0,
        }));
      }
    } catch (error) {
      console.error('获取中标列表失败:', error);
    }
  };

  useEffect(() => {
    fetchData(1);
    fetchWinBids();
  }, [activeFilter]);

  // 打开系统定位设置
  const openLocationSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android: 直接打开位置服务设置页面
        await Linking.openSettings();
      } else {
        // iOS: 打开应用设置页面（iOS没有直接的定位服务设置页面）
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('打开设置失败:', error);
      // 如果打开失败，尝试通用方式
      try {
        await Linking.openSettings();
      } catch (e) {
        Alert.alert('提示', '无法自动打开设置，请手动前往系统设置开启定位服务');
      }
    }
  };

  // 请求定位权限并获取位置
  const requestLocation = async () => {
    try {
      setLocating(true);
      
      // 先检查定位服务是否开启
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
      
      // 请求权限
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

      // 获取位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 逆地理编码
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const province = address.region || address.subregion || '';
        const city = address.city || address.subregion || '';
        
        setUserLocation({ province, city });
        
        Alert.alert('定位成功', `已定位到：${province} ${city}`, [
          { text: '好的', style: 'default' }
        ]);
      }
    } catch (error) {
      console.error('定位失败:', error);
      Alert.alert(
        '定位失败', 
        '无法获取您的位置，请检查：\n1. 定位服务是否开启\n2. 应用是否有定位权限\n3. 网络是否正常',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: openLocationSettings },
          { text: '重试', onPress: requestLocation }
        ]
      );
    } finally {
      setLocating(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  const handleFilterPress = async (filterKey: string) => {
    // 如果是位置相关筛选，检查是否已定位
    if (filterKey !== 'all' && !userLocation) {
      // 先检查定位服务是否开启
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
    
    setActiveFilter(filterKey);
    setPage(1);
    setLoading(true);
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const handleSearchPress = () => {
    router.navigate('/search');
  };

  const handleFavoritePress = () => {
    router.navigate('/favorites');
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

  const renderBidItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isWinBid = item.isWinBid;
    
    return (
      <TouchableOpacity
        style={[
          styles.bidCard,
          item.is_urgent && styles.bidCardUrgent,
          isWinBid && styles.bidCardWin,
          { width: CARD_WIDTH - 4 }
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
          <View style={[styles.typeTag, isWinBid && styles.typeTagWin]}>
            <Text style={[styles.typeTagText, isWinBid && styles.typeTagTextWin]} numberOfLines={1}>
              {item.bidType || (isWinBid ? '中标' : '招标')}
            </Text>
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
  }, [styles, CARD_WIDTH]);

  if (loading && page === 1) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleWrapper}>
              <View style={styles.appLogo}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.appTitleContainer}>
                <Text style={styles.appTitle}>招标</Text>
                <Text style={[styles.appTitle, styles.appTitleAccent]}>通</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header - 品牌增强型 */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <View style={styles.appTitleWrapper}>
              <View style={styles.appLogo}>
                <FontAwesome6 name="gavel" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.appTitleContainer}>
                <Text style={styles.appTitle}>招标</Text>
                <Text style={[styles.appTitle, styles.appTitleAccent]}>通</Text>
              </View>
            </View>
          </View>
          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchPress}>
              <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
              <Text style={styles.searchPlaceholder}>搜索招标信息、行业...</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.locationButton, userLocation && styles.locationButtonActive]} 
              onPress={requestLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <FontAwesome6 
                  name="location-crosshairs" 
                  size={16} 
                  color={userLocation ? "#2563EB" : "#6B7280"} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 统计卡片 - 今日新增、紧急招标、中标信息 */}
        <View style={styles.statsCard}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'today' })}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{stats.todayCount}</Text>
            <Text style={styles.statLabel}>今日新增</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'urgent' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, styles.statValueRed]}>{stats.urgentCount}</Text>
            <Text style={styles.statLabel}>紧急招标</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => router.push('/bidList', { type: 'win' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, styles.statValueGreen]}>{stats.winBidCount}</Text>
            <Text style={styles.statLabel}>今日中标</Text>
          </TouchableOpacity>
        </View>

        {/* 快捷筛选入口 */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter.key;
              const isLocationFilter = filter.key !== 'all';
              
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip, 
                    isActive && styles.filterChipActive,
                    isLocationFilter && !userLocation && styles.filterChipDisabled
                  ]}
                  onPress={() => handleFilterPress(filter.key)}
                >
                  <FontAwesome6 
                    name={filter.icon as any} 
                    size={10} 
                    color={isActive ? '#FFFFFF' : '#2563EB'} 
                  />
                  <Text style={[
                    styles.filterChipText, 
                    isActive && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 双列网格招标列表 */}
        <FlatList
          key="home-bids-grid"
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => String(item.id)}
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
                <FontAwesome6 name="folder-open" size={40} color="#D1D5DB" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无招标信息</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
}
