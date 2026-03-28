import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    listContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    loadingText: {
      fontSize: 14,
      color: '#8C8C8C',
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
      color: '#8C8C8C',
    },
  });
};
