import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface Customer {
  id: string;
  company_name: string;
  contact_person: string | null;
  contact_phone: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  customer_type: 'bidder' | 'winner';
  source_type: string;
  source_title: string | null;
  source_date: string | null;
}

// 默认行业示例（3个）
const DEFAULT_INDUSTRY_EXAMPLES = ['医疗设备', '建筑工程', '信息技术'];

export default function PotentialCustomersScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // VIP权限检查
  const hasVipAccess = user?.vip_level && user.vip_level > 0;
  
  // 接收页面参数
  const params = useSafeSearchParams<{
    industry?: string;
    customerType?: string;
  }>();

  const [keyword, setKeyword] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [customerType, setCustomerType] = useState<'all' | 'bidder' | 'winner'>('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // 动态筛选示例列表（当用户选择不在示例中的选项时，替换最后一个）
  const [industryExamples, setIndustryExamples] = useState<string[]>(DEFAULT_INDUSTRY_EXAMPLES);

  // 监听参数变化，更新筛选状态
  useEffect(() => {
    if (params?.industry && params.industry !== selectedIndustry) {
      // 从行业筛选页面返回
      handleIndustryFromMore(params.industry);
    }
    if (params?.customerType && ['all', 'bidder', 'winner'].includes(params.customerType)) {
      setCustomerType(params.customerType as 'all' | 'bidder' | 'winner');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // 客户类型变化时搜索
  useEffect(() => {
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerType]);

  const handleSearch = async () => {
    setPage(1);
    setHasMore(true);
    await fetchCustomers(1, true);
  };

  const fetchCustomersWithParams = async (
    pageNum: number,
    isRefresh: boolean,
    searchKeyword: string,
    searchIndustry: string,
    searchCustomerType: string
  ) => {
    try {
      if (isRefresh) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('pageSize', '20');
      
      // 用户输入关键词搜索时，只使用关键词，不叠加行业筛选
      if (searchKeyword) {
        params.append('keyword', searchKeyword);
      } else if (searchIndustry) {
        params.append('industry', searchIndustry);
      }
      if (searchCustomerType !== 'all') params.append('customerType', searchCustomerType);

      /**
       * 服务端文件：server/src/routes/potential-customers.ts
       * 接口：GET /api/v1/potential-customers
       * Query参数：page, pageSize, industry, keyword, customerType
       */
      const res = await fetch(
        `${API_BASE_URL}/api/v1/potential-customers?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (isRefresh || pageNum === 1) {
          setCustomers(data.data.list);
        } else {
          setCustomers((prev) => [...prev, ...data.data.list]);
        }
        setTotal(data.data.total);
        setHasMore(pageNum < data.data.totalPages);
      }
    } catch (error) {
      console.error('获取潜在客户失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHasSearched(true);
    }
  };

  const fetchCustomers = async (pageNum: number, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('pageSize', '20');
      
      // 用户输入关键词搜索时，只使用关键词，不叠加行业筛选
      if (keyword) {
        params.append('keyword', keyword);
      } else if (selectedIndustry) {
        params.append('industry', selectedIndustry);
      }
      if (customerType !== 'all') params.append('customerType', customerType);

      /**
       * 服务端文件：server/src/routes/potential-customers.ts
       * 接口：GET /api/v1/potential-customers
       * Query参数：page, pageSize, industry, keyword, customerType
       */
      const res = await fetch(
        `${API_BASE_URL}/api/v1/potential-customers?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        if (isRefresh || pageNum === 1) {
          setCustomers(data.data.list);
        } else {
          setCustomers((prev) => [...prev, ...data.data.list]);
        }
        setTotal(data.data.total);
        setHasMore(pageNum < data.data.totalPages);
      }
    } catch (error) {
      console.error('获取潜在客户失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHasSearched(true);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(nextPage);
    }
  };

  const handleIndustrySelect = () => {
    // 点击"全部"跳转到行业筛选页面
    router.push('/filter-select', {
      type: 'industry',
      selected: selectedIndustry,
      returnTo: 'potential-customers',
      customerType: customerType,
    });
  };

  // 点击示例行业
  const handleIndustryChipSelect = (industryName: string) => {
    // 如果点击的是已选中的，则取消选中
    if (selectedIndustry === industryName) {
      setSelectedIndustry('');
      setKeyword('');
      // 取消选中后重新搜索
      setTimeout(() => handleSearch(), 50);
    } else {
      // 选择行业时，用行业名称作为关键词搜索
      setSelectedIndustry(industryName);
      setKeyword(industryName);
      // 选择后自动搜索
      setTimeout(() => handleSearch(), 50);
    }
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
    // 选择后自动搜索
    setTimeout(() => handleSearch(), 50);
  };

  // 用户输入关键词时的处理
  const handleKeywordChange = (text: string) => {
    setKeyword(text);
    // 用户输入关键词时，如果之前有选中行业，取消行业筛选
    if (text.length > 0 && selectedIndustry) {
      setSelectedIndustry('');
    }
  };

  // 清空搜索
  const handleClearKeyword = () => {
    setKeyword('');
    setSelectedIndustry('');
    setCustomers([]);
    setHasSearched(false);
    // 重置示例列表
    setIndustryExamples(DEFAULT_INDUSTRY_EXAMPLES);
  };

  const handleCustomerTypeChange = (newType: 'all' | 'bidder' | 'winner') => {
    setCustomerType(newType);
  };

  // 拨打电话
  const handleCall = useCallback((phone: string) => {
    if (!phone) return;
    
    const telUrl = Platform.OS === 'web' ? `tel:${phone}` : `tel:${phone}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          // Web端复制到剪贴板
          if (Platform.OS === 'web') {
            navigator.clipboard?.writeText(phone);
            alert(`电话号码已复制: ${phone}`);
          }
        }
      })
      .catch((err) => console.error('拨打电话失败:', err));
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderFilterChip = useCallback((
    item: { id: number; name: string },
    isSelected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.filterChip, isSelected && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text 
        style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [styles]);

  const renderCustomerCard = useCallback(({ item }: { item: Customer }) => {
    const isWinner = item.customer_type === 'winner';
    
    return (
      <TouchableOpacity 
        style={[styles.customerCard, isWinner && styles.customerCardWinner]}
        onPress={() => router.push('/company-detail', { company: item.company_name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.companyName} numberOfLines={2}>
            {item.company_name}
          </Text>
          <View style={[styles.typeTag, isWinner && styles.typeTagWinner]}>
            <Text style={[styles.typeTagText, isWinner && styles.typeTagTextWinner]}>
              {item.source_type}
            </Text>
          </View>
        </View>
        
        {/* 联系人 */}
        {item.contact_person && (
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <FontAwesome6 name="user" size={12} color="#9CA3AF" />
            </View>
            <Text style={styles.cardText}>{item.contact_person}</Text>
          </View>
        )}
        
        {/* 电话 */}
        {item.contact_phone && (
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <FontAwesome6 name="phone" size={12} color="#2563EB" />
            </View>
            <Text style={[styles.cardText, styles.cardTextHighlight]}>
              {item.contact_phone}
            </Text>
          </View>
        )}
        
        {/* 地址 */}
        {item.address && (
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <FontAwesome6 name="location-dot" size={12} color="#9CA3AF" />
            </View>
            <Text style={styles.cardText} numberOfLines={2}>{item.address}</Text>
          </View>
        )}
        
        {/* 行业 */}
        {item.industry && (
          <View style={styles.cardRow}>
            <View style={styles.cardIcon}>
              <FontAwesome6 name="tag" size={12} color="#9CA3AF" />
            </View>
            <Text style={styles.cardText}>{item.industry}</Text>
          </View>
        )}
        
        {/* 底部 */}
        <View style={styles.cardFooter}>
          <Text style={styles.sourceText} numberOfLines={1}>
            来源：{item.source_title || '招标信息'}
          </Text>
          {item.contact_phone && (
            <TouchableOpacity 
              style={styles.callButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCall(item.contact_phone!);
              }}
            >
              <FontAwesome6 name="phone" size={12} color="#FFFFFF" />
              <Text style={styles.callButtonText}>一键拨打</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [styles, handleCall, router]);

  // 非VIP用户显示提示
  if (!hasVipAccess) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>潜在客户</Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.noPermission}>
          <FontAwesome6 name="crown" size={48} color="#F59E0B" />
          <Text style={styles.noPermissionTitle}>VIP专属功能</Text>
          <Text style={styles.noPermissionText}>开通VIP会员即可使用潜在客户查询功能</Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.upgradeButtonText}>立即开通</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>潜在客户</Text>
          <View style={styles.headerRight} />
        </View>
        
        {/* 搜索框 */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="输入公司名称、关键词搜索..."
              placeholderTextColor="#9CA3AF"
              value={keyword}
              onChangeText={handleKeywordChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              underlineColorAndroid="transparent"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={handleClearKeyword}>
                <FontAwesome6 name="circle-xmark" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* 客户类型切换 */}
        <View style={styles.typeSection}>
          <TouchableOpacity
            style={[styles.typeTab, customerType === 'all' && styles.typeTabActive]}
            onPress={() => handleCustomerTypeChange('all')}
          >
            <FontAwesome6
              name="users"
              size={14}
              color={customerType === 'all' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeTabText, customerType === 'all' && styles.typeTabTextActive]}>
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, customerType === 'bidder' && styles.typeTabActive]}
            onPress={() => handleCustomerTypeChange('bidder')}
          >
            <FontAwesome6
              name="file-contract"
              size={14}
              color={customerType === 'bidder' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeTabText, customerType === 'bidder' && styles.typeTabTextActive]}>
              招标方
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, customerType === 'winner' && styles.typeTabActive]}
            onPress={() => handleCustomerTypeChange('winner')}
          >
            <FontAwesome6
              name="trophy"
              size={14}
              color={customerType === 'winner' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.typeTabText, customerType === 'winner' && styles.typeTabTextActive]}>
              中标方
            </Text>
          </TouchableOpacity>
        </View>

        {/* 筛选区域 */}
        <View style={styles.filterSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>行业筛选</Text>
            <View style={styles.filterScrollWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {/* 显示3个示例行业 */}
                {industryExamples.map((name, index) => {
                  const isSelected = selectedIndustry === name;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => handleIndustryChipSelect(name)}
                    >
                      <Text 
                        style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* 更多按钮 */}
                <TouchableOpacity
                  style={[styles.filterChip, styles.filterChipMore]}
                  onPress={handleIndustrySelect}
                >
                  <Text 
                    style={styles.filterChipText}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                  >
                    更多
                  </Text>
                  <FontAwesome6 name="chevron-right" size={10} color="#6B7280" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 搜索按钮 */}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
          <View style={styles.searchButtonIcon}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.searchButtonText}>搜索潜在客户</Text>
        </TouchableOpacity>

        {/* 结果区域 */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>共找到 {total} 位潜在客户</Text>
            </View>
            
            {loading && customers.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>正在搜索客户信息...</Text>
              </View>
            ) : customers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="users-slash" size={48} color="#D1D5DB" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>暂无符合条件的潜在客户</Text>
                <Text style={styles.emptyHint}>请尝试调整筛选条件</Text>
              </View>
            ) : (
              customers.map((customer) => (
                <View key={customer.id}>
                  {renderCustomerCard({ item: customer })}
                </View>
              ))
            )}
            
            {/* 加载更多 */}
            {hasMore && customers.length > 0 && (
              <TouchableOpacity 
                style={{ alignItems: 'center', paddingVertical: Spacing.md }}
                onPress={handleLoadMore}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>加载更多</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
