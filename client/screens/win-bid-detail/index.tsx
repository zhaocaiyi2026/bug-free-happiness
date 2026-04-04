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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface WinBid {
  id: number;
  title: string;
  content: string | null;
  win_amount: number | null;
  province: string | null;
  city: string | null;
  industry: string | null;
  bid_type: string | null;
  win_company: string | null;
  win_company_address: string | null;
  win_company_phone: string | null;
  project_location: string | null;
  win_date: string | null;
  publish_date: string | null;
  source: string | null;
  source_url: string | null;
  view_count: number;
}

interface FormattedWinBidDetail {
  id: number;
  title: string;
  formattedContent: string;
}

export default function WinBidDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ id: number }>();
  const insets = useSafeAreaInsets();

  const [winBid, setWinBid] = useState<WinBid | null>(null);
  const [formattedContent, setFormattedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formatting, setFormatting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchWinBidDetail();
    }
  }, [params.id]);

  const fetchWinBidDetail = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/win-bids/${params.id}`
      );
      const data = await res.json();

      if (data.success) {
        setWinBid(data.data);
        // 获取详情后，自动格式化内容
        if (data.data.content && data.data.content.length >= 50) {
          fetchFormattedDetail();
        }
      } else {
        Alert.alert('错误', data.message || '获取中标详情失败');
        router.back();
      }
    } catch (error) {
      console.error('获取中标详情失败:', error);
      Alert.alert('错误', '获取中标详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchFormattedDetail = async () => {
    try {
      setFormatting(true);
      const res = await fetch(
        `${API_BASE_URL}/api/v1/win-bids/${params.id}/format`
      );
      const data = await res.json();

      if (data.success && data.data.formattedContent) {
        setFormattedContent(data.data.formattedContent);
      }
    } catch (error) {
      console.error('获取格式化详情失败:', error);
    } finally {
      setFormatting(false);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return { value: '未公开', unit: '' };
    if (amount >= 100000000) {
      return { value: (amount / 100000000).toFixed(2), unit: '亿' };
    } else if (amount >= 10000) {
      return { value: (amount / 10000).toFixed(0), unit: '万' };
    }
    return { value: String(amount), unit: '' };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '暂无';
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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
      <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  if (!winBid) return null;

  const amount = formatAmount(winBid.win_amount);

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>中标详情</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <FontAwesome6 name="share-nodes" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 标题区 */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{winBid.industry?.slice(0, 4) || '项目'}</Text>
              </View>
              <View style={styles.winTag}>
                <FontAwesome6 name="trophy" size={9} color="#059669" />
                <Text style={styles.winTagText}>已中标</Text>
              </View>
            </View>
            <Text style={styles.title}>{winBid.title}</Text>
          </View>
        </View>

        {/* 核心信息卡片 */}
        <View style={styles.coreInfoCard}>
          {/* 中标金额 */}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>中标金额</Text>
            <Text style={styles.amountValue}>{amount.value}</Text>
            {amount.unit && <Text style={styles.amountUnit}>{amount.unit}元</Text>}
          </View>

          {/* 信息网格 */}
          <View style={styles.infoGrid}>
            {/* 地点 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(5,150,105,0.1)' }]}>
                <FontAwesome6 name="location-dot" size={12} color="#059669" />
              </View>
              <Text style={styles.infoLabel}>项目地点</Text>
              <Text style={styles.infoValue}>{winBid.province} {winBid.city}</Text>
            </View>

            {/* 招标方式 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                <FontAwesome6 name="file-signature" size={12} color="#2563EB" />
              </View>
              <Text style={styles.infoLabel}>招标方式</Text>
              <Text style={styles.infoValue}>{winBid.bid_type || '公开招标'}</Text>
            </View>

            {/* 中标日期 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(217,119,6,0.1)' }]}>
                <FontAwesome6 name="calendar-check" size={12} color="#D97706" />
              </View>
              <Text style={styles.infoLabel}>中标日期</Text>
              <Text style={styles.infoValue}>{formatDate(winBid.win_date)}</Text>
            </View>

            {/* 公告日期 */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                <FontAwesome6 name="bullhorn" size={12} color="#6B7280" />
              </View>
              <Text style={styles.infoLabel}>公告日期</Text>
              <Text style={styles.infoValue}>{formatDate(winBid.publish_date)}</Text>
            </View>
          </View>
        </View>

        {/* 格式化加载中 */}
        {formatting && (
          <View style={styles.sectionCard}>
            <View style={styles.loadingFormatContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingFormatText}>正在智能排版...</Text>
            </View>
          </View>
        )}

        {/* 格式化后的内容 */}
        {formattedContent && !formatting && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <FontAwesome6 name="file-lines" size={11} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>项目详情</Text>
            </View>
            <Text style={styles.docContent}>{formattedContent}</Text>
            
            {/* 来源 */}
            <View style={styles.sourceRow}>
              <Text style={styles.sourceLabel}>信息来源</Text>
              <Text style={styles.sourceValue}>{winBid.source || '官方渠道'}</Text>
            </View>
          </View>
        )}

        {/* 如果没有格式化内容，显示原始内容 */}
        {!formattedContent && !formatting && winBid.content && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <FontAwesome6 name="file-lines" size={11} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>项目详情</Text>
            </View>
            <Text style={styles.contentText}>
              {winBid.content || '暂无详细信息。'}
            </Text>
            
            {/* 来源 */}
            <View style={styles.sourceRow}>
              <Text style={styles.sourceLabel}>信息来源</Text>
              <Text style={styles.sourceValue}>{winBid.source || '官方渠道'}</Text>
            </View>
          </View>
        )}

        {/* 中标单位信息卡片 */}
        {winBid.win_company && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <FontAwesome6 name="building" size={11} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>中标单位</Text>
            </View>
            
            <View style={styles.contactList}>
              {/* 单位名称 */}
              <View style={styles.contactRow}>
                <View style={styles.contactIconWrap}>
                  <FontAwesome6 name="briefcase" size={12} color="#6B7280" />
                </View>
                <Text style={styles.contactLabel}>单位名称</Text>
                <Text style={styles.contactValue}>{winBid.win_company}</Text>
              </View>

              {/* 联系电话 */}
              {winBid.win_company_phone && (
                <TouchableOpacity 
                  style={styles.contactRow}
                  onPress={() => handleCall(winBid.win_company_phone || '')}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactIconWrap}>
                    <FontAwesome6 name="phone" size={12} color="#059669" />
                  </View>
                  <Text style={styles.contactLabel}>联系电话</Text>
                  <Text style={[styles.contactValue, styles.contactPhone]}>
                    {winBid.win_company_phone}
                  </Text>
                  <View style={styles.callButton}>
                    <FontAwesome6 name="phone-volume" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}

              {/* 单位地址 */}
              {winBid.win_company_address && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIconWrap}>
                    <FontAwesome6 name="location-dot" size={12} color="#C8102E" />
                  </View>
                  <Text style={styles.contactLabel}>单位地址</Text>
                  <Text style={styles.contactValue}>{winBid.win_company_address}</Text>
                </View>
              )}

              {/* 项目地址 */}
              {winBid.project_location && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIconWrap}>
                    <FontAwesome6 name="location-dot" size={12} color="#2563EB" />
                  </View>
                  <Text style={styles.contactLabel}>项目地址</Text>
                  <Text style={styles.contactValue}>{winBid.project_location}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleCall(winBid.win_company_phone || '')}
        >
          <FontAwesome6 name="phone" size={16} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>联系中标单位</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
