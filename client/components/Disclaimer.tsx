/**
 * 免责声明组件
 * 用于详情页底部和关于页面
 */
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

interface DisclaimerProps {
  /** 显示模式：compact（紧凑，用于详情页底部）或 full（完整，用于关于页面） */
  mode?: 'compact' | 'full';
  /** 信息来源 */
  source?: string | null;
}

export function Disclaimer({ mode = 'compact', source }: DisclaimerProps) {
  const { theme } = useTheme();

  const styles = useMemo(() => ({
    container: {
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: theme.textMuted,
      marginBottom: 4,
    },
    text: {
      fontSize: 10,
      color: theme.textMuted,
      lineHeight: 16,
      marginBottom: 2,
    },
    sourceText: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 4,
      fontStyle: 'italic' as const,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.xs,
    },
  }), [theme, source]);

  if (mode === 'compact') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>版权与免责声明</Text>
        <Text style={styles.text}>• 信息来源于官方公开渠道，仅供参考，请以官方原文为准</Text>
        <Text style={styles.text}>• 平台原样展示，不篡改、不伪造，不对信息真实性承担担保责任</Text>
        {source && (
          <Text style={styles.sourceText}>信息来源：{source}</Text>
        )}
      </View>
    );
  }

  // full mode - 用于关于页面
  return (
    <View style={styles.container}>
      <Text style={styles.title}>版权与免责声明</Text>
      <View style={styles.divider} />
      <Text style={styles.text}>本平台免费展示政府采购、公共资源交易、央企及行业公开招标信息，信息均来源于官方公开渠道。</Text>
      <Text style={styles.text}>所有公开信息不收取任何费用，VIP 会员仅针对增值分析服务收费。</Text>
      <Text style={styles.text}>信息仅供参考，不构成投标、决策依据，请以官方发布原文为准。</Text>
      <Text style={styles.text}>平台对信息原样展示，不篡改、不伪造、不进行演绎性编辑。</Text>
      <Text style={styles.text}>转载或引用本平台内容请注明来源，禁止倒卖、非法传播。</Text>
      <Text style={styles.text}>如有侵权或信息错误，请联系平台核实处理。</Text>
      {source && (
        <Text style={styles.sourceText}>信息来源示例：{source}</Text>
      )}
    </View>
  );
}
