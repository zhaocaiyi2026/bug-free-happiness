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
      // 图标内部阴影效果
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
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
      paddingVertical: Spacing.lg,
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      letterSpacing: 0.3,
    },
    sectionMore: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '600',
    },
    // ========== 分类长条列表 ==========
    categoryList: {
      gap: Spacing.sm,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 14,
      padding: Spacing.md,
    },
    categoryIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    categoryContent: {
      flex: 1,
    },
    categoryName: {
      fontSize: 15,
      color: '#1F2937',
      fontWeight: '600',
    },
    categoryDesc: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: 2,
    },
    categoryArrow: {
      marginLeft: Spacing.sm,
    },
    // ========== 特色功能区 - 长条卡片 ==========
    featureGrid: {
      gap: Spacing.sm,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    featureIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    featureTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
    },
    featureDesc: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 3,
      lineHeight: 16,
    },
    vipTag: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    vipTagText: {
      fontSize: 10,
      color: '#D97706',
      fontWeight: '700',
    },
    featureArrow: {
      marginLeft: Spacing.sm,
    },
    // ========== 招标卡片 - 长条状 ==========
    bidList: {
      gap: Spacing.sm,
    },
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    bidCardUrgent: {
      borderLeftWidth: 4,
      borderLeftColor: '#DC2626',
      backgroundColor: '#FFFBFC',
    },
    bidCardLeft: {
      flex: 1,
      marginRight: Spacing.md,
    },
    bidCardRight: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minWidth: 80,
    },
    bidTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 22,
      marginBottom: Spacing.xs,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: Spacing.xs,
    },
    bidTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bidTagText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '500',
    },
    bidLocation: {
      fontSize: 12,
      color: '#94A3B8',
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: 4,
    },
    bidDeadline: {
      fontSize: 11,
      color: '#DC2626',
      fontWeight: '600',
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
