import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    scrollContent: {
      paddingBottom: Spacing['5xl'],
    },
    // 用户卡片 - 蓝色背景延伸到顶部
    userCard: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.lg,
      padding: Spacing.lg,
      paddingBottom: 0,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    userMain: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '700',
      color: '#2563EB',
    },
    userInfo: {
      marginLeft: Spacing.md,
      flex: 1,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nickname: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    editBtn: {
      marginLeft: Spacing.sm,
      padding: 4,
    },
    phone: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    userTags: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: 8,
    },
    vipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.25)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    vipBadgeText: {
      fontSize: 11,
      color: '#FFD700',
      fontWeight: '600',
      marginLeft: 4,
    },
    // 普通会员标签样式
    normalBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    normalBadgeText: {
      color: '#FFFFFF',
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    pointsText: {
      fontSize: 11,
      color: '#FFD700',
      fontWeight: '600',
      marginLeft: 4,
    },
    progressRow: {
      marginTop: Spacing.xs,
    },
    progressBar: {
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#FFD700',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: 4,
    },
    // 签到按钮
    signInBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: BorderRadius.md,
    },
    signedInBtn: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    signInText: {
      fontSize: 11,
      color: '#FFD700',
      fontWeight: '600',
      marginTop: 2,
    },
    signedInText: {
      color: 'rgba(255, 255, 255, 0.5)',
    },
    // 快捷入口 - 长条状统计
    quickActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    quickItem: {
      alignItems: 'center',
      flex: 1,
    },
    quickItemValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    quickItemText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    quickDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    // VIP卡片
    vipCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
      borderRadius: 16,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
    },
    vipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vipHeaderContent: {
      flex: 1,
      marginLeft: Spacing.sm,
    },
    vipIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    vipTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#92400E',
    },
    vipDesc: {
      fontSize: 12,
      color: '#B45309',
      marginTop: 2,
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
      fontSize: 11,
      color: '#92400E',
      marginLeft: 4,
    },
    vipButton: {
      backgroundColor: '#F59E0B',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      alignItems: 'center',
    },
    vipButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    // 菜单列表 - 长条卡片
    menuSection: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md + 2,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    menuText: {
      flex: 1,
      fontSize: 15,
      color: '#1F2937',
      fontWeight: '500',
    },
    menuBadge: {
      backgroundColor: '#DC2626',
      borderRadius: 10,
      minWidth: 18,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: Spacing.sm,
    },
    menuBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    menuArrow: {
      marginLeft: Spacing.sm,
    },
    comingBadge: {
      backgroundColor: '#DBEAFE',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginRight: Spacing.sm,
    },
    comingBadgeText: {
      fontSize: 10,
      color: '#2563EB',
      fontWeight: '700',
    },
    vipTagSmall: {
      backgroundColor: '#FEF3C7',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    vipTagSmallText: {
      fontSize: 10,
      color: '#D97706',
      fontWeight: '700',
      marginLeft: 2,
    },
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
