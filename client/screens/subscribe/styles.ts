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
    // 提示卡片
    tipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: '#92400E',
      lineHeight: 20,
    },
    // Section
    section: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.md,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },
    // 订阅项
    subscribeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    typeIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    subscribeContent: {
      flex: 1,
    },
    subscribeValue: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1917',
      marginBottom: 2,
    },
    subscribeMeta: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: Spacing.sm,
    },
    // 空状态
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
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: Spacing.xs,
    },
    emptySubText: {
      fontSize: 13,
      color: '#9CA3AF',
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    // 浮动按钮
    floatingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      marginBottom: Spacing['2xl'],
      paddingVertical: Spacing.md + 2,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    floatingButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 加载
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1C1917',
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBody: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: Spacing.sm,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    typeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: '#F5F5F5',
      gap: Spacing.xs,
    },
    typeOptionActive: {
      backgroundColor: '#2563EB',
    },
    typeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
    },
    typeOptionTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    inputSection: {
      marginTop: Spacing.sm,
    },
    textInput: {
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 15,
      color: '#1C1917',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    inputHint: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: Spacing.xs,
    },
    optionsList: {
      maxHeight: 200,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    optionChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    optionChipActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    optionChipText: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '500',
    },
    optionChipTextActive: {
      color: '#FFFFFF',
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: '#F5F5F5',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: '#F5F5F5',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '500',
      color: '#6B7280',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: '#2563EB',
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
};
