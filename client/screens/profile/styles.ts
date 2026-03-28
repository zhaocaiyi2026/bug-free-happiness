import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    scrollContent: {
      paddingBottom: Spacing['5xl'],
    },
    header: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['2xl'],
      borderBottomLeftRadius: BorderRadius['2xl'],
      borderBottomRightRadius: BorderRadius['2xl'],
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    settingButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
      fontSize: 26,
      fontWeight: '700',
      color: '#2563EB',
    },
    userInfo: {
      marginLeft: Spacing.lg,
      flex: 1,
    },
    nickname: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: Spacing.xs,
    },
    phone: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.sm,
      alignSelf: 'flex-start',
    },
    vipBadgeText: {
      fontSize: 12,
      color: '#FFD700',
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      marginTop: -Spacing.xl,
    },
    vipCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      borderLeftWidth: 4,
      borderLeftColor: '#FFD700',
    },
    vipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    vipTitle: {
      fontSize: 15,
      color: '#6B7280',
      fontWeight: '500',
    },
    vipLevel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFD700',
    },
    vipExpire: {
      fontSize: 13,
      color: '#9CA3AF',
      marginBottom: Spacing.md,
    },
    vipBenefits: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    vipBenefit: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    vipBenefitText: {
      fontSize: 12,
      color: '#374151',
      marginLeft: Spacing.xs,
    },
    upgradeButton: {
      backgroundColor: '#2563EB',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    upgradeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1C1917',
    },
    statLabel: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: Spacing.xs,
    },
    menuSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    menuHeader: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1C1917',
    },
    menuItem: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    menuIconFavorite: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
    },
    menuIconHistory: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    menuIconSubscribe: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    menuIconSetting: {
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
    },
    menuText: {
      flex: 1,
      fontSize: 15,
      color: '#1C1917',
      fontWeight: '500',
    },
    menuArrow: {
      marginLeft: Spacing.sm,
    },
    menuBadge: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
    },
    menuBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    serviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    serviceItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    serviceIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    serviceName: {
      fontSize: 12,
      color: '#374151',
      fontWeight: '500',
    },
    serviceCount: {
      fontSize: 11,
      color: '#9CA3AF',
      marginTop: 2,
    },
  });
};
