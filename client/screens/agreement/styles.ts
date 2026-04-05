import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      backgroundColor: theme.backgroundRoot,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: Spacing['4xl'],
    },
    sectionTitle: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    paragraph: {
      lineHeight: 24,
      marginBottom: Spacing.sm,
    },
    updateTime: {
      marginTop: Spacing.xl,
      textAlign: 'center',
    },
  });
};
