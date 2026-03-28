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
      paddingVertical: Spacing['2xl'],
      paddingBottom: Spacing['3xl'],
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#8C8C8C',
    },
    content: {
      marginTop: -Spacing['2xl'],
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      paddingBottom: 100,
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
      fontSize: 16,
      lineHeight: 24,
      color: '#1A1A1A',
      marginBottom: Spacing.md,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    bidMetaItem: {
      fontSize: 12,
      color: '#8C8C8C',
      marginRight: Spacing.lg,
    },
    bidBudget: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
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
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    emptyButton: {
      backgroundColor: '#000000',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: 8,
    },
    emptyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
