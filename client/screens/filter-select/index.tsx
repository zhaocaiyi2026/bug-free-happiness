import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// 用于传递筛选选择结果的 AsyncStorage key
const FILTER_SELECT_RESULT_KEY = '@filter_select_result';

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
    returnTo?: string;
    customerType?: string;
  }>();

  const filterType = params?.type || 'province';
  const selectedValue = params?.selected || '';
  const returnTo = params?.returnTo || 'search';
  const existingKeyword = params?.keyword || '';
  const existingIndustry = params?.industry || '';
  const existingProvince = params?.province || '';

  const [searchKeyword, setSearchKeyword] = useState('');
  const [allItems, setAllItems] = useState<(Province | Industry)[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 防止重复导航
  const isNavigatingRef = useRef(false);

  const pageTitle = filterType === 'province' ? '选择省份' : '选择行业';
  const placeholder = filterType === 'province' ? '搜索省份...' : '搜索行业...';

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
      
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
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

  const handleSelect = useCallback(async (itemName: string) => {
    // 防止重复导航
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    // 根据返回目标页面处理
    if (returnTo === 'potential-customers') {
      // 只传递行业参数，不传递 customerType，让潜在客户页面自己管理
      router.replace('/potential-customers', {
        industry: itemName,
      });
      return;
    }
    
    // 默认返回搜索页面
    // 将选择结果存储到 AsyncStorage，然后使用 back() 返回
    // 这样可以避免导航栈中累积多个搜索页实例
    const result = {
      type: filterType,
      value: itemName,
      timestamp: Date.now(),
    };
    
    try {
      await AsyncStorage.setItem(FILTER_SELECT_RESULT_KEY, JSON.stringify(result));
    } catch (error) {
      console.error('保存选择结果失败:', error);
    }
    
    // 使用 back() 返回搜索页，避免导航栈累积
    router.back();
    
    // 延迟重置导航状态
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, [filterType, router, returnTo, params?.customerType]);

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
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity onPress={() => setSearchKeyword('')}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 快捷提示 */}
      <View style={styles.tipBar}>
        <FontAwesome6 name="lightbulb" size={12} color="#F59E0B" />
        <Text style={styles.tipText}>选择后将自动返回搜索页面并刷新结果</Text>
      </View>

      {/* 列表 */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredItems.length > 0 ? (
            <Text style={styles.listCount}>共 {filteredItems.length} 个{filterType === 'province' ? '省份' : '行业'}</Text>
          ) : null
        }
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
