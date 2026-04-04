import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },

    // Header
    header: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: '#2563EB',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
    },

    // Stats
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
      backgroundColor: '#F8FAFC',
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1E293B',
    },
    statLabel: {
      fontSize: 10,
      color: '#64748B',
      marginTop: 2,
    },

    // Filter
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
      backgroundColor: '#F8FAFC',
    },
    filterTab: {
      flex: 1,
      paddingVertical: Spacing.xs,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    filterTabActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    filterTabText: {
      fontSize: 12,
      color: '#64748B',
      fontWeight: '500',
    },
    filterTabTextActive: {
      color: '#FFFFFF',
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.sm,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: Spacing.sm,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    searchIcon: {
      marginRight: Spacing.xs,
    },
    searchInput: {
      flex: 1,
      height: 36,
      fontSize: 13,
      color: '#1E293B',
    },
    searchButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: 6,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },

    // List
    listContainer: {
      paddingHorizontal: Spacing.md,
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

    // User Card
    userCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarVip: {
      backgroundColor: '#F59E0B',
    },
    avatarAdmin: {
      backgroundColor: '#10B981',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    userMain: {
      flex: 1,
      marginLeft: Spacing.sm,
      marginRight: Spacing.sm,
    },
    userTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userNickname: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1E293B',
      maxWidth: 120,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Spacing.xs,
      gap: 4,
    },
    adminBadge: {
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    adminBadgeText: {
      fontSize: 9,
      color: '#059669',
      fontWeight: '600',
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 2,
    },
    vipBadgeText: {
      fontSize: 9,
      color: '#D97706',
      fontWeight: '600',
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    userPhone: {
      fontSize: 11,
      color: '#64748B',
    },
    userDate: {
      fontSize: 10,
      color: '#94A3B8',
      marginLeft: Spacing.sm,
    },
    userActions: {
      flexDirection: 'row',
      gap: 6,
    },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionBtnVip: {
      backgroundColor: '#FEF3C7',
    },
    actionBtnAdmin: {
      backgroundColor: '#DBEAFE',
    },
    actionBtnRemove: {
      backgroundColor: '#FEE2E2',
    },

    // No Permission
    noPermission: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
      backgroundColor: '#F8FAFC',
    },
    noPermissionText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginTop: Spacing.md,
    },
    noPermissionHint: {
      fontSize: 13,
      color: '#64748B',
      marginTop: Spacing.xs,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      width: '100%',
      maxWidth: 320,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
    },
    modalBody: {
      padding: Spacing.md,
    },
    modalUserInfo: {
      fontSize: 13,
      color: '#1E293B',
      marginBottom: Spacing.xs,
    },
    modalCurrentVip: {
      fontSize: 11,
      color: '#64748B',
      marginBottom: Spacing.md,
    },
    vipOptions: {
      gap: Spacing.xs,
    },
    vipOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: 10,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      gap: Spacing.sm,
    },
    vipOptionActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    vipOptionText: {
      fontSize: 13,
      color: '#1E293B',
      fontWeight: '500',
    },
    vipOptionTextActive: {
      color: '#FFFFFF',
    },
    modalLoading: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 16,
    },

    // Header row
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};
