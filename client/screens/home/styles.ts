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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 4,
      color: '#8C8C8C',
      marginTop: Spacing.xs,
    },
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      borderRadius: 8,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginTop: Spacing.lg,
    },
    searchButtonText: {
      fontSize: 14,
      color: '#8C8C8C',
      marginLeft: Spacing.md,
      flex: 1,
    },
    content: {
      flex: 1,
      marginTop: -Spacing.xl,
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing['2xl'],
    },
    sectionTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#8C8C8C',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    urgentContainer: {
      marginBottom: Spacing.lg,
    },
    urgentScroll: {
      paddingLeft: Spacing.lg,
    },
    urgentCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      marginRight: Spacing.md,
      width: 280,
      borderLeftWidth: 3,
      borderLeftColor: '#C8102E',
    },
    urgentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    urgentBadgeText: {
      fontSize: 11,
      color: '#C8102E',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginLeft: Spacing.xs,
    },
    urgentTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 16,
      lineHeight: 24,
      color: '#1A1A1A',
      marginBottom: Spacing.sm,
    },
    urgentBudget: {
      fontSize: 18,
      fontWeight: '700',
      color: '#C8102E',
      marginBottom: Spacing.sm,
    },
    urgentMeta: {
      fontSize: 12,
      color: '#8C8C8C',
    },
    listContainer: {
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
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
      marginVertical: Spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
