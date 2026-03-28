import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  time: string;
  isRead: boolean;
}

const mockMessages: Message[] = [
  {
    id: 1,
    type: 'alert',
    title: '招标截止提醒',
    description: '您关注的「某市智慧城市建设项目」将于明天截止投标，请尽快处理。',
    time: '10分钟前',
    isRead: false,
  },
  {
    id: 2,
    type: 'subscribe',
    title: '新招标匹配通知',
    description: '根据您的订阅条件，新增3条「IT服务」类招标信息。',
    time: '1小时前',
    isRead: false,
  },
  {
    id: 3,
    type: 'system',
    title: '系统升级通知',
    description: '招标通APP已升级至最新版本，新增智能推荐功能，快来体验吧！',
    time: '昨天',
    isRead: true,
  },
  {
    id: 4,
    type: 'alert',
    title: 'VIP会员即将到期',
    description: '您的VIP会员将于7天后到期，续费可享受8折优惠。',
    time: '2天前',
    isRead: true,
  },
  {
    id: 5,
    type: 'subscribe',
    title: '热门招标推送',
    description: '本周热门：北京地铁线路改造工程招标，预算5.2亿。',
    time: '3天前',
    isRead: true,
  },
];

const tabs = [
  { key: 'all', label: '全部', badge: 2 },
  { key: 'system', label: '系统', badge: 0 },
  { key: 'subscribe', label: '订阅', badge: 1 },
  { key: 'alert', label: '提醒', badge: 1 },
];

export default function MessagesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter((msg) => msg.type === activeTab);

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  const handleMarkAllRead = () => {
    setMessages(messages.map((msg) => ({ ...msg, isRead: true })));
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system':
        return { name: 'gear', color: '#2563EB' };
      case 'subscribe':
        return { name: 'bookmark', color: '#059669' };
      case 'alert':
        return { name: 'bell', color: '#C8102E' };
      default:
        return { name: 'envelope', color: '#6B7280' };
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const icon = getMessageIcon(item.type);
    const iconBgStyle = item.type === 'system' 
      ? styles.messageIconSystem 
      : item.type === 'subscribe' 
        ? styles.messageIconSubscribe 
        : styles.messageIconAlert;

    return (
      <TouchableOpacity 
        style={[styles.messageCard, !item.isRead && styles.messageCardUnread]}
        onPress={() => {
          setMessages(messages.map((msg) => 
            msg.id === item.id ? { ...msg, isRead: true } : msg
          ));
        }}
      >
        <View style={[styles.messageIcon, iconBgStyle]}>
          <FontAwesome6 name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.messageContent}>
          <Text style={[styles.messageTitle, !item.isRead && styles.messageTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.messageDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>消息</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markReadButton}>全部已读</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {tab.badge > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message List */}
        <FlatList
          key="messages-list"
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
