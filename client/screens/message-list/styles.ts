import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1F2937',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      color: '#6B7280',
    },
    listContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing['3xl'],
    },
    messageCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    messageCardUnread: {
      borderLeftWidth: 3,
      borderLeftColor: '#EC4899',
    },
    messageIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    messageTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: '#1F2937',
      marginBottom: 4,
    },
    messageTitleUnread: {
      fontWeight: '600',
    },
    messageDesc: {
      fontSize: 13,
      color: '#6B7280',
      lineHeight: 18,
      marginBottom: 4,
    },
    messageTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: Spacing.md,
    },
    emptySubtext: {
      fontSize: 13,
      color: '#9CA3AF',
      marginTop: Spacing.xs,
    },
  });
};
