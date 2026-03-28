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

const tabs = [
  { key: 'all', label: '全部', badge: 0 },
  { key: 'system', label: '系统', badge: 0 },
  { key: 'subscribe', label: '订阅', badge: 0 },
  { key: 'alert', label: '提醒', badge: 0 },
];

export default function MessagesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ all: 0, system: 0, subscribe: 0, alert: 0 });

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '50');
      
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setMessages(data.data.list);
        calculateUnreadCounts(data.data.list);
      }
    } catch (error) {
      console.error('获取消息列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateUnreadCounts = (allMessages: Message[]) => {
    const counts = {
      all: allMessages.filter(m => !m.is_read).length,
      system: allMessages.filter(m => m.type === 'system' && !m.is_read).length,
      subscribe: allMessages.filter(m => m.type === 'subscribe' && !m.is_read).length,
      alert: allMessages.filter(m => m.type === 'alert' && !m.is_read).length,
    };
    setUnreadCounts(counts);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/messages/read-all`,
        { method: 'PUT' }
      );
      const data = await res.json();

      if (data.success) {
        setMessages(messages.map((msg) => ({ ...msg, is_read: true })));
        setUnreadCounts({ all: 0, system: 0, subscribe: 0, alert: 0 });
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
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
    // 标记已读
    if (!message.is_read) {
      handleMarkRead(message.id);
    }

    // 根据消息类型跳转
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
        // 系统消息暂不跳转
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

  const getMessageIcon = (type: string, title: string) => {
    // 根据消息类型和标题返回图标
    if (title.includes('截止')) {
      return { name: 'bell-slash', color: '#EC4899' }; // 粉红色铃铛（带斜杠）
    }
    if (title.includes('中标')) {
      return { name: 'bell', color: '#EC4899' }; // 粉红色铃铛
    }
    if (title.includes('匹配')) {
      return { name: 'book', color: '#10B981' }; // 绿色书本
    }
    switch (type) {
      case 'system':
        return { name: 'gear', color: '#2563EB' };
      case 'subscribe':
        return { name: 'bookmark', color: '#059669' };
      case 'alert':
        return { name: 'bell', color: '#EC4899' };
      default:
        return { name: 'envelope', color: '#6B7280' };
    }
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
    const icon = getMessageIcon(item.type, item.title);
    const iconBgStyle = item.type === 'system' 
      ? styles.messageIconSystem 
      : item.type === 'subscribe' 
        ? styles.messageIconSubscribe 
        : styles.messageIconAlert;

    return (
      <TouchableOpacity 
        style={[styles.messageCard, !item.is_read && styles.messageCardUnread]}
        onPress={() => handleMessagePress(item)}
        onLongPress={() => handleDeleteMessage(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.messageIcon, iconBgStyle]}>
          <FontAwesome6 name={icon.name} size={18} color={icon.color} />
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
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }, [styles]);

  const renderTab = useCallback((tab: typeof tabs[0]) => {
    const badge = unreadCounts[tab.key as keyof typeof unreadCounts] || 0;
    return (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
        onPress={() => setActiveTab(tab.key)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
          {badge > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [styles, activeTab, unreadCounts]);

  if (loading && !refreshing) {
    return (
      <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>消息</Text>
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
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>消息</Text>
            {unreadCounts.all > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markReadButton}>全部已读</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab */}
        <View style={styles.tabContainer}>
          {tabs.map(renderTab)}
        </View>

        {/* Message List */}
        <FlatList
          key="messages-list"
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
              <FontAwesome6 name="inbox" size={48} color="#D1D5DB" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>暂无消息</Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}
