import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    scrollContent: {
      paddingBottom: 80,
    },
    // 紧凑型 Header
    header: {
      backgroundColor: '#2563EB',
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
    urgentTag: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    urgentTagText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
      marginLeft: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 26,
    },
    // 核心信息卡片 - 紧凑型
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
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    budgetLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginRight: Spacing.sm,
    },
    budgetValue: {
      fontSize: 26,
      fontWeight: '800',
      color: '#2563EB',
    },
    budgetUnit: {
      fontSize: 14,
      color: '#2563EB',
      fontWeight: '600',
    },
    // 信息网格 - 紧凑型
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
    infoItemFull: {
      width: '100%',
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
    infoValueRed: {
      color: '#C8102E',
    },
    // 项目详情
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
      backgroundColor: 'rgba(37,99,235,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1C1917',
    },
    cachedBadge: {
      fontSize: 10,
      color: '#059669',
      marginLeft: Spacing.sm,
      backgroundColor: 'rgba(5,150,105,0.1)',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: 4,
    },
    contentText: {
      fontSize: 13,
      lineHeight: 22,
      color: '#4B5563',
    },
    // 文档格式样式
    docSection: {
      marginBottom: Spacing.md,
    },
    docSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#1C1917',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      lineHeight: 22,
    },
    docParagraph: {
      fontSize: 13,
      lineHeight: 22,
      color: '#4B5563',
      marginBottom: Spacing.xs,
    },
    docListItem: {
      fontSize: 13,
      lineHeight: 22,
      color: '#4B5563',
      marginLeft: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    // 文档内容样式
    docContent: {
      fontSize: 14,
      lineHeight: 24,
      color: '#374151',
    },
    // 格式化加载样式
    loadingFormatContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
    },
    loadingFormatText: {
      fontSize: 13,
      color: '#6B7280',
      marginLeft: Spacing.sm,
    },
    // 联系人信息列表
    contactList: {
      marginTop: Spacing.xs,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
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
      color: '#2563EB',
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
    // 底部操作栏 - 紧凑型
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
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
      backgroundColor: '#2563EB',
    },
    secondaryButton: {
      backgroundColor: '#F5F5F5',
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
