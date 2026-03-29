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
    // 搜索框
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
    // 列表
    listContainer: {
      paddingVertical: Spacing.sm,
    },
    // 列表项
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    listItemActive: {
      backgroundColor: '#F0F7FF',
    },
    listItemText: {
      fontSize: 15,
      color: '#1C1917',
    },
    listItemTextActive: {
      color: '#2563EB',
      fontWeight: '600',
    },
    // 空状态
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: Spacing.md,
    },
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    // 提示条
    tipBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFBEB',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginHorizontal: Spacing.sm,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    tipText: {
      fontSize: 11,
      color: '#D97706',
      marginLeft: Spacing.xs,
    },
    // 列表计数
    listCount: {
      fontSize: 12,
      color: '#9CA3AF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
    },
  });
};
