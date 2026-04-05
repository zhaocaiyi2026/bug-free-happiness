import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    // 导航栏
    navBar: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
    },
    // 页面标题区域
    pageTitle: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    pageTitleText: {
      fontSize: 28,
      fontWeight: '800',
      color: '#1F2937',
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: '#6B7280',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: 15,
      color: '#9CA3AF',
    },
    // 消息列表容器
    categoriesContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    // 消息卡片 - 极简风格
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 16,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#F0F0F0',
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryContent: {
      flex: 1,
      marginLeft: 12,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    categoryTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    categoryMessage: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginTop: 2,
    },
    categoryBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    categoryBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // 图标容器（带徽章）
    iconWrapper: {
      position: 'relative',
    },
  });
};
