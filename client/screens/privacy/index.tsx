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
          招标通（以下简称&quot;我们&quot;）非常重视用户的隐私和个人信息保护。本隐私政策将向您说明我们如何收集、使用、存储和保护您的个人信息，以及您享有的相关权利。请您在使用我们的服务前，仔细阅读并理解本隐私政策。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          一、我们收集的信息
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.1 账号信息：当您注册账号时，我们会收集您的手机号码、昵称等基本信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.2 交易信息：当您开通VIP会员时，我们会收集您的订单信息、支付记录等。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.3 使用信息：我们会自动收集您使用服务的记录，包括浏览记录、搜索记录、收藏记录等。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.4 设备信息：我们会收集您的设备型号、操作系统版本、唯一设备标识符等信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.5 位置信息：在您授权的情况下，我们会收集您的位置信息以提供更精准的招标信息推荐。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          二、我们如何使用收集的信息
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.1 为您提供、维护、改进我们的服务；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.2 用于身份验证、账户安全、防范欺诈风险；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.3 向您发送服务通知、营销信息（经您同意）；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.4 进行数据分析、用户调研，改善我们的产品和服务；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.5 遵守法律法规的要求，响应政府机关的合法请求。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          三、信息的存储
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          3.1 我们会采取加密等安全措施存储您的个人信息，防止信息丢失、被不当使用或未经授权访问。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          3.2 您的个人信息存储在中华人民共和国境内的服务器。如需跨境传输，我们会单独征得您的授权同意。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          3.3 我们会采取合理措施，在实现目的所需的最短期内保留您的个人信息。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          四、信息的共享、转让、公开披露
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          4.1 我们不会向第三方共享、转让您的个人信息，除非：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （1）事先获得您明确的同意或授权；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （2）根据适用的法律法规、法律程序的要求而提供；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （3）根据政府机关的合法要求而提供。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          五、您的权利
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.1 访问权：您有权访问我们持有的您的个人信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.2 更正权：您有权要求我们更正不准确的个人信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.3 删除权：在特定情况下，您有权要求我们删除您的个人信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.4 撤回同意权：您有权随时撤回您之前给予我们的同意。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.5 注销账号：您可以在App内申请注销账号，我们将在15个工作日内完成处理。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          六、Cookie和类似技术
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          6.1 我们使用Cookie和类似技术来提供、保护和改进我们的服务。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          6.2 您可以通过浏览器设置管理Cookie，但这可能影响您使用我们服务的某些功能。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          七、未成年人保护
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          7.1 我们非常重视对未成年人个人信息的保护。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          7.2 如您为未成年人，请在监护人指导和同意下使用我们的服务。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          7.3 如您的监护人不同意您使用我们的服务或向我们提供信息，请立即终止使用我们的服务并及时通知我们。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          八、联系我们
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          如您对本隐私政策有任何疑问、意见或建议，可通过以下方式与我们联系：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          客服邮箱：support@zhaobiao.com
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          客服电话：400-XXX-XXXX
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          我们将在15个工作日内回复您的请求。
        </ThemedText>

        <ThemedText variant="body" color={theme.textMuted} style={styles.updateTime}>
          最后更新日期：2024年1月1日
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
