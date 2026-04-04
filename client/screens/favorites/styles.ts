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
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    // 列表
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    // 卡片样式
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    bidCardUrgent: {
      borderColor: '#FCA5A5',
      backgroundColor: '#FFFBFC',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: 3,
      marginRight: Spacing.xs,
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
      paddingVertical: 2,
      borderRadius: 3,
      marginRight: Spacing.xs,
    },
    typeTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '700',
    },
    removeButton: {
      marginLeft: 'auto',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(200, 16, 46, 0.3)',
    },
    bidTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1C1917',
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: Spacing.sm,
    },
    bidFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bidMeta: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    bidDeadline: {
      fontSize: 12,
      color: '#C8102E',
      fontWeight: '500',
    },
    // 空状态
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
      marginBottom: Spacing.lg,
    },
    emptyButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    emptyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
  });
};
