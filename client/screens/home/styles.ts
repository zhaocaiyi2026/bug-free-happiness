import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    
    // ==================== Header ====================
    headerGradient: {
      paddingTop: 0,
      paddingBottom: Spacing['2xl'],
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    headerContent: {
      paddingHorizontal: Spacing.lg,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    appBrand: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    appLogo: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    appTitleRow: {
      flexDirection: 'column',
    },
    appTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    appSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    
    // ==================== Search Bar ====================
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 16,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: 15,
      color: '#64748B',
    },
    searchButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: 10,
    },
    searchButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    
    // ==================== Stats Section ====================
    statsSection: {
      marginTop: -Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    statIconToday: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    statIconUrgent: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
    },
    statIconWin: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: '#1E293B',
    },
    statValueBlue: {
      color: '#2563EB',
    },
    statValueRed: {
      color: '#DC2626',
    },
    statValueGreen: {
      color: '#059669',
    },
    statLabel: {
      fontSize: 11,
      color: '#64748B',
      marginTop: 2,
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: '#E2E8F0',
    },
    
    // ==================== Quick Actions ====================
    quickActionsSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    quickActionCard: {
      width: '25%',
      paddingHorizontal: 4,
      alignItems: 'center',
    },
    quickActionIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs + 2,
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    quickActionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#64748B',
      textAlign: 'center',
    },
    
    // ==================== Bid List ====================
    listContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    
    // ==================== Bid Card ====================
    bidCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Spacing.md,
      margin: 3,
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    bidCardUrgent: {
      borderLeftWidth: 3,
      borderLeftColor: '#DC2626',
    },
    bidCardWin: {
      borderLeftWidth: 3,
      borderLeftColor: '#059669',
      backgroundColor: '#FAFEFC',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    categoryTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '600',
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    typeTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
    },
    typeTagWin: {
      backgroundColor: 'rgba(5, 150, 105, 0.15)',
    },
    typeTagText: {
      fontSize: 11,
      color: '#2563EB',
      fontWeight: '700',
    },
    typeTagTextWin: {
      color: '#059669',
    },
    urgentTag: {
      backgroundColor: '#DC2626',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
    },
    urgentTagText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    bidTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1E293B',
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    bidBudget: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2563EB',
      marginBottom: 4,
    },
    bidBudgetWin: {
      color: '#059669',
    },
    bidWinCompany: {
      fontSize: 11,
      color: '#059669',
      fontWeight: '500',
      marginBottom: 4,
    },
    bidMeta: {
      fontSize: 11,
      color: '#94A3B8',
      marginBottom: 2,
    },
    bidDeadline: {
      fontSize: 11,
      color: '#DC2626',
      fontWeight: '600',
    },
    bidPublishDate: {
      fontSize: 11,
      color: '#059669',
      fontWeight: '600',
    },
    
    // ==================== States ====================
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      fontSize: 14,
      color: '#64748B',
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
      color: '#94A3B8',
    },
    
    // ==================== Location Button ====================
    locationButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    locationButtonActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderColor: 'rgba(255,255,255,0.4)',
    },
  });
};
