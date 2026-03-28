import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    bidCard: {
      width: '48%',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    bidCardUrgent: {
      borderColor: '#C8102E',
      borderWidth: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    categoryTag: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    urgentTag: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    urgentTagText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    bidTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1C1917',
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1C1917',
      marginBottom: Spacing.xs,
    },
    bidMeta: {
      fontSize: 11,
      color: '#9CA3AF',
      lineHeight: 16,
    },
    bidDeadline: {
      fontSize: 11,
      color: '#C8102E',
      marginTop: Spacing.xs,
    },
    headerInfo: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    headerInfoText: {
      fontSize: 13,
      color: '#9CA3AF',
    },
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
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
  });
};
