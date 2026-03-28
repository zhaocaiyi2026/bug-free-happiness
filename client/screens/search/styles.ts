import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    // Header - 与主页一致的蓝色风格
    header: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerRight: {
      width: 40,
    },
    searchRow: {
      marginTop: Spacing.xs,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      height: 40,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#1C1917',
      marginLeft: Spacing.sm,
    },
    // 搜索类型切换
    typeSection: {
      flexDirection: 'row',
      backgroundColor: '#F5F5F5',
      marginHorizontal: Spacing.sm,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xs,
    },
    typeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.md,
      backgroundColor: 'transparent',
      marginHorizontal: 2,
    },
    typeTabActive: {
      backgroundColor: '#2563EB',
    },
    typeTabText: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
      marginLeft: Spacing.xs,
    },
    typeTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    // 筛选区域
    filterSection: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.sm,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    filterGroup: {
      marginBottom: Spacing.md,
    },
    filterLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    filterScrollWrapper: {
      marginHorizontal: -Spacing.xs,
    },
    filterScroll: {
      paddingHorizontal: Spacing.xs,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      backgroundColor: '#F5F5F5',
      marginRight: Spacing.xs,
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
    },
    filterChipMore: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      backgroundColor: 'transparent',
    },
    filterChipText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    // 预算输入
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    budgetInput: {
      flex: 1,
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 13,
      color: '#1C1917',
      textAlign: 'center',
    },
    budgetSeparator: {
      marginHorizontal: Spacing.sm,
      color: '#9CA3AF',
      fontSize: 14,
    },
    // 搜索按钮
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    searchButtonIcon: {
      marginRight: Spacing.sm,
    },
    searchButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 搜索结果
    resultsSection: {
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing['3xl'],
    },
    resultsHeader: {
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginBottom: Spacing.sm,
    },
    resultsCount: {
      fontSize: 12,
      color: '#6B7280',
    },
    resultList: {
      justifyContent: 'space-between',
    },
    // 结果卡片 - 紧凑型
    bidCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      padding: Spacing.sm + 2,
      margin: 2,
      borderWidth: 1,
      borderColor: '#E5E7EB',
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
      fontSize: 15,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: 2,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bidMeta: {
      fontSize: 10,
      color: '#9CA3AF',
    },
    bidMetaSeparator: {
      fontSize: 10,
      color: '#D1D5DB',
      marginHorizontal: Spacing.xs,
    },
    // 加载和空状态
    loadingContainer: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyContainer: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: Spacing.md,
    },
    emptyHint: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: Spacing.xs,
    },
  });
};
