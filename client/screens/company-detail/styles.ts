import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    // Header
    header: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginHorizontal: Spacing.sm,
    },
    headerRight: {
      width: 36,
    },
    // Stats
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    // List
    listContainer: {
      padding: Spacing.sm,
      paddingBottom: Spacing['2xl'],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyText: {
      fontSize: 13,
      color: '#94A3B8',
      marginTop: Spacing.sm,
    },
    // Project Card
    projectCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    typeTag: {
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: Spacing.xs,
    },
    typeTagWin: {
      backgroundColor: '#D1FAE5',
    },
    typeTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '600',
    },
    typeTagTextWin: {
      color: '#059669',
    },
    projectTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: '#1E293B',
      lineHeight: 20,
    },
    projectInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    budgetText: {
      fontSize: 13,
      color: '#DC2626',
      fontWeight: '600',
    },
    metaText: {
      fontSize: 12,
      color: '#64748B',
    },
    projectFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
    },
    dateText: {
      fontSize: 11,
      color: '#94A3B8',
    },
  });
};
