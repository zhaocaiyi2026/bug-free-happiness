import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // Header
    header: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },
    winHeader: {
      backgroundColor: '#059669',
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    headerIcon: {
      marginRight: Spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerRight: {
      width: 60,
      alignItems: 'flex-end',
    },
    headerCount: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
    },
    // 统计条
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    statsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statsText: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '500',
    },
    statsTextMuted: {
      fontSize: 12,
      color: '#6B7280',
    },
    // 列表
    listContainer: {
      padding: Spacing.sm,
      paddingBottom: Spacing['5xl'],
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    // 紧凑型卡片样式
    bidCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      padding: Spacing.sm + 2,
      margin: 2,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    bidCardUrgent: {
      borderColor: '#FCA5A5',
      backgroundColor: '#FFFBFC',
    },
    // 中标卡片样式
    winBidCard: {
      borderColor: '#86EFAC',
      backgroundColor: '#F0FDF4',
    },
    winCategoryTag: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    winTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#059669',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 1,
      borderRadius: 3,
    },
    winTagText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    winBudget: {
      color: '#059669',
    },
    winCompany: {
      color: '#059669',
      fontWeight: '500',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 1,
      borderRadius: 3,
    },
    categoryTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '600',
    },
    // 类型标签（招标/中标）
    typeTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 1,
      borderRadius: 3,
      maxWidth: 60,  // 限制最大宽度
    },
    typeTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '700',
    },
    urgentTag: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 1,
      borderRadius: 3,
    },
    urgentTagText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    bidTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1C1917',
      lineHeight: 18,
      marginBottom: Spacing.xs,
    },
    bidBudget: {
      fontSize: 16,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: 2,
    },
    bidMeta: {
      fontSize: 10,
      color: '#9CA3AF',
      marginBottom: 1,
    },
    bidDeadline: {
      fontSize: 10,
      color: '#C8102E',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    loadingText: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: Spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['5xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
  });
};
