import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
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
      marginBottom: Spacing.md + 2,
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
    // ========== 分类宫格 ==========
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    categoryItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: 4,
    },
    categoryIconWrapper: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs + 2,
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    categoryName: {
      fontSize: 12,
      color: '#374151',
      fontWeight: '600',
      textAlign: 'center',
    },
    categoryCount: {
      fontSize: 10,
      color: '#9CA3AF',
      marginTop: 1,
    },
    // ========== 特色功能区 ==========
    featureGrid: {
      gap: Spacing.sm + 2,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Spacing.md + 2,
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    featureIconWrapper: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
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
    // ========== 招标卡片网格 ==========
    bidGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    bidCard: {
      width: '50%',
      padding: 4,
    },
    bidCardContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: Spacing.sm + 4,
      // 柔和阴影
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    bidCardUrgent: {
      borderWidth: 0,
      backgroundColor: '#FFFBFC',
      // 紧急卡片特殊阴影
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs + 2,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    categoryTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '600',
    },
    typeTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    typeTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '700',
    },
    bidTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 18,
      marginBottom: Spacing.xs + 2,
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: 3,
      letterSpacing: -0.5,
    },
    bidMeta: {
      fontSize: 11,
      color: '#9CA3AF',
      marginBottom: 2,
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
    // ========== 弹窗样式 ==========
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '60%',
      paddingBottom: Spacing['2xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md + 2,
      borderBottomWidth: 0,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#111827',
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
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
      borderRadius: 12,
      marginBottom: 4,
    },
    modalItemActive: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
    },
    modalItemText: {
      fontSize: 15,
      color: '#374151',
    },
    modalItemTextActive: {
      color: '#2563EB',
      fontWeight: '600',
    },
    modalCheckIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
