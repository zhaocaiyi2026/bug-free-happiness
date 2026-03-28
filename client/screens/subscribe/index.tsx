import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

interface Subscribe {
  id: number;
  type: 'industry' | 'keyword' | 'region';
  value: string;
  enabled: boolean;
  createdAt: string;
}

interface Industry {
  id: number;
  name: string;
  code: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  industry: { label: '行业', icon: 'industry', color: '#2563EB' },
  keyword: { label: '关键词', icon: 'magnifying-glass', color: '#059669' },
  region: { label: '地区', icon: 'location-dot', color: '#EA580C' },
};

const REGIONS = [
  '北京市', '上海市', '天津市', '重庆市',
  '广东省', '浙江省', '江苏省', '山东省', '河南省', '四川省',
  '湖北省', '湖南省', '福建省', '安徽省', '河北省', '陕西省',
  '辽宁省', '江西省', '云南省', '广西', '山西省', '贵州省',
  '黑龙江省', '吉林省', '甘肃省', '内蒙古', '新疆', '宁夏',
  '海南省', '青海省', '西藏',
];

export default function SubscribeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [subscribes, setSubscribes] = useState<Subscribe[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 状态
  const [modalVisible, setModalVisible] = useState(false);
  const [subscribeType, setSubscribeType] = useState<'industry' | 'keyword' | 'region'>('keyword');
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // 获取订阅列表
  const fetchSubscribes = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/subscriptions?userId=1`
      );
      const data = await res.json();

      if (data.success) {
        setSubscribes(data.data.map((item: any) => ({
          id: item.id,
          type: item.type,
          value: item.value,
          enabled: item.enabled,
          createdAt: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        })));
      }
    } catch (error) {
      console.error('获取订阅列表失败:', error);
      // 使用模拟数据
      setSubscribes([
        { id: 1, type: 'industry', value: 'IT服务', enabled: true, createdAt: '2026-03-01' },
        { id: 2, type: 'industry', value: '建筑工程', enabled: true, createdAt: '2026-03-05' },
        { id: 3, type: 'keyword', value: '智慧城市', enabled: true, createdAt: '2026-03-10' },
        { id: 4, type: 'keyword', value: '医疗设备', enabled: false, createdAt: '2026-03-12' },
        { id: 5, type: 'region', value: '广东省', enabled: true, createdAt: '2026-03-15' },
        { id: 6, type: 'region', value: '北京市', enabled: true, createdAt: '2026-03-18' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 获取行业列表
  const fetchIndustries = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/common/industries`
      );
      const data = await res.json();

      if (data.success && data.data) {
        setIndustries(data.data);
      }
    } catch (error) {
      console.error('获取行业列表失败:', error);
    }
  };

  useEffect(() => {
    fetchSubscribes();
    fetchIndustries();
  }, []);

  const handleToggle = useCallback(async (id: number, enabled: boolean) => {
    setSubscribes(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !enabled } : s
    ));

    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/subscriptions/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled }),
        }
      );
    } catch (error) {
      console.error('更新订阅状态失败:', error);
    }
  }, []);

  const handleDelete = useCallback((id: number, value: string) => {
    Alert.alert('删除订阅', `确定要删除「${value}」的订阅吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setSubscribes(prev => prev.filter(s => s.id !== id));
          try {
            await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/subscriptions/${id}`,
              { method: 'DELETE' }
            );
          } catch (error) {
            console.error('删除订阅失败:', error);
          }
        },
      },
    ]);
  }, []);

  const handleAddSubscribe = useCallback(() => {
    setSubscribeType('keyword');
    setKeywordInput('');
    setSelectedIndustry(null);
    setSelectedRegion(null);
    setModalVisible(true);
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    let value = '';

    if (subscribeType === 'keyword') {
      value = keywordInput.trim();
      if (!value) {
        Alert.alert('提示', '请输入关键词');
        return;
      }
    } else if (subscribeType === 'industry') {
      value = selectedIndustry || '';
      if (!value) {
        Alert.alert('提示', '请选择行业');
        return;
      }
    } else if (subscribeType === 'region') {
      value = selectedRegion || '';
      if (!value) {
        Alert.alert('提示', '请选择地区');
        return;
      }
    }

    // 检查是否已存在
    if (subscribes.some(s => s.type === subscribeType && s.value === value)) {
      Alert.alert('提示', '该订阅已存在');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1,
            type: subscribeType,
            value: value,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setSubscribes(prev => [...prev, {
          id: data.data?.id || Date.now(),
          type: subscribeType,
          value: value,
          enabled: true,
          createdAt: new Date().toISOString().split('T')[0],
        }]);
        setModalVisible(false);
        Alert.alert('成功', '添加订阅成功');
      } else {
        // 本地添加
        setSubscribes(prev => [...prev, {
          id: Date.now(),
          type: subscribeType,
          value: value,
          enabled: true,
          createdAt: new Date().toISOString().split('T')[0],
        }]);
        setModalVisible(false);
      }
    } catch (error) {
      console.error('添加订阅失败:', error);
      // 本地添加
      setSubscribes(prev => [...prev, {
        id: Date.now(),
        type: subscribeType,
        value: value,
        enabled: true,
        createdAt: new Date().toISOString().split('T')[0],
      }]);
      setModalVisible(false);
    }
  }, [subscribeType, keywordInput, selectedIndustry, selectedRegion, subscribes]);

  const groupedSubscribes = useMemo(() => ({
    industry: subscribes.filter(s => s.type === 'industry'),
    keyword: subscribes.filter(s => s.type === 'keyword'),
    region: subscribes.filter(s => s.type === 'region'),
  }), [subscribes]);

  const renderSubscribeItem = useCallback((item: Subscribe) => {
    const typeInfo = TYPE_LABELS[item.type];
    return (
      <View key={item.id} style={styles.subscribeItem}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}15` }]}>
          <FontAwesome6 name={typeInfo.icon} size={16} color={typeInfo.color} />
        </View>
        <View style={styles.subscribeContent}>
          <Text style={styles.subscribeValue}>{item.value}</Text>
          <Text style={styles.subscribeMeta}>{typeInfo.label} · 创建于 {item.createdAt}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => handleToggle(item.id, item.enabled)}
          trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
          thumbColor="#FFFFFF"
        />
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.value)}
        >
          <FontAwesome6 name="trash" size={14} color="#C8102E" />
        </TouchableOpacity>
      </View>
    );
  }, [styles, handleToggle, handleDelete]);

  if (loading) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>订阅管理</Text>
            <View style={{ width: 36 }} />
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
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>订阅管理</Text>
            <TouchableOpacity onPress={handleAddSubscribe} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome6 name="plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 订阅说明 */}
          <View style={styles.tipCard}>
            <FontAwesome6 name="lightbulb" size={18} color="#EA580C" />
            <Text style={styles.tipText}>开启订阅后，有符合条件的招标信息将第一时间推送给您</Text>
          </View>

          {/* 行业订阅 */}
          {groupedSubscribes.industry.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome6 name="industry" size={14} color="#2563EB" />
                <Text style={styles.sectionTitle}>行业订阅 ({groupedSubscribes.industry.length})</Text>
              </View>
              {groupedSubscribes.industry.map(renderSubscribeItem)}
            </View>
          )}

          {/* 关键词订阅 */}
          {groupedSubscribes.keyword.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome6 name="magnifying-glass" size={14} color="#059669" />
                <Text style={styles.sectionTitle}>关键词订阅 ({groupedSubscribes.keyword.length})</Text>
              </View>
              {groupedSubscribes.keyword.map(renderSubscribeItem)}
            </View>
          )}

          {/* 地区订阅 */}
          {groupedSubscribes.region.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome6 name="location-dot" size={14} color="#EA580C" />
                <Text style={styles.sectionTitle}>地区订阅 ({groupedSubscribes.region.length})</Text>
              </View>
              {groupedSubscribes.region.map(renderSubscribeItem)}
            </View>
          )}

          {/* 空状态 */}
          {subscribes.length === 0 && (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="bookmark" size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>暂无订阅</Text>
              <Text style={styles.emptySubText}>添加订阅后，系统将自动为您推送相关招标信息</Text>
            </View>
          )}

          {/* 添加按钮 */}
          <TouchableOpacity style={styles.floatingButton} onPress={handleAddSubscribe}>
            <FontAwesome6 name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>添加订阅</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 添加订阅 Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>添加订阅</Text>
                    <TouchableOpacity 
                      style={styles.modalCloseButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <FontAwesome6 name="xmark" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  {/* 类型选择 */}
                  <View style={styles.modalBody}>
                    <Text style={styles.inputLabel}>订阅类型</Text>
                    <View style={styles.typeSelector}>
                      {(['keyword', 'industry', 'region'] as const).map((type) => {
                        const info = TYPE_LABELS[type];
                        return (
                          <TouchableOpacity
                            key={type}
                            style={[styles.typeOption, subscribeType === type && styles.typeOptionActive]}
                            onPress={() => setSubscribeType(type)}
                          >
                            <FontAwesome6 
                              name={info.icon} 
                              size={16} 
                              color={subscribeType === type ? '#FFFFFF' : info.color} 
                            />
                            <Text style={[styles.typeOptionText, subscribeType === type && styles.typeOptionTextActive]}>
                              {info.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* 关键词输入 */}
                    {subscribeType === 'keyword' && (
                      <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>关键词</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="请输入要订阅的关键词"
                          placeholderTextColor="#9CA3AF"
                          value={keywordInput}
                          onChangeText={setKeywordInput}
                          maxLength={20}
                        />
                        <Text style={styles.inputHint}>例如：智慧城市、医疗器械、光伏发电</Text>
                      </View>
                    )}

                    {/* 行业选择 */}
                    {subscribeType === 'industry' && (
                      <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>选择行业</Text>
                        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                          <View style={styles.optionsGrid}>
                            {(industries.length > 0 ? industries : [
                              { id: 1, name: '建筑工程' },
                              { id: 2, name: 'IT服务' },
                              { id: 3, name: '医疗设备' },
                              { id: 4, name: '教育培训' },
                              { id: 5, name: '交通运输' },
                              { id: 6, name: '环保能源' },
                              { id: 7, name: '政府采购' },
                              { id: 8, name: '市政设施' },
                              { id: 9, name: '水利水电' },
                              { id: 10, name: '农林牧渔' },
                            ]).map((item) => (
                              <TouchableOpacity
                                key={item.id}
                                style={[
                                  styles.optionChip,
                                  selectedIndustry === item.name && styles.optionChipActive,
                                ]}
                                onPress={() => setSelectedIndustry(item.name)}
                              >
                                <Text style={[
                                  styles.optionChipText,
                                  selectedIndustry === item.name && styles.optionChipTextActive,
                                ]}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {/* 地区选择 */}
                    {subscribeType === 'region' && (
                      <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>选择地区</Text>
                        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                          <View style={styles.optionsGrid}>
                            {REGIONS.map((region) => (
                              <TouchableOpacity
                                key={region}
                                style={[
                                  styles.optionChip,
                                  selectedRegion === region && styles.optionChipActive,
                                ]}
                                onPress={() => setSelectedRegion(region)}
                              >
                                <Text style={[
                                  styles.optionChipText,
                                  selectedRegion === region && styles.optionChipTextActive,
                                ]}>
                                  {region}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleConfirmAdd}
                    >
                      <Text style={styles.confirmButtonText}>确定添加</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </Screen>
  );
}
