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
      fontSize: 14,
      color: '#9CA3AF',
      marginBottom: Spacing.lg,
    },
    addButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 浮动按钮
    floatingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    floatingButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
};
