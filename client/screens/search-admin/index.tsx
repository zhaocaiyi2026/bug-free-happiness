import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';
import { API_BASE_URL } from '@/constants/api';

// 公告类型选项
const BID_TYPES = [
  { key: '招标公告', label: '招标公告' },
  { key: '中标公告', label: '中标公告' },
  { key: '竞争性磋商', label: '竞争性磋商' },
  { key: '询价公告', label: '询价公告' },
  { key: '框架协议交易公告', label: '框架协议交易公告' },
];

// 数据项类型
interface BidData {
  title: string;
  projectNumber?: string;
  projectName?: string;
  budget?: number;
  bidType?: string;
  publishDate?: string;
  deadline?: string;
  contactPerson?: string;
  contactPhone?: string;
  province?: string;
  city?: string;
  purchasingUnit?: string;
  agency?: string;
  content?: string;
  sourceUrl: string;
}

export default function SearchAdminScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  // 状态
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['招标公告']);
  const [countPerType, setCountPerType] = useState(2);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    success: boolean;
    message: string;
    data?: BidData[];
    dataCount?: number;
    duration?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; data: BidData | null }>({
    visible: false,
    data: null,
  });

  // 切换类型选择
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 执行搜索
  const handleSearch = useCallback(async () => {
    if (selectedTypes.length === 0) {
      Alert.alert('提示', '请至少选择一种公告类型');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      /**
       * 服务端文件：server/src/routes/doubao-search.ts
       * 接口：POST /api/v1/doubao-search/search
       * Body 参数：types: string[], countPerType: number
       */
      const response = await fetch(`${API_BASE_URL}/api/v1/doubao-search/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types: selectedTypes,
          countPerType,
        }),
      });

      const result = await response.json();
      setSearchResult(result);

      if (result.success) {
        Alert.alert('搜索完成', `获取到 ${result.dataCount || 0} 条数据`);
      } else {
        Alert.alert('搜索失败', result.message || '未知错误');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('错误', '网络请求失败，请检查后端服务');
    } finally {
      setIsSearching(false);
    }
  }, [selectedTypes, countPerType]);

  // 审核入库
  const handleSave = useCallback(async () => {
    if (!searchResult?.data || searchResult.data.length === 0) {
      Alert.alert('提示', '没有可保存的数据');
      return;
    }

    Alert.alert(
      '确认入库',
      `将 ${searchResult.data.length} 条数据入库，系统将自动验证数据完整性（正文≥500字符、有联系方式等）`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认入库',
          onPress: async () => {
            setIsSaving(true);
            try {
              /**
               * 服务端文件：server/src/routes/doubao-search.ts
               * 接口：POST /api/v1/doubao-search/approve
               * Body 参数：data: BidData[]
               */
              const response = await fetch(`${API_BASE_URL}/api/v1/doubao-search/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: searchResult.data }),
              });

              const result = await response.json();
              
              if (result.success) {
                Alert.alert(
                  '入库完成',
                  `成功: ${result.saved} 条\n跳过: ${result.skipped} 条\n错误: ${result.errors} 条`
                );
              } else {
                Alert.alert('入库失败', result.message || '未知错误');
              }
            } catch (error) {
              console.error('入库失败:', error);
              Alert.alert('错误', '网络请求失败');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }, [searchResult]);

  // 查看详情
  const viewDetail = (item: BidData) => {
    setDetailModal({ visible: true, data: item });
  };

  // 渲染数据项
  const renderItem = ({ item, index }: { item: BidData; index: number }) => {
    const contentLength = item.content?.length || 0;
    const hasContact = item.contactPerson || item.contactPhone;
    const isValid = contentLength >= 500 && hasContact;

    return (
      <TouchableOpacity style={styles.dataItem} onPress={() => viewDetail(item)}>
        <View style={styles.dataHeader}>
          <View style={[styles.dataIndex, isValid ? styles.indexValid : styles.indexInvalid]}>
            <Text style={styles.dataIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.dataTitleWrap}>
            <Text style={styles.dataTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.dataTags}>
              <Text style={styles.dataTag}>{item.bidType || '招标公告'}</Text>
              {item.budget && (
                <Text style={styles.dataTag}>
                  ¥{(item.budget / 10000).toFixed(1)}万
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.dataMeta}>
          <Text style={styles.dataMetaText}>
            {item.city || item.province || '吉林省'}
          </Text>
          <Text style={styles.dataMetaDot}>·</Text>
          <Text style={styles.dataMetaText}>{item.publishDate || '日期未知'}</Text>
          <Text style={styles.dataMetaDot}>·</Text>
          <Text style={[styles.dataMetaText, isValid ? styles.textValid : styles.textInvalid]}>
            正文 {contentLength}字
          </Text>
        </View>
        <View style={styles.dataContact}>
          <FontAwesome6 name="user" size={12} color="#6B7280" />
          <Text style={styles.dataContactText}>
            {item.contactPerson || '联系人未知'} | {item.contactPhone || '电话未知'}
          </Text>
        </View>
        {!isValid && (
          <View style={styles.dataWarning}>
            <FontAwesome6 name="triangle-exclamation" size={12} color="#F59E0B" />
            <Text style={styles.dataWarningText}>
              {contentLength < 500 ? '正文内容不足' : '缺少联系方式'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>智能搜索管理</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 搜索配置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>搜索配置</Text>
            
            {/* 公告类型选择 */}
            <View style={styles.typeSelector}>
              <Text style={styles.typeLabel}>公告类型：</Text>
              <View style={styles.typeOptions}>
                {BID_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      selectedTypes.includes(type.key) && styles.typeOptionActive,
                    ]}
                    onPress={() => toggleType(type.key)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        selectedTypes.includes(type.key) && styles.typeOptionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 每类数量 */}
            <View style={styles.countSelector}>
              <Text style={styles.countLabel}>每类数量：</Text>
              <View style={styles.countOptions}>
                {[1, 2, 3, 5, 10].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countOption,
                      countPerType === count && styles.countOptionActive,
                    ]}
                    onPress={() => setCountPerType(count)}
                  >
                    <Text
                      style={[
                        styles.countOptionText,
                        countPerType === count && styles.countOptionTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 预计搜索数量 */}
            <Text style={styles.estimateText}>
              预计搜索：{selectedTypes.length * countPerType} 条
            </Text>
          </View>

          {/* 搜索按钮 */}
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <FontAwesome6 name="magnifying-glass" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.searchButtonText}>
              {isSearching ? '搜索中...' : '开始智能搜索'}
            </Text>
          </TouchableOpacity>

          {/* 搜索结果 */}
          {searchResult && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>搜索结果</Text>
                <Text style={styles.resultMeta}>
                  {searchResult.dataCount || 0} 条 | 耗时 {searchResult.duration || '-'}
                </Text>
              </View>

              {searchResult.data && searchResult.data.length > 0 ? (
                <>
                  <FlatList
                    data={searchResult.data}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `item-${index}`}
                    scrollEnabled={false}
                    style={styles.dataList}
                  />
                  
                  {/* 入库按钮 */}
                  <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <FontAwesome6 name="database" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.saveButtonText}>
                      {isSaving ? '入库中...' : '审核并入库'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyResult}>
                  <FontAwesome6 name="folder-open" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>未获取到数据</Text>
                </View>
              )}
            </View>
          )}

          {/* 使用说明 */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>使用说明</Text>
            <View style={styles.helpItem}>
              <FontAwesome6 name="circle-check" size={14} color="#059669" />
              <Text style={styles.helpText}>豆包AI将自动搜索吉林省政府采购网</Text>
            </View>
            <View style={styles.helpItem}>
              <FontAwesome6 name="circle-check" size={14} color="#059669" />
              <Text style={styles.helpText}>自动访问详情页获取完整正文内容</Text>
            </View>
            <View style={styles.helpItem}>
              <FontAwesome6 name="circle-check" size={14} color="#059669" />
              <Text style={styles.helpText}>入库前验证：正文≥500字符、有联系方式</Text>
            </View>
            <View style={styles.helpItem}>
              <FontAwesome6 name="circle-check" size={14} color="#059669" />
              <Text style={styles.helpText}>自动去重：相同URL的公告不会重复入库</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 详情弹窗 */}
      <Modal
        visible={detailModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModal({ visible: false, data: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {detailModal.data?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setDetailModal({ visible: false, data: null })}
              >
                <FontAwesome6 name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>项目编号：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.projectNumber || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>预算金额：</Text>
                <Text style={styles.detailValue}>
                  {detailModal.data?.budget
                    ? `¥${(detailModal.data.budget / 10000).toFixed(2)}万`
                    : '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>招标类型：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.bidType || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>发布日期：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.publishDate || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>截止时间：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.deadline || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>采购单位：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.purchasingUnit || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>代理机构：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.agency || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>联系人：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.contactPerson || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>联系电话：</Text>
                <Text style={styles.detailValue}>{detailModal.data?.contactPhone || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>来源URL：</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {detailModal.data?.sourceUrl || '-'}
                </Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>正文内容</Text>
                <Text style={styles.detailContent}>
                  {detailModal.data?.content || '无内容'}
                </Text>
                <Text style={styles.contentLength}>
                  共 {detailModal.data?.content?.length || 0} 字符
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
