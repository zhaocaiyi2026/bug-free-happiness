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
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

interface Message {
  id: number;
  type: 'system' | 'subscribe' | 'alert';
  title: string;
  description: string;
  data?: Record<string, any>;
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
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages?page=1&pageSize=100`
      );
      const data = await res.json();

      if (data.success) {
        const messages = data.data.list as Message[];
        processCategories(messages);
      }
    } catch (error) {
      console.error('获取消息列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processCategories = (messages: Message[]) => {
    // 分类统计
    const deadlineMessages = messages.filter(m => m.title.includes('截止'));
    const winbidMessages = messages.filter(m => m.title.includes('中标'));
    const matchMessages = messages.filter(m => m.title.includes('匹配'));
    const systemMessages = messages.filter(m => m.type === 'system');

    const categoryList: MessageCategory[] = [
      {
        key: 'deadline',
        title: '招标截止提醒',
        icon: 'clock',
        color: '#EC4899',
        bgColor: '#FDF2F8',
        description: '投标截止日期临近的项目提醒',
        count: deadlineMessages.filter(m => !m.is_read).length,
        latestMessage: deadlineMessages[0],
      },
      {
        key: 'winbid',
        title: '中标公告提醒',
        icon: 'trophy',
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        description: '关注项目的最新中标公告',
        count: winbidMessages.filter(m => !m.is_read).length,
        latestMessage: winbidMessages[0],
      },
      {
        key: 'match',
        title: '新招标匹配',
        icon: 'magnifying-glass',
        color: '#10B981',
        bgColor: '#ECFDF5',
        description: '符合订阅条件的新招标项目',
        count: matchMessages.filter(m => !m.is_read).length,
        latestMessage: matchMessages[0],
      },
      {
        key: 'system',
        title: '系统通知',
        icon: 'gear',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        description: '系统更新与账户相关通知',
        count: systemMessages.filter(m => !m.is_read).length,
        latestMessage: systemMessages[0],
      },
    ];

    setCategories(categoryList);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleCategoryPress = (category: MessageCategory) => {
    switch (category.key) {
      case 'deadline':
        // 招标截止提醒 → 跳转到紧急招标列表
        router.push('/bidList', { type: 'urgent' });
        break;
      case 'winbid':
        // 中标公告提醒 → 跳转到中标列表
        router.push('/bidList', { type: 'win' });
        break;
      case 'match':
        // 新招标匹配 → 跳转到今日新增列表
        router.push('/bidList', { type: 'today' });
        break;
      case 'system':
        // 系统通知 → 跳转到消息列表
        router.push('/message-list', { category: category.key });
        break;
      default:
        router.push('/message-list', { category: category.key });
    }
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
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
            <FontAwesome6 name={category.icon} size={22} color={category.color} />
          </View>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryTitleRow}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              {category.count > 0 && (
                <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryBadgeText}>
                    {category.count > 99 ? '99+' : category.count}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.categoryDesc}>{category.description}</Text>
          </View>
          <FontAwesome6 name="chevron-right" size={16} color="#D1D5DB" />
        </View>

        {category.latestMessage && (
          <View style={styles.latestMessage}>
            <View style={styles.latestMessageDot} />
            <Text style={styles.latestMessageText} numberOfLines={1}>
              {category.latestMessage.description}
            </Text>
            <Text style={styles.latestMessageTime}>
              {formatTime(category.latestMessage.created_at)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [styles]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.headerTitle}>消息</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.sm },
        ]}
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>消息</Text>
          <Text style={styles.headerSubtitle}>查看各类消息提醒</Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map(renderCategory)}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <FontAwesome6 name="lightbulb" size={16} color="#F59E0B" />
          <Text style={styles.tipsText}>
            点击分类查看相关项目列表
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
