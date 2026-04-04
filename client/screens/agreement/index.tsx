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

export default function AgreementScreen() {
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
        <Text style={styles.headerTitle}>用户协议</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          一、服务说明
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          本 APP 向用户免费提供各级政府采购、公共资源交易、央企及行业公开招标公告信息，信息均来源于官方公开渠道。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          VIP 会员收费仅针对商业项目分析、潜在客户挖掘、数据整理、精准推送等增值服务，不针对公开信息本身。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          二、信息来源与版权
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台展示的公开招标、采购、中标信息均来自政府及官方采购平台，属于依法公开信息。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台对信息进行原样展示、不篡改、不编造，每条信息均标注来源。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台对整理、聚合、分析、推送等增值服务成果享有合法权益。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          三、会员与付费
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          VIP 会员为增值服务，用户自愿购买。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          费用仅对应数据分析、商机挖掘、定制推送等服务，不含任何公开信息查阅费。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          订阅规则、自动续费与退款以支付页面及平台说明为准。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          四、用户义务
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          不得利用本 APP 信息从事违法违规、商业欺诈、恶意营销、骚扰他人等行为。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          不得批量爬取、倒卖平台展示的公开信息。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          五、免责声明
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台仅提供公开信息聚合展示与增值分析服务，不保证信息绝对实时、完整、无误，请以官方原文为准。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台不对用户依据信息作出的商业决策、投标行为承担任何法律责任。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          因网络故障、官方网站更新、第三方接口调整等导致服务异常，平台不承担赔偿责任。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台仅展示公开信息，不涉及涉密、内部、受限内容，用户不得违规获取非公开信息。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          六、协议修改
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          平台有权依法更新协议，更新后公布即生效，用户继续使用视为接受新版协议。
        </ThemedText>

        <ThemedText variant="body" color={theme.textMuted} style={styles.updateTime}>
          最后更新日期：2025年4月4日
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
