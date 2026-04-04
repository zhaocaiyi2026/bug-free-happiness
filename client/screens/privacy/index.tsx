import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

export default function PrivacyScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="dark">
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐私政策</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          本 APP 非常重视用户隐私保护，仅收集提供服务所必需的信息。本隐私政策将向您说明我们如何收集、使用和保护您的个人信息。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          一、信息收集范围
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          本 APP 仅收集提供服务所必需的信息，包括：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 设备信息：设备型号、操作系统版本、唯一设备标识符
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 使用日志：浏览记录、搜索记录、收藏记录
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 会员订单信息：订单记录、支付状态
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          二、我们不会收集的信息
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          我们承诺不会非法收集用户通讯录、短信、位置等与提供服务无关的隐私信息。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          三、信息使用目的
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          用户信息仅用于以下目的：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 服务提供：正常功能使用、信息展示
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 客服处理：响应用户咨询、问题反馈
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          • 安全风控：账号安全、防范欺诈
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          我们不会出售或非法将用户信息提供给第三方。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          四、公开信息说明
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台展示的招标信息中出现的联系人、联系电话等属于官方公开内容，平台仅原样展示，不用于营销外呼或其他商业用途。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          五、账号注销与信息删除
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          用户可在 APP 内申请注销账号、删除个人信息，我们将依法及时处理。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          六、联系我们
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          如您对本隐私政策有任何疑问，可通过以下方式联系我们：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          客服邮箱：support@zhaobiao.com
        </ThemedText>

        <ThemedText variant="body" color={theme.textMuted} style={styles.updateTime}>
          最后更新日期：2025年4月4日
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
