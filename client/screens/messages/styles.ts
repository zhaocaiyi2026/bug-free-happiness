import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 100,
    },
    // 导航栏
    navBar: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    navBarContent: {
      flexDirection: 'column',
    },
    navBarTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: '#1F2937',
      letterSpacing: -0.5,
    },
    navBarSubtitle: {
      fontSize: 13,
      color: '#9CA3AF',
      marginTop: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: '#6B7280',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    emptyText: {
      fontSize: 15,
      color: '#9CA3AF',
    },
    // 消息列表容器
    categoriesContainer: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      gap: Spacing.sm,
    },
    // 消息卡片 - 长条状卡片风格
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1F2937',
    },
    categoryTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    categoryMessage: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      marginTop: 2,
    },
    categoryBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    categoryBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    // 图标容器（带徽章）
    iconWrapper: {
      position: 'relative',
    },
    // 右侧箭头
    categoryArrow: {
      marginLeft: Spacing.sm,
      alignSelf: 'center',
    },
  });
};
