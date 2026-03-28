import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['5xl'],
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.full,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1C1917',
    },
    // Logo
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: BorderRadius.xl,
      backgroundColor: '#2563EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    appName: {
      fontSize: 28,
      fontWeight: '800',
      color: '#1C1917',
      marginBottom: Spacing.xs,
    },
    appSlogan: {
      fontSize: 14,
      color: '#6B7280',
    },
    // 表单
    form: {
      marginBottom: Spacing.xl,
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      height: 52,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: '#1C1917',
      height: '100%',
    },
    smsButton: {
      backgroundColor: '#2563EB',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    smsButtonDisabled: {
      backgroundColor: '#E5E7EB',
    },
    smsButtonText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    smsButtonTextDisabled: {
      color: '#9CA3AF',
    },
    // 错误提示
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    errorText: {
      fontSize: 13,
      color: '#C8102E',
      flex: 1,
    },
    // 协议
    agreement: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#D1D5DB',
      marginRight: Spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    agreementText: {
      fontSize: 12,
      color: '#6B7280',
    },
    agreementLink: {
      color: '#2563EB',
    },
    // 提交按钮
    submitButton: {
      backgroundColor: '#2563EB',
      height: 52,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonDisabled: {
      backgroundColor: '#93C5FD',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // 登录链接
    loginLink: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    loginLinkText: {
      fontSize: 14,
      color: '#6B7280',
    },
    loginLinkHighlight: {
      color: '#2563EB',
      fontWeight: '600',
    },
  });
};
