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
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1C1917',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 4,
      marginTop: Spacing.md,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#1C1917',
      marginLeft: Spacing.sm,
    },
    searchPlaceholder: {
      fontSize: 15,
      color: '#9CA3AF',
      marginLeft: Spacing.sm,
    },
    sectionContainer: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
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
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -Spacing.sm / 2,
    },
    categoryItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    categoryIcon: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    categoryIconText: {
      fontSize: 22,
    },
    categoryName: {
      fontSize: 12,
      color: '#374151',
      fontWeight: '500',
    },
    categoryCount: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 2,
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
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
    },
    filterChipActive: {
      backgroundColor: '#2563EB',
    },
    filterChipText: {
      fontSize: 13,
      color: '#374151',
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    tag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
    },
    tagHot: {
      backgroundColor: 'rgba(200, 16, 46, 0.08)',
    },
    tagText: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
    },
    tagTextHot: {
      color: '#C8102E',
    },
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
    },
    bidCardUrgent: {
      borderLeftColor: '#C8102E',
    },
    bidCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    bidCategory: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    bidCategoryText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '600',
    },
    bidUrgentBadge: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    bidUrgentText: {
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
    bidInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '700',
      color: '#2563EB',
    },
    bidMeta: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    bidDeadline: {
      fontSize: 12,
      color: '#C8102E',
      marginTop: Spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
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
