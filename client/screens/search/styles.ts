import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF9F6',
    },
    header: {
      backgroundColor: '#000000',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
      paddingBottom: Spacing['2xl'],
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: Spacing.md,
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
      flex: 1,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      borderRadius: 8,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginTop: Spacing.lg,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#FFFFFF',
      marginLeft: Spacing.md,
    },
    content: {
      flex: 1,
      marginTop: -Spacing.xl,
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing.xl,
    },
    filterSection: {
      marginBottom: Spacing.lg,
    },
    filterTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#8C8C8C',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    filterScroll: {
      paddingLeft: Spacing.lg,
    },
    filterChip: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 0,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.sm,
    },
    filterChipActive: {
      backgroundColor: '#000000',
      borderColor: '#000000',
    },
    filterChipText: {
      fontSize: 13,
      color: '#1A1A1A',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    budgetInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    budgetInput: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 14,
      color: '#1A1A1A',
    },
    budgetSeparator: {
      marginHorizontal: Spacing.sm,
      color: '#8C8C8C',
    },
    applyButton: {
      backgroundColor: '#000000',
      marginHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    applyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    resultsContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 100,
    },
    resultCount: {
      fontSize: 13,
      color: '#8C8C8C',
      marginBottom: Spacing.md,
    },
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    bidCategory: {
      fontSize: 12,
      color: '#C8102E',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: Spacing.sm,
    },
    bidTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 17,
      lineHeight: 26,
      color: '#1A1A1A',
      marginBottom: Spacing.md,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    bidMetaItem: {
      fontSize: 13,
      color: '#8C8C8C',
      marginRight: Spacing.lg,
    },
    bidBudget: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
      marginTop: Spacing.sm,
    },
    bidDate: {
      fontSize: 12,
      color: '#8C8C8C',
      marginTop: Spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['5xl'],
    },
    emptyText: {
      fontSize: 14,
      color: '#8C8C8C',
    },
  });
};
