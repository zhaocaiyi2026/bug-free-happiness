import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appTitleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    appLogo: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    appTitleContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    appTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#1C1917',
      letterSpacing: 1,
    },
    appTitleAccent: {
      color: '#2563EB',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      marginTop: Spacing.md,
    },
    searchPlaceholder: {
      fontSize: 13,
      color: '#9CA3AF',
      marginLeft: Spacing.sm,
    },
    // 统计卡片 - 紧凑型
    statsCard: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      justifyContent: 'space-around',
      alignItems: 'center',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: '#E5E7EB',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: '#2563EB',
    },
    statValueRed: {
      color: '#C8102E',
    },
    statLabel: {
      fontSize: 11,
      color: '#6B7280',
      marginTop: 2,
    },
    // 筛选条
    filterSection: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      backgroundColor: '#F5F5F5',
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
    },
    filterChipText: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
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
