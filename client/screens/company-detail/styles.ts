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
      backgroundColor: '#1E293B',
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
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginHorizontal: Spacing.sm,
      textAlign: 'center',
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
      fontSize: 22,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.15)',
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    projectHeader: {
      marginBottom: Spacing.sm,
    },
    projectTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    industryTag: {
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    industryTagWin: {
      backgroundColor: '#D1FAE5',
    },
    industryTagText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '500',
    },
    industryTagTextWin: {
      color: '#059669',
    },
    typeTag: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      maxWidth: 60,  // 限制最大宽度
    },
    typeTagWin: {
      backgroundColor: '#ECFDF5',
    },
    typeTagText: {
      fontSize: 10,
      color: '#3B82F6',
      fontWeight: '500',
    },
    typeTagTextWin: {
      color: '#10B981',
    },
    projectTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
      lineHeight: 22,
      marginBottom: Spacing.sm,
    },
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      backgroundColor: '#FEF2F2',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 8,
      marginBottom: Spacing.sm,
    },
    budgetLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginRight: Spacing.xs,
    },
    budgetValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#DC2626',
    },
    budgetValueWin: {
      color: '#059669',
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    infoText: {
      fontSize: 12,
      color: '#64748B',
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginBottom: Spacing.sm,
    },
    addressText: {
      flex: 1,
      fontSize: 12,
      color: '#64748B',
      lineHeight: 18,
    },
    contentSection: {
      marginBottom: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      paddingTop: Spacing.sm,
    },
    contentToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
    },
    contentToggleText: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
    },
    contentText: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 20,
      marginTop: Spacing.xs,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F8FAFC',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      marginBottom: Spacing.sm,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    contactText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
    },
    contactPerson: {
      fontSize: 12,
      color: '#64748B',
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: 6,
      gap: 4,
    },
    callButtonWin: {
      backgroundColor: '#059669',
    },
    callButtonText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    projectFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roleText: {
      fontSize: 11,
      color: '#94A3B8',
    },
  });
};
