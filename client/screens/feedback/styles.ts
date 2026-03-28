import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    // Header
    header: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Section
    section: {
      backgroundColor: '#FFFFFF',
      marginTop: Spacing.md,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: Spacing.md,
    },
    // 类型选择
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: '#F5F5F5',
      gap: Spacing.xs,
    },
    typeItemActive: {
      backgroundColor: '#2563EB',
    },
    typeText: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
    },
    typeTextActive: {
      color: '#FFFFFF',
    },
    // 输入框
    textInput: {
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      fontSize: 15,
      color: '#1C1917',
      minHeight: 150,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: '#9CA3AF',
      textAlign: 'right',
      marginTop: Spacing.sm,
    },
    contactInput: {
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      fontSize: 15,
      color: '#1C1917',
    },
    // 提示
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: '#2563EB',
      lineHeight: 20,
    },
    // 提交按钮
    submitButton: {
      backgroundColor: '#2563EB',
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.xl,
      paddingVertical: Spacing.md + 2,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: '#93C5FD',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
};
