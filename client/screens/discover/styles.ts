import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    // Header - 品牌增强型
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
    // 地址选择
    locationSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
    },
    locationSelector: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationText: {
      fontSize: 14,
      color: '#1C1917',
      fontWeight: '500',
      marginLeft: Spacing.xs,
      marginRight: Spacing.xs,
    },
    viewAllText: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '500',
    },
    // Section
    sectionContainer: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#1C1917',
    },
    sectionMore: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '500',
    },
    // 分类宫格
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    categoryItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    categoryName: {
      fontSize: 12,
      color: '#374151',
      fontWeight: '500',
    },
    categoryCount: {
      fontSize: 10,
      color: '#9CA3AF',
      marginTop: 1,
    },
    // 特色功能区
    featureGrid: {
      gap: Spacing.sm,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    featureIcon: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1917',
    },
    featureDesc: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    comingSoonTag: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: BorderRadius.sm,
      marginLeft: Spacing.xs,
    },
    comingSoonText: {
      fontSize: 10,
      color: '#D97706',
      fontWeight: '500',
    },
    vipTag: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: BorderRadius.sm,
      marginLeft: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    vipTagText: {
      fontSize: 9,
      color: '#D97706',
      fontWeight: '600',
    },
    // 筛选
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
    // 双列网格
    bidGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -2,
    },
    // 紧凑型卡片样式
    bidCard: {
      width: '50%',
      padding: 2,
    },
    bidCardContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      padding: Spacing.sm + 2,
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
    // 类型标签（招标/中标）
    typeTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 1,
      borderRadius: 3,
    },
    typeTagText: {
      fontSize: 10,
      color: '#2563EB',
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
    // 弹窗样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '60%',
      paddingBottom: Spacing['2xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1C1917',
    },
    modalList: {
      paddingHorizontal: Spacing.md,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    modalItemActive: {
      backgroundColor: '#F0F7FF',
      marginHorizontal: -Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    modalItemText: {
      fontSize: 14,
      color: '#1C1917',
    },
    modalItemTextActive: {
      color: '#2563EB',
      fontWeight: '600',
    },
  });
};
