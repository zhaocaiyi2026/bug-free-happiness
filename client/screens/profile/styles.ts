import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF9F6',
    },
    scrollContent: {
      paddingBottom: 100,
    },
    header: {
      backgroundColor: '#000000',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing['2xl'],
      paddingBottom: Spacing['3xl'],
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#C8102E',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    userDetail: {
      flex: 1,
    },
    nickname: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: Spacing.xs,
    },
    phone: {
      fontSize: 14,
      color: '#8C8C8C',
    },
    content: {
      marginTop: -Spacing['2xl'],
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    vipCard: {
      backgroundColor: '#000000',
      borderRadius: 16,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    vipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    vipTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#C8102E',
    },
    vipLevel: {
      fontSize: 24,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    vipDesc: {
      fontSize: 13,
      color: '#8C8C8C',
      marginTop: Spacing.sm,
    },
    upgradeButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    upgradeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    menuSection: {
      marginTop: Spacing.lg,
    },
    menuTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#8C8C8C',
      marginBottom: Spacing.md,
    },
    menuItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    menuText: {
      flex: 1,
      fontSize: 15,
      color: '#1A1A1A',
    },
    menuArrow: {
      marginLeft: Spacing.sm,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: '#8C8C8C',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
