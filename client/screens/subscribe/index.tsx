import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
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

const mockSubscribes: Subscribe[] = [
  { id: 1, type: 'industry', value: 'IT服务', enabled: true, createdAt: '2026-03-01' },
  { id: 2, type: 'industry', value: '建筑工程', enabled: true, createdAt: '2026-03-05' },
  { id: 3, type: 'keyword', value: '智慧城市', enabled: true, createdAt: '2026-03-10' },
  { id: 4, type: 'keyword', value: '医疗设备', enabled: false, createdAt: '2026-03-12' },
  { id: 5, type: 'region', value: '广东省', enabled: true, createdAt: '2026-03-15' },
  { id: 6, type: 'region', value: '北京市', enabled: true, createdAt: '2026-03-18' },
];

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  industry: { label: '行业', icon: 'industry', color: '#2563EB' },
  keyword: { label: '关键词', icon: 'magnifying-glass', color: '#059669' },
  region: { label: '地区', icon: 'location-dot', color: '#EA580C' },
};

export default function SubscribeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [subscribes, setSubscribes] = useState<Subscribe[]>(mockSubscribes);

  const handleToggle = (id: number) => {
    setSubscribes(subscribes.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleDelete = (id: number, value: string) => {
    Alert.alert('删除订阅', `确定要删除「${value}」的订阅吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => setSubscribes(subscribes.filter(s => s.id !== id)),
      },
    ]);
  };

  const handleAddSubscribe = () => {
    Alert.alert('添加订阅', '请选择订阅类型', [
      { text: '行业订阅', onPress: () => router.push('/search', { forSubscribe: 'industry' }) },
      { text: '关键词订阅', onPress: () => router.push('/search', { forSubscribe: 'keyword' }) },
      { text: '地区订阅', onPress: () => router.push('/search', { forSubscribe: 'region' }) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const groupedSubscribes = {
    industry: subscribes.filter(s => s.type === 'industry'),
    keyword: subscribes.filter(s => s.type === 'keyword'),
    region: subscribes.filter(s => s.type === 'region'),
  };

  const renderSubscribeItem = (item: Subscribe) => {
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
          onValueChange={() => handleToggle(item.id)}
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
            <Text style={styles.headerTitle}>订阅管理</Text>
            <TouchableOpacity onPress={handleAddSubscribe}>
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
                <Text style={styles.sectionTitle}>行业订阅</Text>
              </View>
              {groupedSubscribes.industry.map(renderSubscribeItem)}
            </View>
          )}

          {/* 关键词订阅 */}
          {groupedSubscribes.keyword.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome6 name="magnifying-glass" size={14} color="#059669" />
                <Text style={styles.sectionTitle}>关键词订阅</Text>
              </View>
              {groupedSubscribes.keyword.map(renderSubscribeItem)}
            </View>
          )}

          {/* 地区订阅 */}
          {groupedSubscribes.region.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome6 name="location-dot" size={14} color="#EA580C" />
                <Text style={styles.sectionTitle}>地区订阅</Text>
              </View>
              {groupedSubscribes.region.map(renderSubscribeItem)}
            </View>
          )}

          {/* 空状态 */}
          {subscribes.length === 0 && (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="bookmark" size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>暂无订阅</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddSubscribe}>
                <Text style={styles.addButtonText}>立即添加</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 添加按钮 */}
          {subscribes.length > 0 && (
            <TouchableOpacity style={styles.floatingButton} onPress={handleAddSubscribe}>
              <FontAwesome6 name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.floatingButtonText}>添加订阅</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}
