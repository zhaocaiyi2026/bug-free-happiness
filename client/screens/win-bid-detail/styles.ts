import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    scrollContent: {
      paddingBottom: 100,
    },
    // Header
    header: {
      backgroundColor: '#059669',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    headerRight: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    headerButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 标题区
    titleSection: {
      marginTop: Spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    categoryTag: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: Spacing.sm,
    },
    categoryTagText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    winTag: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    winTagText: {
      fontSize: 10,
      color: '#059669',
      fontWeight: '700',
      marginLeft: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 26,
    },
    // 核心信息卡片
    coreInfoCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: -Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    amountLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginRight: Spacing.sm,
    },
    amountValue: {
      fontSize: 26,
      fontWeight: '800',
      color: '#059669',
    },
    amountUnit: {
      fontSize: 14,
      color: '#059669',
      fontWeight: '600',
    },
    // 信息网格
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.sm,
    },
    infoItem: {
      width: '50%',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    infoIcon: {
      width: 28,
      height: 28,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    infoLabel: {
      fontSize: 11,
      color: '#9CA3AF',
      marginBottom: 1,
    },
    infoValue: {
      fontSize: 13,
      color: '#1C1917',
      fontWeight: '500',
    },
    // 区块卡片
    sectionCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sectionIcon: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: 'rgba(5,150,105,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1C1917',
    },
    contentText: {
      fontSize: 13,
      lineHeight: 22,
      color: '#4B5563',
    },
    // 联系人信息列表
    contactList: {
      marginTop: Spacing.xs,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    contactIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: '#F9FAFB',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    contactLabel: {
      width: 70,
      fontSize: 12,
      color: '#9CA3AF',
    },
    contactValue: {
      flex: 1,
      fontSize: 13,
      color: '#1C1917',
      fontWeight: '500',
    },
    contactPhone: {
      color: '#059669',
    },
    callButton: {
      backgroundColor: '#059669',
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: Spacing.sm,
    },
    // 来源信息
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      marginTop: Spacing.sm,
    },
    sourceLabel: {
      fontSize: 11,
      color: '#9CA3AF',
    },
    sourceValue: {
      fontSize: 12,
      color: '#6B7280',
    },
    // 底部操作栏
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      paddingBottom: Spacing.lg,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.md,
      marginHorizontal: Spacing.xs,
    },
    primaryButton: {
      backgroundColor: '#059669',
    },
    secondaryButton: {
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: Spacing.xs,
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: '#374151',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
    },
    loadingText: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: Spacing.md,
    },
  });
};
