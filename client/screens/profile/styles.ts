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
    // 导航栏 - 白色背景
    navBar: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
    },
    settingButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 用户卡片 - 蓝色背景
    userCard: {
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    userMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2563EB',
    },
    userInfo: {
      marginLeft: Spacing.lg,
      flex: 1,
    },
    nickname: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: Spacing.xs,
    },
    phone: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.xs,
    },
    vipBadgeText: {
      fontSize: 11,
      color: '#FFD700',
      fontWeight: '600',
      marginLeft: 4,
    },
    // 统计卡片
    statsCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: '#E5E7EB',
    },
    // 服务入口
    servicesSection: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: Spacing.sm,
    },
    servicesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    serviceItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    serviceIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    serviceName: {
      fontSize: 12,
      color: '#374151',
    },
    serviceBadge: {
      position: 'absolute',
      top: -2,
      right: 8,
      backgroundColor: '#DC2626',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    serviceBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    vipTagSmall: {
      position: 'absolute',
      top: -4,
      right: 4,
      backgroundColor: '#FEF3C7',
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    vipTagSmallText: {
      fontSize: 8,
      color: '#D97706',
      fontWeight: '700',
    },
    // VIP卡片
    vipCard: {
      backgroundColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#FCD34D',
    },
    vipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    vipIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F59E0B',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    vipTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#92400E',
    },
    vipDesc: {
      fontSize: 12,
      color: '#B45309',
    },
    vipBenefits: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.sm,
    },
    vipBenefit: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.md,
      marginBottom: Spacing.xs,
    },
    vipBenefitText: {
      fontSize: 12,
      color: '#92400E',
      marginLeft: 4,
    },
    vipButton: {
      backgroundColor: '#F59E0B',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      alignItems: 'center',
    },
    vipButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    // 菜单列表
    menuSection: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    menuText: {
      flex: 1,
      fontSize: 15,
      color: '#1F2937',
    },
    menuArrow: {
      marginLeft: Spacing.sm,
    },
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
