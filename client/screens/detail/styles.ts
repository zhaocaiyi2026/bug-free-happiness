import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '../../constants/theme';

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
    // 标题卡片 - 白色简洁风格
    titleCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    titleTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    categoryBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
    },
    categoryText: {
      fontSize: 12,
      color: '#2563EB',
      fontWeight: '600',
    },
    urgentBadge: {
      backgroundColor: '#FEF2F2',
      marginLeft: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 4,
    },
    urgentText: {
      fontSize: 12,
      color: '#DC2626',
      fontWeight: '600',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: '#1F2937',
      lineHeight: 26,
    },
    // 核心信息卡片
    coreInfoCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    // 预算行 - 重新设计
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
    },
    budgetLeft: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    budgetLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginRight: Spacing.sm,
    },
    budgetValue: {
      fontSize: 28,
      fontWeight: '800',
      color: '#2563EB',
    },
    budgetUnit: {
      fontSize: 16,
      color: '#2563EB',
      fontWeight: '600',
      marginLeft: 2,
    },
    budgetBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    budgetBadgeText: {
      fontSize: 12,
      color: '#D97706',
      fontWeight: '600',
    },
    // 信息网格
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    infoItem: {
      width: '50%',
      paddingVertical: Spacing.sm,
    },
    infoIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    infoLabel: {
      fontSize: 12,
      color: '#9CA3AF',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
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
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
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
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(37,99,235,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1F2937',
    },
    // 联系人卡片
    contactCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
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
      fontSize: 13,
      color: '#6B7280',
      width: 60,
    },
    contactValue: {
      fontSize: 14,
      color: '#1F2937',
      flex: 1,
    },
    contactValueLink: {
      color: '#2563EB',
      fontWeight: '500',
    },
    // 内容文本
    docContent: {
      fontSize: 15,
      lineHeight: 26,
      color: '#374151',
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
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
    // 收藏按钮 - 次要按钮
    collectButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      marginRight: Spacing.sm,
    },
    collectButtonActive: {
      backgroundColor: '#FEF2F2',
    },
    collectButtonText: {
      color: '#6B7280',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    collectButtonTextActive: {
      color: '#DC2626',
    },
    // 电话按钮 - 主要按钮
    callButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    callButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      marginLeft: Spacing.xs,
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
    // 免责声明包装
    disclaimerWrap: {
      marginHorizontal: Spacing.md,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    // ========== 预约对话框 ==========
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: Spacing.lg,
      width: '85%',
      maxWidth: 360,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    modalSubtitle: {
      fontSize: 13,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    inputGroup: {
      marginBottom: Spacing.md,
    },
    inputLabel: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '500',
      marginBottom: Spacing.xs,
    },
    textInput: {
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      fontSize: 15,
      color: '#1F2937',
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: Spacing.md,
      gap: Spacing.sm,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 15,
      color: '#6B7280',
      fontWeight: '600',
    },
    modalSubmitButton: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: '#2563EB',
      alignItems: 'center',
    },
    modalSubmitText: {
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

}
