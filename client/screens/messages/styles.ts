import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F8FA',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing['5xl'],
    },
    // 导航栏
    navBar: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 0,
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F7F8FA',
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
      paddingVertical: Spacing['3xl'],
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
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
    // 消息卡片 - 简洁现代风格
    categoryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    categoryIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryInfo: {
      flex: 1,
      marginLeft: Spacing.md,
      marginRight: Spacing.sm,
    },
    categoryTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    categoryTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#1F2937',
    },
    categoryBadge: {
      marginLeft: Spacing.sm,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryBadgeText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    categoryDesc: {
      fontSize: 13,
      color: '#9CA3AF',
      lineHeight: 18,
    },
    categoryArrow: {
      marginLeft: Spacing.xs,
    },
    // 最新消息区域
    latestMessage: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      marginLeft: 68,
    },
    latestMessageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
      marginRight: Spacing.sm,
    },
    latestMessageContent: {
      flex: 1,
    },
    latestMessageTitle: {
      fontSize: 14,
      color: '#374151',
      lineHeight: 20,
      marginBottom: 4,
    },
    latestMessageTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
  });
};
