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
  const [loadingDataSources, setLoadingDataSources] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      setLoadingDataSources(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/data-sources/status`
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

          {/* 数据源状态 */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={styles.sectionTitle}>数据源状态</Text>
              {loadingDataSources && <ActivityIndicator size="small" color="#2563EB" />}
            </View>
            {dataSources.filter(s => s.priority >= 100).map((source) => (
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
            <TouchableOpacity 
              style={[styles.settingItem, { marginTop: Spacing.xs }]} 
              onPress={() => {
                Alert.alert(
                  '配置数据源',
                  '请关注微信公众号"思通数据"获取免费API密钥，然后在服务器环境变量中配置 STONEDT_APP_ID 和 STONEDT_APP_SECRET',
                  [{ text: '知道了' }]
                );
              }}
            >
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                <FontAwesome6 name="circle-question" size={18} color="#2563EB" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>如何配置数据源？</Text>
                <Text style={styles.settingDesc}>获取免费API密钥的方法</Text>
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
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('关于', '招标通 v1.0.0')}>
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
