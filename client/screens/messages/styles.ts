import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1C1917',
    },
    markReadButton: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
    },
    tabContainer: {
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    tabItem: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    tabItemActive: {
      borderBottomWidth: 2,
      borderBottomColor: '#2563EB',
    },
    tabText: {
      fontSize: 14,
      color: '#9CA3AF',
      fontWeight: '500',
    },
    tabTextActive: {
      color: '#2563EB',
      fontWeight: '600',
    },
    tabBadge: {
      backgroundColor: '#C8102E',
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: Spacing.xs,
      paddingHorizontal: 4,
    },
    tabBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    messageCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      flexDirection: 'row',
    },
    messageCardUnread: {
      borderLeftWidth: 3,
      borderLeftColor: '#2563EB',
    },
    messageIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    messageIconSystem: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    messageIconSubscribe: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
    },
    messageIconAlert: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
    },
    messageContent: {
      flex: 1,
    },
    messageTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1917',
      marginBottom: Spacing.xs,
    },
    messageTitleUnread: {
      fontWeight: '700',
    },
    messageDesc: {
      fontSize: 13,
      color: '#6B7280',
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    messageTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2563EB',
      marginTop: Spacing.xs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['5xl'],
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
  });
};
