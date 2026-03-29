import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    // Header
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
    // 搜索区域
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
      borderWidth: 0,
      outlineWidth: 0,
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
      marginBottom: Spacing.sm,
    },
    filterLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: Spacing.xs,
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
      borderRadius: BorderRadius.md,
      backgroundColor: '#F3F4F6',
      marginRight: Spacing.xs,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    filterChipMore: {
      backgroundColor: '#FFFFFF',
      borderStyle: 'dashed',
    },
    filterChipText: {
      fontSize: 13,
      color: '#374151',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    // 类型切换
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
    // 搜索按钮
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.sm,
      marginVertical: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    searchButtonIcon: {
      marginRight: Spacing.xs,
    },
    searchButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 结果区域
    resultsSection: {
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    resultsCount: {
      fontSize: 14,
      color: '#6B7280',
    },
    // 客户卡片
    customerCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: '#2563EB',
    },
    customerCardWinner: {
      borderLeftColor: '#059669',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    companyName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1917',
      flex: 1,
      marginRight: Spacing.sm,
    },
    typeTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      backgroundColor: '#EFF6FF',
    },
    typeTagWinner: {
      backgroundColor: '#ECFDF5',
    },
    typeTagText: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '500',
    },
    typeTagTextWinner: {
      color: '#059669',
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.xs,
    },
    cardIcon: {
      width: 20,
      alignItems: 'center',
      marginRight: Spacing.sm,
      marginTop: 2,
    },
    cardText: {
      fontSize: 13,
      color: '#4B5563',
      flex: 1,
    },
    cardTextHighlight: {
      color: '#2563EB',
      fontWeight: '500',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    sourceText: {
      fontSize: 12,
      color: '#9CA3AF',
      flex: 1,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
    },
    callButtonText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '500',
      marginLeft: Spacing.xs,
    },
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    loadingText: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: Spacing.sm,
    },
    // 空状态
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: Spacing.sm,
    },
    emptyHint: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: Spacing.xs,
    },
    // 列表容器
    listContainer: {
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
  });
};
