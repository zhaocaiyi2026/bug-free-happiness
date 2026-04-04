/**
 * 免责声明组件
 * 用于详情页底部和关于页面
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (mode === 'compact') {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>版权与免责声明</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.contentWrap}>
          <Text style={styles.bulletText}>• 信息来源于官方公开渠道，仅供参考，请以官方原文为准</Text>
          <Text style={styles.bulletText}>• 平台原样展示，不篡改、不伪造，不对信息真实性承担担保责任</Text>
        </View>
        {source && (
          <View style={styles.sourceWrap}>
            <Text style={styles.sourceLabel}>信息来源：</Text>
            <Text style={styles.sourceText}>{source}</Text>
          </View>
        )}
      </View>
    );
  }

  // full mode - 用于关于页面
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.title}>版权与免责声明</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.contentWrap}>
        <Text style={styles.bulletText}>本平台免费展示政府采购、公共资源交易、央企及行业公开招标信息，信息均来源于官方公开渠道。</Text>
        <Text style={styles.bulletText}>所有公开信息不收取任何费用，VIP 会员仅针对增值分析服务收费。</Text>
        <Text style={styles.bulletText}>信息仅供参考，不构成投标、决策依据，请以官方发布原文为准。</Text>
        <Text style={styles.bulletText}>平台对信息原样展示，不篡改、不伪造、不进行演绎性编辑。</Text>
        <Text style={styles.bulletText}>转载或引用本平台内容请注明来源，禁止倒卖、非法传播。</Text>
        <Text style={styles.bulletText}>如有侵权或信息错误，请联系平台核实处理。</Text>
      </View>
      {source && (
        <View style={styles.sourceWrap}>
          <Text style={styles.sourceLabel}>信息来源示例：</Text>
          <Text style={styles.sourceText}>{source}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#FFF8E1', // 淡黄色背景，更醒目
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#FFD54F', // 金色边框
      borderLeftWidth: 4, // 左侧加粗边框
      borderLeftColor: '#FF9800', // 橙色左边框
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    iconWrap: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FF9800',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.xs,
    },
    iconText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: 'bold',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#E65100', // 深橙色标题
    },
    divider: {
      height: 1,
      backgroundColor: '#FFE082',
      marginBottom: Spacing.sm,
    },
    contentWrap: {
      gap: 6,
    },
    bulletText: {
      fontSize: 12,
      color: '#5D4037', // 深棕色文字，清晰可读
      lineHeight: 18,
    },
    sourceWrap: {
      flexDirection: 'row',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#FFE082',
    },
    sourceLabel: {
      fontSize: 12,
      color: '#8D6E63',
      fontWeight: '500',
    },
    sourceText: {
      fontSize: 12,
      color: '#5D4037',
      flex: 1,
    },
  });
