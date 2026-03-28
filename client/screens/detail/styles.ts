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
      paddingVertical: Spacing.xl,
      paddingBottom: Spacing['2xl'],
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: Spacing.md,
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 20,
      fontWeight: '900',
      color: '#FFFFFF',
      flex: 1,
    },
    category: {
      fontSize: 12,
      color: '#C8102E',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: Spacing.md,
    },
    title: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 24,
      lineHeight: 34,
      color: '#FFFFFF',
      marginBottom: Spacing.md,
    },
    urgentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    urgentBadgeText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
      marginLeft: Spacing.xs,
    },
    content: {
      marginTop: -Spacing.xl,
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: Spacing['2xl'],
      paddingHorizontal: Spacing.lg,
    },
    metaCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    metaIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    metaLabel: {
      fontSize: 12,
      color: '#8C8C8C',
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 15,
      color: '#1A1A1A',
      fontWeight: '600',
    },
    budgetValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#C8102E',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
      marginVertical: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 3,
      color: '#8C8C8C',
      marginBottom: Spacing.md,
    },
    contentText: {
      fontSize: 16,
      lineHeight: 28,
      color: '#1A1A1A',
    },
    sourceCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
    },
    sourceLabel: {
      fontSize: 12,
      color: '#8C8C8C',
      marginBottom: Spacing.sm,
    },
    sourceValue: {
      fontSize: 14,
      color: '#1A1A1A',
      marginBottom: Spacing.xs,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5E5',
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: 8,
      marginHorizontal: Spacing.xs,
    },
    primaryButton: {
      backgroundColor: '#000000',
    },
    secondaryButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: Spacing.sm,
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: '#1A1A1A',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: '#8C8C8C',
      marginTop: Spacing.md,
    },
  });
};
