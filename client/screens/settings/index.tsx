import { API_BASE_URL } from '@/constants/api';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

interface DataSourceStatus {
  platform: string;
  name: string;
  priority: number;
  isAvailable: boolean;
  isEnabled: boolean;
  apiType: string;
}

interface DataStatistics {
  summary: {
    totalBids: number;
    totalWinBids: number;
  };
  recentSyncs: Array<{
    id: number;
    source_platform: string;
    sync_type: string;
    start_time: string;
    status: string;
    total_count: number;
    success_count: number;
  }>;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    notification: true,
    sound: true,
    vibration: false,
    autoRefresh: true,
    cacheClear: false,
  });
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [loadingDataSources, setLoadingDataSources] = useState(false);
  const [showProvincial, setShowProvincial] = useState(false);

  useEffect(() => {
    fetchDataSources();
    fetchStatistics();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoadingDataSources(true);
      const res = await fetch(
        `${API_BASE_URL}/api/v1/data-sources/status`
      );
      const data = await res.json();
      if (data.success) {
        setDataSources(data.data.sources);
      }
    } catch (error) {
      console.error('获取数据源状态失败:', error);
    } finally {
      setLoadingDataSources(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/data-sources/statistics`
      );
      const data = await res.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('获取数据统计失败:', error);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleClearCache = () => {
    Alert.alert('清除缓存', '确定要清除本地缓存数据吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          Alert.alert('成功', '缓存已清除');
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          router.replace('/');
        },
      },
    ]);
  };

  const handleSyncData = (platform: string) => {
    Alert.alert(
      '同步数据',
      `确定要从 ${dataSources.find(s => s.platform === platform)?.name} 同步数据吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/v1/data-sources/sync/${platform}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
              );
              const data = await res.json();
              if (data.success) {
                Alert.alert('同步成功', `成功同步 ${data.data?.saved || 0} 条数据`);
                fetchStatistics();
              } else {
                Alert.alert('同步失败', data.message || '请稍后重试');
              }
            } catch (error) {
              Alert.alert('同步失败', '网络错误，请稍后重试');
            }
          },
        },
      ]
    );
  };

  // 分组数据源
  const nationalSources = dataSources.filter(s => s.priority >= 100 && !s.platform.startsWith('province_'));
  const provincialSources = dataSources.filter(s => s.platform.startsWith('province_'));

  const renderSwitchItem = (
    icon: string,
    iconColor: string,
    title: string,
    description: string,
    key: keyof typeof settings
  ) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
        <FontAwesome6 name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggle(key)}
        trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderDataSourceItem = (source: DataSourceStatus, showSync?: boolean) => (
    <TouchableOpacity 
      key={source.platform} 
      style={styles.settingItem}
      onPress={showSync && source.isAvailable ? () => handleSyncData(source.platform) : undefined}
    >
      <View style={[styles.settingIcon, { backgroundColor: source.isAvailable ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
        <FontAwesome6 
          name={source.isAvailable ? 'check-circle' : 'times-circle'} 
          size={18} 
          color={source.isAvailable ? '#059669' : '#EF4444'} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{source.name}</Text>
        <Text style={styles.settingDesc}>
          {source.isAvailable ? '已连接 · 点击同步数据' : '未配置'}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: source.isAvailable ? '#ECFDF5' : '#FEF2F2' }]}>
        <Text style={[styles.statusText, { color: source.isAvailable ? '#059669' : '#EF4444' }]}>
          {source.isAvailable ? '可用' : '不可用'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>设置</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 数据统计 */}
          {statistics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>数据统计</Text>
              <View style={[styles.settingItem, { justifyContent: 'space-around' }]}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statValue, { color: '#2563EB' }]}>{statistics.summary.totalBids}</Text>
                  <Text style={styles.statLabel}>招标信息</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: '#E5E7EB' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statValue, { color: '#059669' }]}>{statistics.summary.totalWinBids}</Text>
                  <Text style={styles.statLabel}>中标信息</Text>
                </View>
              </View>
            </View>
          )}

          {/* 通知设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知设置</Text>
            {renderSwitchItem('bell', '#2563EB', '消息通知', '接收新招标、中标等消息推送', 'notification')}
            {renderSwitchItem('volume-high', '#059669', '声音提醒', '有新消息时播放提示音', 'sound')}
            {renderSwitchItem('mobile-screen', '#EA580C', '震动提醒', '有新消息时震动', 'vibration')}
          </View>

          {/* 数据设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据设置</Text>
            {renderSwitchItem('rotate', '#7C3AED', '自动刷新', '启动时自动获取最新数据', 'autoRefresh')}
            <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                <FontAwesome6 name="trash" size={18} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>清除缓存</Text>
                <Text style={styles.settingDesc}>清除本地临时数据，释放存储空间</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 国家级数据源状态 */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={styles.sectionTitle}>国家级数据源</Text>
              {loadingDataSources && <ActivityIndicator size="small" color="#2563EB" />}
            </View>
            {nationalSources.map((source) => renderDataSourceItem(source, true))}
          </View>

          {/* 省级数据源状态 */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm }}
              onPress={() => setShowProvincial(!showProvincial)}
            >
              <Text style={styles.sectionTitle}>省级数据源 ({provincialSources.length}个)</Text>
              <FontAwesome6 
                name={showProvincial ? 'chevron-up' : 'chevron-down'} 
                size={12} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            {showProvincial && provincialSources.map((source) => (
              <View key={source.platform} style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: source.isAvailable ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <FontAwesome6 
                    name={source.isAvailable ? 'check-circle' : 'times-circle'} 
                    size={18} 
                    color={source.isAvailable ? '#059669' : '#EF4444'} 
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{source.name}</Text>
                  <Text style={styles.settingDesc}>
                    {source.isAvailable ? '已连接' : '未配置'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: source.isAvailable ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Text style={[styles.statusText, { color: source.isAvailable ? '#059669' : '#EF4444' }]}>
                    {source.isAvailable ? '可用' : '不可用'}
                  </Text>
                </View>
              </View>
            ))}
            {!showProvincial && (
              <Text style={{ fontSize: 12, color: '#9CA3AF', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
                点击展开查看全部省级数据源
              </Text>
            )}
          </View>

          {/* 数据源配置帮助 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据源配置</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => {
                Alert.alert(
                  '配置数据源',
                  '官方数据源（全国公共资源交易平台、中国招标投标公共服务平台）免费开放，无需配置即可使用。\n\n如需使用思通数据API，请关注微信公众号"思通数据"获取免费API密钥。',
                  [{ text: '知道了' }]
                );
              }}
            >
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                <FontAwesome6 name="circle-question" size={18} color="#2563EB" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>如何配置数据源？</Text>
                <Text style={styles.settingDesc}>官方数据源免费开放使用</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}
              onPress={async () => {
                try {
                  Alert.alert('同步中', '正在从全国公共资源交易平台同步数据...');
                  const res = await fetch(
                    `${API_BASE_URL}/api/v1/data-sources/sync/ggzy`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxCount: 20 }) }
                  );
                  const data = await res.json();
                  if (data.success) {
                    Alert.alert('同步成功', `成功获取 ${data.data?.fetched || 0} 条数据，保存 ${data.data?.saved || 0} 条`);
                    fetchStatistics();
                  } else {
                    Alert.alert('同步提示', data.message || '暂无新数据');
                  }
                } catch (error) {
                  Alert.alert('同步失败', '网络错误，请稍后重试');
                }
              }}
            >
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                <FontAwesome6 name="cloud-arrow-down" size={18} color="#059669" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>立即同步数据</Text>
                <Text style={styles.settingDesc}>从官方平台获取最新招标信息</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 其他设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>其他</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/feedback')}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                <FontAwesome6 name="comment-dots" size={18} color="#2563EB" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>意见反馈</Text>
                <Text style={styles.settingDesc}>帮助我们改进产品</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('关于', '招标通 v1.0.0\n\n专业招标信息聚合平台\n整合全国公共资源交易平台等官方数据源\n提供实时招标、中标信息\n助力企业把握商机')}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                <FontAwesome6 name="circle-info" size={18} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>关于招标通</Text>
                <Text style={styles.settingDesc}>版本 1.0.0</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* 退出登录 */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome6 name="right-from-bracket" size={16} color="#C8102E" />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Screen>
  );
}
