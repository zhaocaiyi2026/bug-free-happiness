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
    // 当省份改变时，获取对应城市
    if (selectedProvince) {
      fetchCities(selectedProvince);
    } else {
      setCities([]);
      setSelectedCity('');
    }
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
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleBidPress = (bidId: number) => {
    router.push('/detail', { id: bidId });
  };

  const renderResultItem = ({ item }: { item: Bid }) => (
    <TouchableOpacity style={styles.bidCard} onPress={() => handleBidPress(item.id)}>
      <Text style={styles.bidCategory}>{item.industry || '综合'}</Text>
      <Text style={styles.bidTitle} numberOfLines={3}>
        {item.title}
      </Text>
      <View style={styles.bidMetaRow}>
        <Text style={styles.bidMetaItem}>{item.province} {item.city}</Text>
        {item.bid_type && (
          <>
            <View style={{ width: 1, height: 12, backgroundColor: '#E5E5E5', marginRight: Spacing.md }} />
            <Text style={styles.bidMetaItem}>{item.bid_type}</Text>
          </>
        )}
      </View>
      <Text style={styles.bidBudget}>{formatBudget(item.budget)}</Text>
      <Text style={styles.bidDate}>发布于 {formatDate(item.publish_date)}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="dark">
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>搜索招标</Text>
          </View>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#8C8C8C" />
            <TextInput
              style={styles.searchInput}
              placeholder="输入关键词搜索..."
              placeholderTextColor="#8C8C8C"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* 省份筛选 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>省份</Text>
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedProvince && styles.filterChipActive]}
                onPress={() => setSelectedProvince('')}
              >
                <Text style={[styles.filterChipText, !selectedProvince && styles.filterChipTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
              {provinces.map((province) => (
                <TouchableOpacity
                  key={province.id}
                  style={[styles.filterChip, selectedProvince === province.name && styles.filterChipActive]}
                  onPress={() => setSelectedProvince(province.name)}
                >
                  <Text style={[styles.filterChipText, selectedProvince === province.name && styles.filterChipTextActive]}>
                    {province.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 城市筛选 */}
          {selectedProvince && cities.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>城市</Text>
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCity && styles.filterChipActive]}
                  onPress={() => setSelectedCity('')}
                >
                  <Text style={[styles.filterChipText, !selectedCity && styles.filterChipTextActive]}>
                    全部
                  </Text>
                </TouchableOpacity>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.filterChip, selectedCity === city.name && styles.filterChipActive]}
                    onPress={() => setSelectedCity(city.name)}
                  >
                    <Text style={[styles.filterChipText, selectedCity === city.name && styles.filterChipTextActive]}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* 行业筛选 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>行业</Text>
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedIndustry && styles.filterChipActive]}
                onPress={() => setSelectedIndustry('')}
              >
                <Text style={[styles.filterChipText, !selectedIndustry && styles.filterChipTextActive]}>
                  全部
                </Text>
              </TouchableOpacity>
              {industries.map((industry) => (
                <TouchableOpacity
                  key={industry.id}
                  style={[styles.filterChip, selectedIndustry === industry.name && styles.filterChipActive]}
                  onPress={() => setSelectedIndustry(industry.name)}
                >
                  <Text style={[styles.filterChipText, selectedIndustry === industry.name && styles.filterChipTextActive]}>
                    {industry.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 预算筛选 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>预算范围（万元）</Text>
            <View style={styles.budgetInputContainer}>
              <TextInput
                style={styles.budgetInput}
                placeholder="最低"
                placeholderTextColor="#8C8C8C"
                value={minBudget}
                onChangeText={setMinBudget}
                keyboardType="numeric"
              />
              <Text style={styles.budgetSeparator}>-</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="最高"
                placeholderTextColor="#8C8C8C"
                value={maxBudget}
                onChangeText={setMaxBudget}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 搜索按钮 */}
          <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
            <Text style={styles.applyButtonText}>搜索</Text>
          </TouchableOpacity>

          {/* 搜索结果 */}
          {hasSearched && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultCount}>找到 {results.length} 条招标信息</Text>
              {loading ? (
                <ActivityIndicator size="large" color="#000000" style={{ marginTop: Spacing.xl }} />
              ) : results.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>未找到符合条件的招标信息</Text>
                </View>
              ) : (
                results.map((item) => <View key={item.id}>{renderResultItem({ item })}</View>)
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
