import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // 页面容器
    pageContainer: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    scrollContent: {
      paddingBottom: Spacing.xl,
    },
    // 紧凑型导航栏 - 白色背景，深色状态栏
    navBar: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: '#1F2937',
      marginLeft: Spacing.sm,
    },
    navActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 标题卡片 - 蓝色渐变背景
    titleCard: {
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    titleTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    categoryBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
    },
    categoryText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    urgentBadge: {
      backgroundColor: '#DC2626',
      marginLeft: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
    },
    urgentText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 24,
    },
    // 核心信息卡片
    coreInfoCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    // 预算行
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      marginBottom: Spacing.sm,
    },
    budgetLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginRight: Spacing.sm,
    },
    budgetValue: {
      fontSize: 24,
      fontWeight: '800',
      color: '#2563EB',
    },
    budgetUnit: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '600',
    },
    // 信息网格
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    infoItem: {
      width: '50%',
      paddingVertical: Spacing.xs,
    },
    infoIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    infoLabel: {
      fontSize: 10,
      color: '#9CA3AF',
      marginBottom: 1,
    },
    infoValue: {
      fontSize: 13,
      color: '#1F2937',
      fontWeight: '500',
    },
    infoValueRed: {
      color: '#DC2626',
    },
    // 内容区域卡片
    sectionCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    sectionIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: 'rgba(37,99,235,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
    },
    // 联系人卡片
    contactCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    contactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
      marginLeft: Spacing.sm,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    contactIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    contactLabel: {
      fontSize: 12,
      color: '#6B7280',
      width: 60,
    },
    contactValue: {
      fontSize: 13,
      color: '#1F2937',
      flex: 1,
    },
    contactValueLink: {
      color: '#2563EB',
      fontWeight: '500',
    },
    // 内容文本
    contentTextWrapper: {
      maxHeight: 400,
    },
    docContent: {
      fontSize: 13,
      lineHeight: 22,
      color: '#374151',
    },
    docContentWrapper: {
      maxHeight: 500,
    },
    // 来源行
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    sourceLabel: {
      fontSize: 11,
      color: '#9CA3AF',
      marginRight: Spacing.sm,
    },
    sourceValue: {
      fontSize: 11,
      color: '#6B7280',
    },
    // 底部操作栏
    bottomBar: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingBottom: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 8,
    },
    bottomButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginHorizontal: 4,
    },
    callButton: {
      backgroundColor: '#2563EB',
    },
    callButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    collectButton: {
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    collectButtonText: {
      color: '#374151',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    collectButtonActive: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    collectButtonTextActive: {
      color: '#DC2626',
    },
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: '#6B7280',
    },
  });
};
