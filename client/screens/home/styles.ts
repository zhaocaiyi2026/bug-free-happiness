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
      paddingBottom: Spacing.xl,
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
      marginBottom: Spacing.md,
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
    selectedLocationTag: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 6,
      marginHorizontal: Spacing.xs,
    },
    selectedLocationText: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '500',
      marginLeft: 4,
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
      marginTop: -Spacing.md,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    statIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
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
      fontSize: 18,
      fontWeight: '700',
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
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: '#E2E8F0',
    },
    
    // ==================== Quick Actions - 长条状标签 ====================
    quickActionsSection: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      alignItems: 'center',
    },
    quickActionTab: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: '#1E40AF',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    quickActionTabActive: {
      backgroundColor: '#2563EB',
    },
    quickActionIconWrapper: {
      marginBottom: 4,
    },
    quickActionTabText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#64748B',
      textAlign: 'center',
    },
    quickActionTabTextActive: {
      color: '#FFFFFF',
    },
    
    // ==================== Bid List ====================
    listContainer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    
    // ==================== Bid Card - 长条状紧凑版 ====================
    bidCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.sm + 2,
      marginBottom: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    bidCardUrgent: {
      borderLeftWidth: 3,
      borderLeftColor: '#DC2626',
      borderColor: '#FECACA',
    },
    bidCardWin: {
      borderLeftWidth: 3,
      borderLeftColor: '#059669',
      backgroundColor: '#FAFEFC',
      borderColor: '#A7F3D0',
    },
    bidCardLeft: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    bidCardRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 70,
    },
    bidTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E293B',
      lineHeight: 18,
      marginBottom: 2,
    },
    bidMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 2,
    },
    bidTag: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    bidTagText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '500',
    },
    bidTagWin: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    bidTagWinText: {
      color: '#059669',
    },
    bidLocation: {
      fontSize: 11,
      color: '#94A3B8',
    },
    bidBudget: {
      fontSize: 15,
      fontWeight: '700',
      color: '#2563EB',
      marginBottom: 2,
    },
    bidBudgetWin: {
      color: '#059669',
    },
    bidWinCompany: {
      fontSize: 10,
      color: '#059669',
      fontWeight: '500',
      textAlign: 'right',
    },
    bidDeadline: {
      fontSize: 10,
      color: '#DC2626',
      fontWeight: '500',
    },
    bidPublishDate: {
      fontSize: 10,
      color: '#059669',
      fontWeight: '500',
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
    locationButtonText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '500',
    },
    
    // ==================== Location Info ====================
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
    },
    locationInfoText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      marginLeft: Spacing.xs,
      marginRight: Spacing.xs,
    },
    clearLocationButton: {
      padding: 2,
    },
    
    // ==================== Location Modal ====================
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '70%',
      paddingBottom: Spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    modalBackButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1E293B',
    },
    provinceList: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    provinceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    provinceItemActive: {
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
      borderRadius: 8,
    },
    provinceText: {
      fontSize: 15,
      color: '#475569',
    },
    provinceTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    allProvinceItem: {
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderRadius: 12,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      borderBottomWidth: 0,
    },
    allProvinceContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cityListHeader: {
      fontSize: 13,
      color: '#94A3B8',
      fontWeight: '600',
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    emptyCityContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyCityText: {
      fontSize: 14,
      color: '#94A3B8',
      marginTop: Spacing.md,
    },
    emptyCityHint: {
      fontSize: 12,
      color: '#CBD5E1',
      marginTop: Spacing.xs,
    },
  });
};
