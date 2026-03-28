import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
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

const categoryConfig: Record<string, { title: string; icon: string; color: string; filter: (m: Message) => boolean }> = {
  deadline: {
    title: '招标截止提醒',
    icon: 'clock',
    color: '#EC4899',
    filter: (m) => m.title.includes('截止'),
  },
  winbid: {
    title: '中标公告提醒',
    icon: 'trophy',
    color: '#F59E0B',
    filter: (m) => m.title.includes('中标'),
  },
  match: {
    title: '新招标匹配',
    icon: 'magnifying-glass',
    color: '#10B981',
    filter: (m) => m.title.includes('匹配'),
  },
  system: {
    title: '系统通知',
    icon: 'gear',
    color: '#2563EB',
    filter: (m) => m.type === 'system',
  },
};

export default function MessageListScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ category: string }>();

  const categoryKey = params.category || 'deadline';
  const config = categoryConfig[categoryKey] || categoryConfig.deadline;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [categoryKey]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages?page=1&pageSize=100`
      );
      const data = await res.json();

      if (data.success) {
        const allMessages = data.data.list as Message[];
        const filtered = allMessages.filter(config.filter);
        setMessages(filtered);
      }
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

  const handleMarkRead = async (messageId: number) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages/${messageId}/read`,
        { method: 'PUT' }
      );

      setMessages(messages.map((msg) =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMessagePress = (message: Message) => {
    if (!message.is_read) {
      handleMarkRead(message.id);
    }

    switch (message.type) {
      case 'alert':
        if (message.data?.bidId) {
          router.push('/detail', { id: message.data.bidId });
        } else if (message.data?.winBidId) {
          router.push('/win-bid-detail', { id: message.data.winBidId });
        }
        break;
      case 'subscribe':
        if (message.data?.industry) {
          router.push('/search', { industry: message.data.industry });
        } else {
          router.push('/search');
        }
        break;
      case 'system':
        break;
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    Alert.alert('删除消息', '确定要删除这条消息吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages/${messageId}`,
              { method: 'DELETE' }
            );
            const data = await res.json();

            if (data.success) {
              setMessages(messages.filter((msg) => msg.id !== messageId));
            }
          } catch (error) {
            console.error('删除消息失败:', error);
          }
        },
      },
    ]);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return (
      <TouchableOpacity
        style={[styles.messageCard, !item.is_read && styles.messageCardUnread]}
        onPress={() => handleMessagePress(item)}
        onLongPress={() => handleDeleteMessage(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.messageIcon, { backgroundColor: `${config.color}15` }]}>
          <FontAwesome6 name={config.icon} size={18} color={config.color} />
        </View>
        <View style={styles.messageContent}>
          <Text style={[styles.messageTitle, !item.is_read && styles.messageTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.messageDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
      </TouchableOpacity>
    );
  }, [styles, config]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={{ width: 40 }} />
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
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Message List */}
        <FlatList
          key="message-list"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>暂无{config.title}</Text>
              <Text style={styles.emptySubtext}>新的消息会在这里显示</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
