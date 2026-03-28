import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
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

interface Industry {
  id: number;
  name: string;
  code: string;
}

type FilterType = 'province' | 'industry';

export default function FilterSelectScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  
  const params = useSafeSearchParams<{
    type: FilterType;
    selected?: string;
    keyword?: string;
    industry?: string;
    province?: string;
  }>();

  const filterType = params?.type || 'province';
  const selectedValue = params?.selected || '';
  // 保留原有的筛选参数
  const existingKeyword = params?.keyword || '';
  const existingIndustry = params?.industry || '';
  const existingProvince = params?.province || '';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [allItems, setAllItems] = useState<(Province | Industry)[]>([]);
  const [loading, setLoading] = useState(true);

  const pageTitle = filterType === 'province' ? '选择省份' : '选择行业';

  useEffect(() => {
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const endpoint = filterType === 'province' 
        ? '/api/v1/common/provinces' 
        : '/api/v1/common/industries';
      
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`
      );
      const data = await res.json();

      if (data.success) {
        setAllItems(data.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤后的列表
  const filteredItems = useMemo(() => {
    if (!searchKeyword) return allItems;
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [allItems, searchKeyword]);

  const handleSelect = useCallback((itemName: string) => {
    // 构建完整的筛选参数，保留原有条件
    const searchParams: {
      autoSearch: string;
      keyword?: string;
      industry?: string;
      province?: string;
    } = { autoSearch: 'true' };
    
    // 保留原有的关键词
    if (existingKeyword) {
      searchParams.keyword = existingKeyword;
    }
    
    // 根据筛选类型设置对应参数
    if (filterType === 'province') {
      searchParams.province = itemName;
      // 保留原有的行业筛选
      if (existingIndustry) {
        searchParams.industry = existingIndustry;
      }
    } else {
      searchParams.industry = itemName;
      // 保留原有的省份筛选
      if (existingProvince) {
        searchParams.province = existingProvince;
      }
    }
    
    router.push('/search', searchParams);
  }, [filterType, router, existingKeyword, existingIndustry, existingProvince]);

  const renderItem = useCallback(({ item }: { item: Province | Industry }) => {
    const isSelected = selectedValue === item.name;
    
    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.listItemActive]}
        onPress={() => handleSelect(item.name)}
        activeOpacity={0.7}
      >
        <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
          {item.name}
        </Text>
        {isSelected && (
          <FontAwesome6 name="check" size={16} color="#2563EB" />
        )}
      </TouchableOpacity>
    );
  }, [styles, selectedValue, handleSelect]);

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{pageTitle}</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{pageTitle}</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* 搜索框 */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder={`搜索${filterType === 'province' ? '省份' : '行业'}...`}
              placeholderTextColor="#9CA3AF"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 列表 */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="magnifying-glass" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>未找到相关{filterType === 'province' ? '省份' : '行业'}</Text>
          </View>
        }
      />
    </Screen>
  );
}
