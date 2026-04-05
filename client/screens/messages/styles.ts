import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    // 导航栏
    navBar: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
    },
    header: {
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 13,
      color: '#6B7280',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: '#6B7280',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      fontSize: 15,
      color: '#9CA3AF',
    },
    categoriesContainer: {
      gap: Spacing.md,
    },
    categoryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    categoryTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    categoryTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1F2937',
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
    },
    categoryBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    categoryDesc: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: 2,
    },
    // 最新消息
    latestMessage: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    latestMessageTitle: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '500',
      marginBottom: 2,
    },
    latestMessageTime: {
      fontSize: 11,
      color: '#9CA3AF',
    },
  });
};
