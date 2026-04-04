import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_COUNT = 10;
// 用于接收筛选选择结果的 AsyncStorage key
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
  win_company?: string;
}

// 默认省份示例（3个）
const DEFAULT_PROVINCE_EXAMPLES = ['北京市', '上海市', '成都市'];

// 默认行业示例（3个）
const DEFAULT_INDUSTRY_EXAMPLES = ['医疗设备', '建筑工程', '信息技术'];

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

  // 搜索类型：bid-招标，winBid-中标
  const [searchType, setSearchType] = useState<'bid' | 'winBid'>('bid');
  
  const [keyword, setKeyword] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [results, setResults] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // 动态筛选示例列表
  const [provinceExamples, setProvinceExamples] = useState<string[]>(DEFAULT_PROVINCE_EXAMPLES);
  const [industryExamples, setIndustryExamples] = useState<string[]>(DEFAULT_INDUSTRY_EXAMPLES);
  
  // 防止重复导航
  const isNavigatingRef = useRef(false);
  
  // 加载搜索历史
  useEffect(() => {
    loadSearchHistory();
  }, []);
  
  // 监听参数变化并更新状态（用于从首页或其他页面直接跳转时）
  useEffect(() => {
    if (searchParams) {
      if (searchParams.keyword !== undefined) {
        setKeyword(searchParams.keyword);
      }
      if (searchParams.industry !== undefined) {
        setSelectedIndustry(searchParams.industry);
      }
      if (searchParams.province !== undefined) {
        setSelectedProvince(searchParams.province);
      }
      
      // 如果带有 autoSearch 参数，执行自动搜索
      if (searchParams.autoSearch === 'true') {
        setTimeout(() => {
          handleSearchWithParams(
            searchParams.keyword || '',
            searchParams.industry || '',
            searchParams.province || ''
          );
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.keyword, searchParams?.industry, searchParams?.province, searchParams?.autoSearch]);

  // 加载搜索历史
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = async (newKeyword: string) => {
    if (!newKeyword.trim()) return;
    
    try {
      let newHistory = [newKeyword, ...searchHistory.filter(h => h !== newKeyword)];
      newHistory = newHistory.slice(0, MAX_HISTORY_COUNT);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 清空搜索历史
  const clearSearchHistory = async () => {
    Alert.alert(
      '清空历史',
      '确定要清空所有搜索历史吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '清空', 
          style: 'destructive',
          onPress: async () => {
            setSearchHistory([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
          }
        }
      ]
    );
  };

  // 删除单条历史
  const removeHistoryItem = async (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 点击历史记录搜索 - 保留省份筛选
  const handleHistoryPress = (historyKeyword: string) => {
    setKeyword(historyKeyword);
    // 点击历史记录时，保留省份筛选，清空行业（因为历史记录是关键词搜索）
    setSelectedIndustry('');
    handleSearchWithParams(historyKeyword, '', selectedProvince);
  };

  // 执行搜索 - 使用所有当前筛选条件
  const handleSearch = async () => {
    Keyboard.dismiss();
    // 叠加所有筛选条件：关键词 + 行业 + 省份
    await handleSearchWithParams(keyword, selectedIndustry, selectedProvince);
  };

  const handleSearchWithParams = async (
    searchKeyword: string,
    searchIndustry: string,
    searchProvince: string
  ) => {
    setLoading(true);
    setHasSearched(true);

    // 保存搜索历史
    if (searchKeyword.trim()) {
      await saveSearchHistory(searchKeyword.trim());
    }

    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchProvince) params.append('province', searchProvince);
      if (searchIndustry) params.append('industry', searchIndustry);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);
      
      params.append('isSearch', 'true');
      
      if (searchType === 'bid') {
        params.append('includeExpired', 'true');
      }

      const endpoint = searchType === 'bid' ? '/api/v1/bids' : '/api/v1/win-bids';
      const res = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`);
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

  // 使用 useFocusEffect 检查筛选选择结果
  // 这样可以在从筛选页返回时获取选择结果，同时避免导航栈累积
  useFocusEffect(
    useCallback(() => {
      const checkFilterResult = async () => {
        try {
          const resultStr = await AsyncStorage.getItem(FILTER_SELECT_RESULT_KEY);
          if (resultStr) {
            const result = JSON.parse(resultStr);
            // 清除已读取的结果
            await AsyncStorage.removeItem(FILTER_SELECT_RESULT_KEY);
            
            // 根据选择类型更新状态并执行搜索
            if (result.type === 'province') {
              setSelectedProvince(result.value);
              // 更新示例列表
              if (!provinceExamples.includes(result.value)) {
                const newExamples = [...provinceExamples];
                newExamples[newExamples.length - 1] = result.value;
                setProvinceExamples(newExamples);
              }
              // 执行搜索
              setTimeout(() => {
                handleSearchWithParams(keyword, selectedIndustry, result.value);
              }, 50);
            } else if (result.type === 'industry') {
              setSelectedIndustry(result.value);
              setKeyword(result.value); // 行业选择时更新关键词
              // 更新示例列表
              if (!industryExamples.includes(result.value)) {
                const newExamples = [...industryExamples];
                newExamples[newExamples.length - 1] = result.value;
                setIndustryExamples(newExamples);
              }
              // 执行搜索（保留省份筛选）
              setTimeout(() => {
                handleSearchWithParams(result.value, result.value, selectedProvince);
              }, 50);
            }
          }
        } catch (error) {
          console.error('检查筛选结果失败:', error);
        }
      };
      
      checkFilterResult();
    }, [keyword, selectedIndustry, provinceExamples, industryExamples])
  );

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

  // 进入详情页 - 传递搜索上下文
  const handleBidPress = useCallback((bidId: number) => {
    // 防止重复点击
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    const targetRoute = searchType === 'bid' ? '/detail' : '/win-bid-detail';
    
    router.push(targetRoute, {
      id: bidId,
      // 传递搜索上下文，用于返回时恢复
      fromSearch: 'true',
      searchKeyword: keyword,
      searchIndustry: selectedIndustry,
      searchProvince: selectedProvince,
      searchType: searchType,
    });
    
    // 延迟重置
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  }, [searchType, router, keyword, selectedIndustry, selectedProvince]);

  const handleProvinceSelect = (provinceName: string) => {
    const newProvince = provinceName === selectedProvince ? '' : provinceName;
    setSelectedProvince(newProvince);
    setTimeout(() => {
      // 保留关键词和行业筛选
      handleSearchWithParams(keyword, selectedIndustry, newProvince);
    }, 50);
  };

  const handleIndustrySelect = (industryName: string) => {
    const newIndustry = industryName === selectedIndustry ? '' : industryName;
    setSelectedIndustry(newIndustry);
    setKeyword(newIndustry);
    setTimeout(() => {
      // 保留省份筛选，不再清空
      handleSearchWithParams(newIndustry, newIndustry, selectedProvince);
    }, 50);
  };

  // 用户输入关键词时的处理 - 不再清空行业筛选
  const handleKeywordChange = (text: string) => {
    setKeyword(text);
  };

  // 跳转到省份选择页面
  const handleProvinceMore = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    router.push('/filter-select', { 
      type: 'province',
      selected: selectedProvince,
      keyword: keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    });
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  // 跳转到行业选择页面
  const handleIndustryMore = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    router.push('/filter-select', { 
      type: 'industry',
      selected: selectedIndustry,
      keyword: keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    });
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  // 清空筛选条件
  const handleClearFilters = () => {
    setKeyword('');
    setSelectedProvince('');
    setSelectedIndustry('');
    setMinBudget('');
    setMaxBudget('');
    setResults([]);
    setHasSearched(false);
  };

  const renderFilterChip = useCallback((
    item: { id: number; name: string },
    isSelected: boolean,
    onPress: () => void,
    isMore: boolean = false,
    showClose: boolean = false
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
      <Text 
        style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        {isMore ? '更多' : item.name}
      </Text>
      {isMore && (
        <FontAwesome6
          name="chevron-right"
          size={8}
          color={isSelected ? '#FFFFFF' : '#6B7280'}
          style={{ marginLeft: 4 }}
        />
      )}
      {showClose && isSelected && (
        <FontAwesome6
          name="xmark"
          size={10}
          color="#FFFFFF"
          style={{ marginLeft: 4 }}
        />
      )}
    </TouchableOpacity>
  ), [styles]);

  const renderResultItem = useCallback(({ item }: { item: Bid }) => {
    const isWinBid = searchType === 'winBid';
    
    return (
      <TouchableOpacity 
        style={[styles.bidCard, isWinBid && styles.winBidCard]} 
        onPress={() => handleBidPress(item.id)} 
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.industry || '综合'}</Text>
          </View>
          <View style={[styles.typeTag, isWinBid && styles.typeTagWin]}>
            <Text style={[styles.typeTagText, isWinBid && styles.typeTagTextWin]} numberOfLines={1}>
              {item.bid_type || (isWinBid ? '中标' : '招标')}
            </Text>
          </View>
          {item.is_urgent && (
            <View style={styles.urgentTag}>
              <Text style={styles.urgentTagText}>紧急</Text>
            </View>
          )}
        </View>
        <Text style={styles.bidTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.bidBudget, isWinBid && styles.bidBudgetWin]}>{formatBudget(item.budget)}</Text>
        {isWinBid && item.win_company && (
          <Text style={styles.bidWinCompany} numberOfLines={1}>
            中标单位: {item.win_company}
          </Text>
        )}
        <View style={styles.bidMetaRow}>
          <Text style={styles.bidMeta}>{item.province} {item.city}</Text>
          <Text style={styles.bidMetaSeparator}>|</Text>
          <Text style={styles.bidMeta}>{formatDate(item.publish_date)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [styles, handleBidPress, searchType]);

  // 渲染搜索历史
  const renderSearchHistory = () => {
    if (hasSearched || searchHistory.length === 0) return null;
    
    return (
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>搜索历史</Text>
          {searchHistory.length > 0 && (
            <TouchableOpacity onPress={clearSearchHistory}>
              <FontAwesome6 name="trash-can" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.historyList}>
          {searchHistory.slice(0, 8).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.historyItem}
              onPress={() => handleHistoryPress(item)}
              onLongPress={() => removeHistoryItem(item)}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="clock-rotate-left" size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
              <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity 
                onPress={() => removeHistoryItem(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome6 name="xmark" size={10} color="#D1D5DB" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.historyHint}>长按可删除单条记录</Text>
      </View>
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
          <Text style={styles.headerTitle}>搜索{searchType === 'bid' ? '招标' : '中标'}</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* 搜索框 */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="输入关键词搜索项目名称、项目详情..."
              placeholderTextColor="#9CA3AF"
              value={keyword}
              onChangeText={handleKeywordChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              underlineColorAndroid="transparent"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => {
                setKeyword('');
                setResults([]);
                setHasSearched(false);
              }}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 搜索类型切换 */}
        <View style={styles.typeSection}>
          <TouchableOpacity
            style={[styles.typeTab, searchType === 'bid' && styles.typeTabActive]}
            onPress={() => {
              setSearchType('bid');
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
                {provinceExamples.map((name, index) =>
                  renderFilterChip(
                    { id: index, name },
                    selectedProvince === name,
                    () => handleProvinceSelect(name)
                  )
                )}
                {renderFilterChip(
                  { id: -1, name: '' },
                  false,
                  handleProvinceMore,
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
                {industryExamples.map((name, index) =>
                  renderFilterChip(
                    { id: index, name },
                    selectedIndustry === name,
                    () => handleIndustrySelect(name)
                  )
                )}
                {renderFilterChip(
                  { id: -1, name: '' },
                  false,
                  handleIndustryMore,
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
                underlineColorAndroid="transparent"
              />
              <Text style={styles.budgetSeparator}>—</Text>
              <TextInput
                style={styles.budgetInput}
                placeholder="最高"
                placeholderTextColor="#9CA3AF"
                value={maxBudget}
                onChangeText={setMaxBudget}
                keyboardType="numeric"
                underlineColorAndroid="transparent"
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

        {/* 清空筛选按钮 */}
        {(keyword || selectedProvince || selectedIndustry || minBudget || maxBudget) && hasSearched && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <FontAwesome6 name="rotate-left" size={14} color="#6B7280" />
            <Text style={styles.clearButtonText}>重置筛选条件</Text>
          </TouchableOpacity>
        )}

        {/* 搜索历史 */}
        {renderSearchHistory()}

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
    </Screen>
  );
}
