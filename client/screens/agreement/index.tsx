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
          一、服务条款的确认和接纳
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.1 招标通的各项服务的所有权和运营权归招标通平台所有。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.2 用户在使用招标通提供的各项服务之前，应仔细阅读本服务协议。用户一旦注册使用招标通的服务，即视为用户已了解并完全同意本服务协议各项内容。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          1.3 招标通有权在必要时修改本服务协议条款，用户若不同意修改后的条款，可以选择停止使用本服务。用户继续使用本服务，则视为已接受修改后的协议条款。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          二、用户注册
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.1 用户注册成功后，招标通将给予每个用户一个用户账号及相应的密码，该用户账号和密码由用户负责保管；用户应当对以其用户账号进行的所有活动和事件负法律责任。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.2 用户须对在招标通注册时所提供的个人资料的真实性、合法性负责，并对由此产生的后果负责。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          2.3 用户不应将其账号、密码转让、出售或出借予他人使用，若用户授权他人使用账户，应对被授权人在该账户下实施所有行为负全部责任。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          三、使用规则
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          3.1 用户在使用招标通服务过程中，必须遵循以下原则：
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （1）遵守中国有关的法律和法规；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （2）不得为任何非法目的而使用网络服务系统；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （3）遵守所有与网络服务有关的网络协议、规定和程序；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （4）不得利用招标通服务进行任何可能对互联网正常运转造成不利影响的行为；
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          （5）不得利用招标通服务传输任何骚扰性的、中伤他人的、辱骂性的、恐吓性的、庸俗淫秽的或其他任何非法的信息资料。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          四、服务内容
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          4.1 招标通为用户提供招标信息聚合、搜索、筛选、收藏等服务。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          4.2 招标通提供的招标信息来源于公开渠道，仅供参考，不构成任何投资建议或决策依据。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          4.3 VIP会员服务：用户可通过付费开通VIP会员，享受更多高级功能和服务。VIP服务的具体内容和价格以平台公示为准。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          五、免责声明
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.1 用户明确同意其使用招标通网络服务所存在的风险将完全由其自己承担。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.2 招标通不保证网络服务一定能满足用户的要求，也不保证网络服务不会中断，对网络服务的及时性、安全性、准确性也都不作保证。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          5.3 招标通不保证为向用户提供便利而设置的外部链接的准确性和完整性，同时，对于该等外部链接指向的不由招标通实际控制的任何网页上的内容，招标通不承担任何责任。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          六、知识产权
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          6.1 招标通平台的所有内容，包括但不限于文字、图片、音频、视频、软件、程序、版面设计等的知识产权归招标通所有。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          6.2 未经招标通书面许可，任何人不得擅自复制、转载、链接、传播或用于其他商业用途。
        </ThemedText>

        <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
          七、协议修改
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          7.1 招标通有权随时修改本协议的任何条款，一旦本协议的内容发生变动，招标通将会在平台上公布修改之后的协议内容。
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={styles.paragraph}>
          7.2 如果不同意招标通对本协议相关条款所做的修改，用户有权停止使用网络服务。如果用户继续使用网络服务，则视为用户接受招标通对本协议相关条款所做的修改。
        </ThemedText>

        <ThemedText variant="body" color={theme.textMuted} style={styles.updateTime}>
          最后更新日期：2024年1月1日
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
