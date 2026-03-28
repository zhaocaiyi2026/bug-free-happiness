import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF9F6',
    },
    header: {
      backgroundColor: '#000000',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    headerTitle: {
      fontFamily: 'NotoSerifSC-Bold',
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 4,
      color: '#8C8C8C',
      marginTop: Spacing.xs,
    },
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      borderRadius: 8,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    searchButtonText: {
      fontSize: 14,
      color: '#8C8C8C',
      marginLeft: Spacing.md,
      flex: 1,
    },
  });
};
