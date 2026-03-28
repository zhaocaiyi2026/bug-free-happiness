import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
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

export default function SearchScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [keyword, setKeyword] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince]);

  const fetchFilters = async () => {
    try {
      const [provincesRes, industriesRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/provinces`),
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/industries`),
      ]);

      const provincesData = await provincesRes.json();
      const industriesData = await industriesRes.json();

      if (provincesData.success) {
        setProvinces(provincesData.data);
      }
      if (industriesData.success) {
        setIndustries(industriesData.data);
      }
    } catch (error) {
      console.error('获取筛选数据失败:', error);
    }
  };

  const fetchCities = async (provinceName: string) => {
    try {
      const province = provinces.find((p) => p.name === provinceName);
      if (!province) return;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/cities?provinceId=${province.id}`
      );
      const data = await res.json();

      if (data.success) {
        setCities(data.data);
      }
    } catch (error) {
      console.error('获取城市数据失败:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (selectedProvince) params.append('province', selectedProvince);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedIndustry) params.append('industry', selectedIndustry);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bids?${params.toString()}`
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

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const renderFilterChips = (
    items: { id: number; name: string }[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      <TouchableOpacity
        style={[styles.filterChip, !selected && styles.filterChipActive]}
        onPress={() => onSelect('')}
      >
        <Text style={[styles.filterChipText, !selected && styles.filterChipTextActive]}>全部</Text>
      </TouchableOpacity>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.filterChip, selected === item.name && styles.filterChipActive]}
          onPress={() => onSelect(item.name)}
        >
          <Text style={[styles.filterChipText, selected === item.name && styles.filterChipTextActive]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderResultItem = ({ item }: { item: Bid }) => (
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
  );

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>搜索招标</Text>
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
        {/* 筛选区域 */}
        <View style={styles.filterSection}>
          {/* 省份 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>省份</Text>
            {renderFilterChips(provinces, selectedProvince, setSelectedProvince)}
          </View>

          {/* 城市 */}
          {selectedProvince && cities.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>城市</Text>
              {renderFilterChips(cities, selectedCity, setSelectedCity)}
            </View>
          )}

          {/* 行业 */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>行业</Text>
            {renderFilterChips(industries, selectedIndustry, setSelectedIndustry)}
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
                <Text style={styles.emptyText}>未找到符合条件的招标信息</Text>
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
    </Screen>
  );
}
