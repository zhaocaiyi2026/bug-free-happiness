import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { Disclaimer } from '@/components/Disclaimer';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [settings, setSettings] = useState({
    notification: true,
    sound: true,
    vibration: false,
    autoRefresh: true,
    cacheClear: false,
  });

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
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要退出当前账号吗？');
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert('退出登录', '确定要退出当前账号吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]);
    }
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
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
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

          {/* 其他设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>其他</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/search-admin')}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(147, 51, 234, 0.1)' }]}>
                <FontAwesome6 name="robot" size={18} color="#9333EA" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>智能搜索管理</Text>
                <Text style={styles.settingDesc}>AI搜索招标采购信息并入库</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('关于', '招采易 v1.0.0\n\n一站式招标采购信息平台\n整合全国公共资源交易平台\n提供实时招标、中标信息\n助力企业把握商机')}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                <FontAwesome6 name="circle-info" size={18} color="#6B7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>关于招采易</Text>
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

          {/* 免责声明 */}
          <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
            <Disclaimer mode="full" />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}
