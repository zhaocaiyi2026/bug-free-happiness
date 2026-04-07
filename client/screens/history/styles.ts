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
    headerRight: {
      width: 50,
    },
    clearButton: {
      fontSize: 14,
      color: '#FFFFFF',
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
      padding: Spacing.sm,
      margin: 2,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    bidCardUrgent: {
      borderColor: '#FCA5A5',
      backgroundColor: '#FFFBFC',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: 3,
    },
    categoryTagText: {
      fontSize: 9,
      color: '#2563EB',
      fontWeight: '600',
    },
    bidTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#1C1917',
      lineHeight: 16,
      marginBottom: 3,
    },
    bidBudget: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 1,
    },
    bidMeta: {
      fontSize: 9,
      color: '#9CA3AF',
      marginBottom: 1,
    },
    bidTime: {
      fontSize: 9,
      color: '#059669',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
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
    emptySubtext: {
      fontSize: 12,
      color: '#D1D5DB',
      marginTop: Spacing.sm,
    },
  });
};
