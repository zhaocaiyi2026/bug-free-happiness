import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
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
    categoriesContainer: {
      gap: Spacing.md,
    },
    categoryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIcon: {
      width: 48,
      height: 48,
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
      fontSize: 16,
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
      fontWeight: '600',
      color: '#FFFFFF',
    },
    categoryDesc: {
      fontSize: 13,
      color: '#9CA3AF',
      marginTop: 2,
    },
    latestMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    latestMessageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#EC4899',
      marginRight: Spacing.sm,
    },
    latestMessageText: {
      flex: 1,
      fontSize: 13,
      color: '#6B7280',
      marginRight: Spacing.sm,
    },
    latestMessageTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    tipsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFBEB',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    tipsText: {
      flex: 1,
      fontSize: 13,
      color: '#92400E',
    },
  });
};
