import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    // ========== 新设计：白色极简导航 ==========
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 0,
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    brandTextContainer: {
      flexDirection: 'column',
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#1F2937',
      letterSpacing: 0.5,
    },
    brandSubtitle: {
      fontSize: 11,
      color: '#9CA3AF',
      fontWeight: '500',
      marginTop: 1,
    },
    // 搜索按钮
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minWidth: 120,
    },
    searchPlaceholder: {
      fontSize: 13,
      color: '#9CA3AF',
      marginLeft: Spacing.sm,
    },
    // ========== Section 样式 ==========
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
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
    },
    sectionMore: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '600',
    },
    // ========== 分类长条列表 - 紧凑版 ==========
    categoryList: {
      gap: 1,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
    },
    categoryIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    categoryContent: {
      flex: 1,
    },
    categoryName: {
      fontSize: 14,
      color: '#1F2937',
      fontWeight: '500',
    },
    categoryDesc: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 1,
    },
    categoryArrow: {
      marginLeft: Spacing.xs,
    },
    // ========== 特色功能区 - 长条卡片紧凑版 ==========
    featureGrid: {
      gap: 1,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
    },
    featureIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    featureContent: {
      flex: 1,
    },
    featureTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
    },
    featureDesc: {
      fontSize: 11,
      color: '#6B7280',
      marginTop: 1,
    },
    vipTag: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      marginLeft: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    vipTagText: {
      fontSize: 9,
      color: '#D97706',
      fontWeight: '700',
    },
    featureArrow: {
      marginLeft: Spacing.xs,
    },
    // ========== 招标卡片 - 紧凑长条状 ==========
    bidList: {
      gap: Spacing.xs,
    },
    bidCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 10,
      padding: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    bidCardUrgent: {
      borderLeftWidth: 3,
      borderLeftColor: '#DC2626',
      backgroundColor: '#FFFBFC',
    },
    bidCardLeft: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    bidCardRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 65,
    },
    bidTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 18,
      marginBottom: 2,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 2,
    },
    bidTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    bidTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '500',
    },
    bidLocation: {
      fontSize: 11,
      color: '#94A3B8',
    },
    bidBudget: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 2,
    },
    bidDeadline: {
      fontSize: 10,
      color: '#DC2626',
      fontWeight: '500',
    },
    // ========== 加载和空状态 ==========
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
      opacity: 0.6,
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
  });
};
