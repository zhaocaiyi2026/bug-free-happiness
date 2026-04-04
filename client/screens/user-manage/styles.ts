import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    // Header
    header: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      backgroundColor: theme.primary,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      marginTop: Spacing.xs,
    },

    // Stats
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: Spacing.xs,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },

    // Filter
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    filterTab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterTabActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterTabText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    filterTabTextActive: {
      color: '#FFFFFF',
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 14,
      color: theme.textPrimary,
    },
    searchButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },

    // List
    listContainer: {
      paddingHorizontal: Spacing.lg,
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
      paddingVertical: Spacing['5xl'],
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
      marginTop: Spacing.md,
    },

    // User Card
    userCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    userInfo: {
      marginBottom: Spacing.sm,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    avatarVip: {
      backgroundColor: '#F59E0B',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    userMain: {
      flex: 1,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    userNickname: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    adminBadge: {
      backgroundColor: '#10B981',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    adminBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
      gap: 2,
    },
    vipBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    userPhone: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    userDate: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    userActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      gap: Spacing.xs,
    },
    actionButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },

    // No Permission
    noPermission: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    noPermissionText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginTop: Spacing.lg,
    },
    noPermissionHint: {
      fontSize: 14,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      width: '100%',
      maxWidth: 340,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    modalBody: {
      padding: Spacing.lg,
    },
    modalUserInfo: {
      fontSize: 14,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    modalCurrentVip: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: Spacing.md,
    },
    vipOptions: {
      gap: Spacing.sm,
    },
    vipOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
      gap: Spacing.sm,
    },
    vipOptionActive: {
      backgroundColor: theme.primary,
    },
    vipOptionText: {
      fontSize: 14,
      color: theme.textPrimary,
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
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderRadius: BorderRadius.xl,
    },
  });
};
