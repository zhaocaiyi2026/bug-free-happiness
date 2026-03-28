import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1C1917',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBar: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    filterChip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    filterChipText: {
      fontSize: 14,
      color: '#1C1917',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    bidCard: {
      width: '48%',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: Spacing.md,
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
    tabBar: {
      backgroundColor: '#FFFFFF',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    tabIndicator: {
      backgroundColor: '#2563EB',
      height: 2,
    },
  });
};
