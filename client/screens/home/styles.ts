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
      fontWeight: '800',
      color: '#1C1917',
    },
    appTitleAccent: {
      color: '#2563EB',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      marginTop: Spacing.md,
    },
    searchPlaceholder: {
      fontSize: 14,
      color: '#9CA3AF',
      marginLeft: Spacing.sm,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-around',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: '#2563EB',
    },
    statValueRed: {
      color: '#C8102E',
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: Spacing.xs,
    },
    filterSection: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
    },
    filterChipText: {
      fontSize: 14,
      color: '#374151',
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    sectionContainer: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.md,
      flex: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#1C1917',
    },
    sectionMore: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
    },
    listContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    bidCardUrgent: {
      borderLeftColor: '#C8102E',
      backgroundColor: '#FFFBFC',
    },
    bidCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.xs,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '600',
    },
    urgentTag: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    urgentTagText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    bidTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1917',
      lineHeight: 22,
      marginBottom: Spacing.sm,
    },
    bidBudget: {
      fontSize: 20,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: Spacing.xs,
    },
    bidInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bidMeta: {
      fontSize: 12,
      color: '#6B7280',
    },
    bidDeadline: {
      fontSize: 12,
      color: '#C8102E',
      fontWeight: '500',
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
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
    bidFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    bidSource: {
      fontSize: 11,
      color: '#9CA3AF',
    },
  });
};
