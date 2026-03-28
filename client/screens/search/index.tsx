import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

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

interface Industry {
  id: number;
  name: string;
  code: string;
}

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
}

// 常用省份（前6个）
const POPULAR_PROVINCES = [
  { id: 0, name: '全部', code: '' },
  { id: 1, name: '上海市', code: '310000' },
  { id: 2, name: '北京市', code: '110000' },
  { id: 3, name: '四川省', code: '510000' },
  { id: 4, name: '山东省', code: '370000' },
  { id: 5, name: '广东省', code: '440000' },
];

// 常用行业（前5个）
const POPULAR_INDUSTRIES = [
  { id: 0, name: '全部', code: '' },
  { id: 1, name: '交通运输', code: 'transport' },
  { id: 2, name: '信息技术', code: 'it' },
  { id: 3, name: '农林牧渔', code: 'agriculture' },
  { id: 4, name: '医疗卫生', code: 'medical' },
];

export default function SearchScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const searchParams = useSafeSearchParams<{
    keyword?: string;
    industry?: string;
    province?: string;
    autoSearch?: string;
  }>();

  // 用于追踪是否已执行过自动搜索
  const hasAutoSearchedRef = useRef(false);

  // 搜索类型：bid-招标，winBid-中标
  const [searchType, setSearchType] = useState<'bid' | 'winBid'>('bid');
  
  const [keyword, setKeyword] = useState('');
  const [allProvinces, setAllProvinces] = useState<Province[]>([]);
  const [allIndustries, setAllIndustries] = useState<Industry[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 弹窗状态
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [industryModalVisible, setIndustryModalVisible] = useState(false);

  // 初始化：获取筛选数据
  useEffect(() => {
    fetchFilters();
  }, []);

  // 处理从发现页面传来的参数 - 只执行一次
  useEffect(() => {
    // 如果已经执行过自动搜索，则跳过
    if (hasAutoSearchedRef.current) return;
    
    if (searchParams && searchParams.autoSearch === 'true') {
      hasAutoSearchedRef.current = true;
      
      // 设置关键词
      if (searchParams.keyword) {
        setKeyword(searchParams.keyword);
      }
      // 设置行业
      if (searchParams.industry) {
        setSelectedIndustry(searchParams.industry);
      }
      // 设置省份
      if (searchParams.province) {
        setSelectedProvince(searchParams.province);
      }
      
      // 延迟执行，等待筛选数据加载完成
      setTimeout(() => {
        handleSearchWithParams(
          searchParams.keyword || '',
          searchParams.industry || '',
          searchParams.province || ''
        );
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.autoSearch]);

  const fetchFilters = async () => {
    try {
      const [provincesRes, industriesRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/provinces`),
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/industries`),
      ]);

      const provincesData = await provincesRes.json();
      const industriesData = await industriesRes.json();

      if (provincesData.success) {
        setAllProvinces(provincesData.data);
      }
      if (industriesData.success) {
        setAllIndustries(industriesData.data);
      }
    } catch (error) {
      console.error('获取筛选数据失败:', error);
    }
  };

  const handleSearch = async () => {
    await handleSearchWithParams(keyword, selectedIndustry, selectedProvince);
  };

  const handleSearchWithParams = async (
    searchKeyword: string,
    searchIndustry: string,
    searchProvince: string
  ) => {
    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchProvince) params.append('province', searchProvince);
      if (searchIndustry) params.append('industry', searchIndustry);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const endpoint = searchType === 'bid' ? '/api/v1/bids' : '/api/v1/win-bids';
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setResults(data.data.list);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
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
    return `${date.getMonth() + 1}.${date.getDate()}`;
  };

  const handleBidPress = useCallback((bidId: number) => {
    if (searchType === 'bid') {
      router.push('/detail', { id: bidId });
    } else {
      router.push('/win-bid-detail', { id: bidId });
    }
  }, [searchType, router]);

  const handleProvinceSelect = (provinceName: string) => {
    setSelectedProvince(provinceName === '全部' ? '' : provinceName);
    setProvinceModalVisible(false);
  };

  const handleIndustrySelect = (industryName: string) => {
    setSelectedIndustry(industryName === '全部' ? '' : industryName);
    setIndustryModalVisible(false);
  };

  const renderFilterChip = useCallback((
    item: { id: number; name: string },
    isSelected: boolean,
    onPress: () => void,
    isMore: boolean = false
  ) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.filterChip,
        isSelected && styles.filterChipActive,
        isMore && styles.filterChipMore,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
        {isMore ? '更多' : item.name}
      </Text>
      {isMore && (
        <FontAwesome6
          name="chevron-down"
          size={8}
          color={isSelected ? '#FFFFFF' : '#6B7280'}
          style={{ marginLeft: 4 }}
        />
      )}
    </TouchableOpacity>
  ), [styles]);

  const renderResultItem = useCallback(({ item }: { item: Bid }) => (
    <TouchableOpacity style={styles.bidCard} onPress={() => handleBidPress(item.id)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.industry || '综合'}</Text>
        </View>
        {item.is_urgent && (
          <View style={styles.urgentTag}>
            <Text style={styles.urgentTagText}>紧急</Text>
          </View>
        )}
      </View>
      <Text style={styles.bidTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}</Text>
      <View style={styles.bidMetaRow}>
        <Text style={styles.bidMeta}>{item.province} {item.city}</Text>
        <Text style={styles.bidMetaSeparator}>|</Text>
        <Text style={styles.bidMeta}>{formatDate(item.publish_date)}</Text>
      </View>
    </TouchableOpacity>
  ), [styles, handleBidPress]);

  const renderModalItem = useCallback((
    item: { id: number; name: string },
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.modalItem, isSelected && styles.modalItemActive]}
      onPress={onPress}
    >
      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
        {item.name}
      </Text>
      {isSelected && (
        <FontAwesome6 name="check" size={14} color="#2563EB" />
      )}
    </TouchableOpacity>
  ), [styles]);

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>搜索{searchType === 'bid' ? '招标' : '中标'}</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* 搜索框 */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="输入关键词搜索..."
              placeholderTextColor="#9CA3AF"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 搜索类型切换 */}
        <View style={styles.typeSection}>
          <TouchableOpacity
            style={[styles.typeTab, searchType === 'bid' && styles.typeTabActive]}
            onPress={() => {
              setSearchType('bid');
              // 切换类型时清空搜索结果
              if (hasSearched) {
                setResults([]);
                setHasSearched(false);
              }
            }}
          >
            <FontAwesome6
              name="file-contract"
              size={14}
              color={searchType === 'bid' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeTabText, searchType === 'bid' && styles.typeTabTextActive]}>
              招标信息
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, searchType === 'winBid' && styles.typeTabActive]}
            onPress={() => {
              setSearchType('winBid');
              // 切换类型时清空搜索结果
              if (hasSearched) {
                setResults([]);
                setHasSearched(false);
              }
            }}
          >
            <FontAwesome6
              name="trophy"
              size={14}
              color={searchType === 'winBid' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeTabText, searchType === 'winBid' && styles.typeTabTextActive]}>
              中标信息
            </Text>
          </TouchableOpacity>
        </View>

        {/* 筛选区域 */}
        <View style={styles.filterSection}>
          {/* 省份 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>省份</Text>
            <View style={styles.filterScrollWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {POPULAR_PROVINCES.map((item) =>
                  renderFilterChip(
                    item,
                    selectedProvince === item.name || (item.name === '全部' && !selectedProvince),
                    () => handleProvinceSelect(item.name)
                  )
                )}
                {renderFilterChip(
                  { id: -1, name: '' },
                  false,
                  () => setProvinceModalVisible(true),
                  true
                )}
              </ScrollView>
            </View>
          </View>

          {/* 行业 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>行业</Text>
            <View style={styles.filterScrollWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {POPULAR_INDUSTRIES.map((item) =>
                  renderFilterChip(
                    item,
                    selectedIndustry === item.name || (item.name === '全部' && !selectedIndustry),
                    () => handleIndustrySelect(item.name)
                  )
                )}
                {renderFilterChip(
                  { id: -1, name: '' },
                  false,
                  () => setIndustryModalVisible(true),
                  true
                )}
              </ScrollView>
            </View>
          </View>

          {/* 预算范围 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>预算范围（万元）</Text>
            <View style={styles.budgetRow}>
              <TextInput
                style={styles.budgetInput}
                placeholder="最低"
                placeholderTextColor="#9CA3AF"
                value={minBudget}
                onChangeText={setMinBudget}
                keyboardType="numeric"
              />
              <Text style={styles.budgetSeparator}>—</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="最高"
                placeholderTextColor="#9CA3AF"
                value={maxBudget}
                onChangeText={setMaxBudget}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 搜索按钮 */}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
          <View style={styles.searchButtonIcon}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>

        {/* 搜索结果 */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>找到 {results.length} 条结果</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>未找到符合条件的{searchType === 'bid' ? '招标' : '中标'}信息</Text>
                <Text style={styles.emptyHint}>请尝试调整筛选条件</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderResultItem}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.resultList}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* 省份选择弹窗 */}
      <Modal
        visible={provinceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProvinceModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProvinceModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择省份</Text>
              <TouchableOpacity onPress={() => setProvinceModalVisible(false)}>
                <FontAwesome6 name="xmark" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 0, name: '全部' }, ...allProvinces]}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) =>
                renderModalItem(
                  item,
                  selectedProvince === item.name || (item.name === '全部' && !selectedProvince),
                  () => handleProvinceSelect(item.name)
                )
              }
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 行业选择弹窗 */}
      <Modal
        visible={industryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIndustryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIndustryModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择行业</Text>
              <TouchableOpacity onPress={() => setIndustryModalVisible(false)}>
                <FontAwesome6 name="xmark" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 0, name: '全部' }, ...allIndustries]}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) =>
                renderModalItem(
                  item,
                  selectedIndustry === item.name || (item.name === '全部' && !selectedIndustry),
                  () => handleIndustrySelect(item.name)
                )
              }
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
