import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F172A',
    },

    // Header - 更紧凑
    header: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: '#1E293B',
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    headerSubtitle: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 2,
    },

    // Stats - 紧凑的横向排列
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
      backgroundColor: '#1E293B',
    },
    statCard: {
      flex: 1,
      backgroundColor: '#334155',
      borderRadius: 10,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    statLabel: {
      fontSize: 10,
      color: '#94A3B8',
      marginTop: 2,
    },

    // Filter - 更紧凑
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
      backgroundColor: '#1E293B',
    },
    filterTab: {
      flex: 1,
      paddingVertical: Spacing.xs,
      borderRadius: 8,
      backgroundColor: '#334155',
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: '#2563EB',
    },
    filterTabText: {
      fontSize: 12,
      color: '#94A3B8',
      fontWeight: '500',
    },
    filterTabTextActive: {
      color: '#FFFFFF',
    },

    // Search - 紧凑
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.sm,
      backgroundColor: '#1E293B',
      borderRadius: 10,
      paddingHorizontal: Spacing.sm,
      borderWidth: 1,
      borderColor: '#334155',
    },
    searchIcon: {
      marginRight: Spacing.xs,
    },
    searchInput: {
      flex: 1,
      height: 36,
      fontSize: 13,
      color: '#F8FAFC',
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
      color: '#64748B',
      marginTop: Spacing.sm,
    },

    // User Card - 紧凑的单行设计
    userCard: {
      backgroundColor: '#1E293B',
      borderRadius: 12,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: '#334155',
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
      color: '#F8FAFC',
      maxWidth: 100,
    },
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Spacing.xs,
      gap: 4,
    },
    adminBadge: {
      backgroundColor: '#10B981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    adminBadgeText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F59E0B',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 2,
    },
    vipBadgeText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    userPhone: {
      fontSize: 11,
      color: '#94A3B8',
    },
    userDate: {
      fontSize: 10,
      color: '#64748B',
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
      backgroundColor: '#0F172A',
    },
    noPermissionText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#F8FAFC',
      marginTop: Spacing.md,
    },
    noPermissionHint: {
      fontSize: 13,
      color: '#64748B',
      marginTop: Spacing.xs,
    },

    // Modal - 保持深色风格
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    modalContent: {
      backgroundColor: '#1E293B',
      borderRadius: 16,
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderColor: '#334155',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#F8FAFC',
    },
    modalBody: {
      padding: Spacing.md,
    },
    modalUserInfo: {
      fontSize: 13,
      color: '#F8FAFC',
      marginBottom: Spacing.xs,
    },
    modalCurrentVip: {
      fontSize: 11,
      color: '#94A3B8',
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
      backgroundColor: '#334155',
      gap: Spacing.sm,
    },
    vipOptionActive: {
      backgroundColor: '#2563EB',
    },
    vipOptionText: {
      fontSize: 13,
      color: '#F8FAFC',
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
      backgroundColor: 'rgba(30,41,59,0.9)',
      borderRadius: 16,
    },

    // 返回按钮
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: '#334155',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};
