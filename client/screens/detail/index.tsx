import { API_BASE_URL } from '@/constants/api';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Disclaimer } from '@/components/Disclaimer';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface Bid {
  id: number;
  title: string;
  content: string | null;
  formatted_content: string | null;
  budget: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  publish_date: string | null;
  deadline: string | null;
  source: string | null;
  source_url: string | null;
  is_urgent: boolean;
  view_count: number;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  project_location: string | null;
  requirements: string | null;
  open_bid_time: string | null;
  open_bid_location: string | null;
}

export default function DetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ id: number }>();
  const insets = useSafeAreaInsets();

  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchBidDetail();
      checkFavorite();
    }
  }, [params.id]);

  const fetchBidDetail = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/bids/${params.id}`
      );
      const data = await res.json();

      if (data.success) {
        setBid(data.data);
      } else {
        Alert.alert('错误', data.message || '获取招标详情失败');
        router.back();
      }
    } catch (error) {
      console.error('获取招标详情失败:', error);
      Alert.alert('错误', '获取招标详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/favorites/check?userId=${userId}&bidId=${params.id}`
      );
      const data = await res.json();

      if (data.success) {
        setIsFavorite(data.data.isFavorite);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/favorites/${params.id}?userId=${userId}`,
          { method: 'DELETE' }
        );
        const data = await res.json();

        if (data.success) {
          setIsFavorite(false);
          Alert.alert('成功', '已取消收藏');
        }
      } else {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/favorites`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bidId: params.id }),
          }
        );
        const data = await res.json();

        if (data.success) {
          setIsFavorite(true);
          Alert.alert('成功', '收藏成功');
        } else {
          Alert.alert('提示', data.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      Alert.alert('错误', '操作失败，请重试');
    }
  };

  const formatBudget = (budget: number | null) => {
    if (!budget) return { value: '面议', unit: '' };
    if (budget >= 100000000) {
      return { value: (budget / 100000000).toFixed(2), unit: '亿' };
    } else if (budget >= 10000) {
      return { value: (budget / 10000).toFixed(0), unit: '万' };
    }
    return { value: String(budget), unit: '' };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '暂无';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleCall = (phone: string) => {
    if (!phone || phone === '暂无') {
      Alert.alert('提示', '暂无联系电话');
      return;
    }
    
    Alert.alert(
      '拨打电话',
      `确定拨打 ${phone}？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '拨打', 
          style: 'default',
          onPress: () => {
            const phoneUrl = `tel:${phone}`;
            Linking.canOpenURL(phoneUrl)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(phoneUrl);
                } else {
                  Alert.alert('错误', '无法拨打电话');
                }
              })
              .catch((err) => {
                console.error('拨打电话失败:', err);
                Alert.alert('错误', '拨打电话失败');
              });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.pageContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!bid) return null;

  const budget = formatBudget(bid.budget);
  const daysRemaining = getDaysRemaining(bid.deadline);

  return (
    <View style={styles.pageContainer}>
      {/* 状态栏 - 深色文字，白色背景 */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 导航栏 - 白色背景 */}
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={16} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>招标详情</Text>
        <View style={styles.navActions}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={handleToggleFavorite}
          >
            <FontAwesome6 
              name="heart" 
              size={16} 
              color={isFavorite ? '#DC2626' : '#9CA3AF'} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <FontAwesome6 name="share-nodes" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 可滚动内容区域 */}
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 标题卡片 - 蓝色背景 */}
        <View style={styles.titleCard}>
          <View style={styles.titleTop}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{bid.industry?.slice(0, 4) || '项目'}</Text>
            </View>
            {bid.is_urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>紧急</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{bid.title}</Text>
        </View>

        {/* 核心信息卡片 */}
        <View style={styles.coreInfoCard}>
          {/* 预算 */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>项目预算</Text>
            <Text style={styles.budgetValue}>{budget.value}</Text>
            {budget.unit && <Text style={styles.budgetUnit}>{budget.unit}元</Text>}
          </View>

          {/* 信息网格 */}
          <View style={styles.infoGrid}>
            {/* 地点 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                <FontAwesome6 name="location-dot" size={11} color="#2563EB" />
              </View>
              <Text style={styles.infoLabel}>项目地点</Text>
              <Text style={styles.infoValue}>{bid.province} {bid.city}</Text>
            </View>

            {/* 招标方式 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(5,150,105,0.1)' }]}>
                <FontAwesome6 name="file-signature" size={11} color="#059669" />
              </View>
              <Text style={styles.infoLabel}>招标方式</Text>
              <Text style={styles.infoValue}>{bid.bid_type || '公开招标'}</Text>
            </View>

            {/* 发布时间 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                <FontAwesome6 name="calendar" size={11} color="#6B7280" />
              </View>
              <Text style={styles.infoLabel}>发布时间</Text>
              <Text style={styles.infoValue}>{formatDate(bid.publish_date)}</Text>
            </View>

            {/* 截止时间 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                <FontAwesome6 name="clock" size={11} color="#DC2626" />
              </View>
              <Text style={styles.infoLabel}>截止时间</Text>
              <Text style={[styles.infoValue, daysRemaining !== null && daysRemaining <= 3 && styles.infoValueRed]}>
                {formatDate(bid.deadline)}
                {daysRemaining !== null && ` (剩${daysRemaining}天)`}
              </Text>
            </View>
          </View>
        </View>

        {/* 联系人信息 */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
              <FontAwesome6 name="address-book" size={11} color="#2563EB" />
            </View>
            <Text style={styles.contactTitle}>联系方式</Text>
          </View>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <FontAwesome6 name="user" size={12} color="#6B7280" />
            </View>
            <Text style={styles.contactLabel}>联系人</Text>
            <Text style={styles.contactValue}>{bid.contact_person || '暂无'}</Text>
          </View>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <FontAwesome6 name="phone" size={12} color="#2563EB" />
            </View>
            <Text style={styles.contactLabel}>电话</Text>
            <TouchableOpacity onPress={() => handleCall(bid.contact_phone || '')}>
              <Text style={[styles.contactValue, styles.contactValueLink]}>
                {bid.contact_phone || '暂无'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {bid.contact_address && (
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <FontAwesome6 name="map-marker-alt" size={12} color="#6B7280" />
              </View>
              <Text style={styles.contactLabel}>地址</Text>
              <Text style={styles.contactValue}>{bid.contact_address}</Text>
            </View>
          )}
        </View>

        {/* 格式化后的内容 - 优先显示后台格式化内容 */}
        {bid.formatted_content && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <FontAwesome6 name="file-lines" size={11} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>招标详情</Text>
            </View>
            <Text style={styles.docContent}>{bid.formatted_content}</Text>
            
            {/* 来源 */}
            <View style={styles.sourceRow}>
              <Text style={styles.sourceLabel}>信息来源</Text>
              <Text style={styles.sourceValue}>{bid.source || '官方渠道'}</Text>
            </View>
          </View>
        )}

        {/* 如果没有格式化内容，显示原始内容 */}
        {!bid.formatted_content && bid.content && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <FontAwesome6 name="file-lines" size={11} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>项目详情</Text>
            </View>
            <Text style={styles.docContent}>{bid.content}</Text>
          </View>
        )}

        {/* 免责声明 */}
        <View style={styles.disclaimerWrap}>
          <Disclaimer />
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={[styles.bottomBar, { paddingBottom: Spacing.md + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.collectButton, isFavorite && styles.collectButtonActive]}
          onPress={handleToggleFavorite}
        >
          <FontAwesome6 
            name="heart" 
            size={16} 
            color={isFavorite ? '#DC2626' : '#6B7280'} 
          />
          <Text style={[styles.collectButtonText, isFavorite && styles.collectButtonTextActive]}>
            {isFavorite ? '已收藏' : '收藏'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => handleCall(bid.contact_phone || '')}
        >
          <FontAwesome6 name="phone" size={16} color="#FFFFFF" />
          <Text style={styles.callButtonText}>立即联系</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
