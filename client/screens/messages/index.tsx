import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface Message {
  id: number;
  type: 'system' | 'subscribe' | 'alert';
  title: string;
  description: string;
  data?: {
    bidId?: number;
    winBidId?: number;
    subType?: 'deadline' | 'winbid' | 'match';
    subscriptionType?: string;
    subscriptionValue?: string;
    daysLeft?: number;
    winCompany?: string;
    winAmount?: number;
  };
  is_read: boolean;
  created_at: string;
}

interface MessageCategory {
  key: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  count: number;
  latestMessage?: Message;
}

export default function MessagesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<MessageCategory[]>([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // 先触发消息生成（静默执行）
      fetch(`${API_BASE_URL}/api/v1/messages/generate?type=all`, {
        method: 'POST',
      }).catch(err => console.log('消息生成触发失败:', err));
      
      // 获取各分类未读数量
      /**
       * 服务端文件：server/src/routes/messages.ts
       * 接口：GET /api/v1/messages/unread-by-type
       * Query 参数：userId: number
       */
      const unreadRes = await fetch(
        `${API_BASE_URL}/api/v1/messages/unread-by-type?userId=1`
      );
      const unreadData = await unreadRes.json();

      // 获取各类最新消息
      const [deadlineListRes, winbidListRes, matchListRes, systemListRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/messages?pageSize=1&subType=deadline`),
        fetch(`${API_BASE_URL}/api/v1/messages?pageSize=1&subType=winbid`),
        fetch(`${API_BASE_URL}/api/v1/messages?pageSize=1&subType=match`),
        fetch(`${API_BASE_URL}/api/v1/messages?pageSize=1&type=system`),
      ]);

      const [deadlineList, winbidList, matchList, systemList] = await Promise.all([
        deadlineListRes.json(),
        winbidListRes.json(),
        matchListRes.json(),
        systemListRes.json(),
      ]);

      const counts = unreadData.success ? unreadData.data : { deadline: 0, winbid: 0, match: 0, system: 0 };

      const categoryList: MessageCategory[] = [
        {
          key: 'deadline',
          title: '招标截止提醒',
          icon: 'clock',
          color: '#EC4899',
          bgColor: '#FDF2F8',
          description: '投标截止日期临近的项目提醒',
          count: counts.deadline,
          latestMessage: deadlineList.success?.data?.list?.[0],
        },
        {
          key: 'winbid',
          title: '中标公告提醒',
          icon: 'trophy',
          color: '#F59E0B',
          bgColor: '#FFFBEB',
          description: '关注项目的最新中标公告',
          count: counts.winbid,
          latestMessage: winbidList.success?.data?.list?.[0],
        },
        {
          key: 'match',
          title: '新招标匹配',
          icon: 'magnifying-glass',
          color: '#10B981',
          bgColor: '#ECFDF5',
          description: '符合订阅条件的新招标项目',
          count: counts.match,
          latestMessage: matchList.success?.data?.list?.[0],
        },
        {
          key: 'system',
          title: '系统通知',
          icon: 'gear',
          color: '#2563EB',
          bgColor: '#EFF6FF',
          description: '系统更新与账户相关通知',
          count: counts.system,
          latestMessage: systemList.success?.data?.list?.[0],
        },
      ];

      setCategories(categoryList);
    } catch (error) {
      console.error('获取消息列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleCategoryPress = (category: MessageCategory) => {
    // 跳转到消息列表页面，传递category参数
    router.push('/message-list', { category: category.key });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const renderCategory = useCallback((category: MessageCategory) => {
    return (
      <TouchableOpacity
        key={category.key}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
            <FontAwesome6 name={category.icon} size={22} color={category.color} />
          </View>
          {category.count > 0 && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
              <Text style={styles.categoryBadgeText}>
                {category.count > 99 ? '99+' : category.count}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.categoryContent}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            {category.latestMessage && (
              <Text style={styles.categoryTime}>
                {formatTime(category.latestMessage.created_at)}
              </Text>
            )}
          </View>
          <Text style={styles.categoryMessage} numberOfLines={2}>
            {category.latestMessage?.description || category.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [styles]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#FFFFFF" statusBarStyle="dark">
        <View style={[styles.navBar, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.navBarContent}>
            <Text style={styles.navBarTitle}>消息中心</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#FFFFFF" statusBarStyle="dark">
      {/* 导航栏 */}
      <View style={[styles.navBar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.navBarContent}>
          <Text style={styles.navBarTitle}>消息中心</Text>
          <Text style={styles.navBarSubtitle}>查看各类消息提醒</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map(renderCategory)}
        </View>

        {/* Empty State */}
        {categories.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <FontAwesome6 name="bell-slash" size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
