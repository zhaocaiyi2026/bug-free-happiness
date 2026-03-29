import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  
  // 动态筛选示例列表（当用户选择不在示例中的选项时，替换最后一个）
  const [provinceExamples, setProvinceExamples] = useState<string[]>(DEFAULT_PROVINCE_EXAMPLES);
  const [industryExamples, setIndustryExamples] = useState<string[]>(DEFAULT_INDUSTRY_EXAMPLES);

  // 初始化：获取筛选数据
  useEffect(() => {
    // 可以在这里获取数据用于其他用途
  }, []);

  // 监听参数变化并更新状态
  useEffect(() => {
    if (searchParams) {
      // 更新关键词
      if (searchParams.keyword !== undefined) {
        setKeyword(searchParams.keyword);
      }
      // 更新行业
      if (searchParams.industry !== undefined) {
        setSelectedIndustry(searchParams.industry);
      }
      // 更新省份
      if (searchParams.province !== undefined) {
        setSelectedProvince(searchParams.province);
      }
      
      // 如果带有 autoSearch 参数，执行自动搜索
      if (searchParams.autoSearch === 'true') {
        // 延迟执行，等待状态更新完成
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

  // 执行搜索（只使用关键词，不叠加行业筛选）
  const handleSearch = async () => {
    // 用户输入关键词搜索时，只使用关键词
    await handleSearchWithParams(keyword, '', selectedProvince);
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
      
      // 搜索模式：放宽过滤条件，搜索项目名称和项目详情
      params.append('isSearch', 'true');
      
      // 招标搜索：包含过期招标
      if (searchType === 'bid') {
        params.append('includeExpired', 'true');
      }

      const endpoint = searchType === 'bid' ? '/api/v1/bids' : '/api/v1/win-bids';
      const res = await fetch(
        `${API_BASE_URL}${endpoint}?${params.toString()}`
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
    const newProvince = provinceName === selectedProvince ? '' : provinceName;
    setSelectedProvince(newProvince);
    // 选择省份后自动搜索
    setTimeout(() => {
      handleSearchWithParams(keyword, selectedIndustry, newProvince);
    }, 50);
  };

  // 从"更多"选择省份
  const handleProvinceFromMore = (provinceName: string) => {
    // 如果选中的省份不在当前示例列表中，替换最后一个示例
    if (!provinceExamples.includes(provinceName)) {
      const newExamples = [...provinceExamples];
      newExamples[newExamples.length - 1] = provinceName;
      setProvinceExamples(newExamples);
    }
    setSelectedProvince(provinceName);
    // 选择省份后自动搜索
    setTimeout(() => {
      handleSearchWithParams(keyword, selectedIndustry, provinceName);
    }, 50);
  };

  const handleIndustrySelect = (industryName: string) => {
    const newIndustry = industryName === selectedIndustry ? '' : industryName;
    setSelectedIndustry(newIndustry);
    
    // 选择行业后，用行业名称作为关键词
    setKeyword(newIndustry);
    
    // 自动搜索：只用行业关键词，不叠加省份
    setTimeout(() => {
      handleSearchWithParams(newIndustry, '', '');
    }, 50);
  };

  // 从"更多"选择行业
  const handleIndustryFromMore = (industryName: string) => {
    // 如果选中的行业不在当前示例列表中，替换最后一个示例
    if (!industryExamples.includes(industryName)) {
      const newExamples = [...industryExamples];
      newExamples[newExamples.length - 1] = industryName;
      setIndustryExamples(newExamples);
    }
    setSelectedIndustry(industryName);
    setKeyword(industryName);
    
    // 自动搜索：只用行业关键词，不叠加省份
    setTimeout(() => {
      handleSearchWithParams(industryName, '', '');
    }, 50);
  };

  // 用户输入关键词时的处理
  const handleKeywordChange = (text: string) => {
    setKeyword(text);
    // 用户输入关键词时，自动取消行业筛选
    if (text.length > 0 && selectedIndustry) {
      setSelectedIndustry('');
    }
  };

  // 跳转到省份选择页面
  const handleProvinceMore = () => {
    router.push('/filter-select', { 
      type: 'province',
      selected: selectedProvince,
      keyword: keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    });
  };

  // 跳转到行业选择页面
  const handleIndustryMore = () => {
    router.push('/filter-select', { 
      type: 'industry',
      selected: selectedIndustry,
      keyword: keyword,
      industry: selectedIndustry,
      province: selectedProvince,
    });
  };

  // 监听从筛选页面返回的参数
  useEffect(() => {
    if (searchParams?.province && searchParams.province !== selectedProvince) {
      // 从省份筛选页面返回
      handleProvinceFromMore(searchParams.province);
    }
    if (searchParams?.industry && searchParams.industry !== selectedIndustry) {
      // 从行业筛选页面返回
      handleIndustryFromMore(searchParams.industry);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.province, searchParams?.industry]);

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
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
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
          <Text style={[styles.typeTagText, isWinBid && styles.typeTagTextWin]}>
            {isWinBid ? '中标' : '招标'}
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
      {isWinBid && (item as any).win_company && (
        <Text style={styles.bidWinCompany} numberOfLines={1}>
          中标单位: {(item as any).win_company}
        </Text>
      )}
      <View style={styles.bidMetaRow}>
        <Text style={styles.bidMeta}>{item.province} {item.city}</Text>
        <Text style={styles.bidMetaSeparator}>|</Text>
        <Text style={styles.bidMeta}>{formatDate(item.publish_date)}</Text>
      </View>
    </TouchableOpacity>
  )}, [styles, handleBidPress, searchType]);

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
                {/* 显示3个示例省份 */}
                {provinceExamples.map((name, index) =>
                  renderFilterChip(
                    { id: index, name },
                    selectedProvince === name,
                    () => handleProvinceSelect(name)
                  )
                )}
                {/* 更多按钮 */}
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
                {/* 显示3个示例行业 */}
                {industryExamples.map((name, index) =>
                  renderFilterChip(
                    { id: index, name },
                    selectedIndustry === name,
                    () => handleIndustrySelect(name)
                  )
                )}
                {/* 更多按钮 */}
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
