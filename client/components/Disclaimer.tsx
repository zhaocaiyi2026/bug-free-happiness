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
}

export function Disclaimer({ mode = 'compact' }: DisclaimerProps) {
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
        <View style={styles.contentWrap}>
          <Text style={styles.bulletText}>• 信息来源于官方公开渠道，仅供参考，请以官方原文为准</Text>
          <Text style={styles.bulletText}>• 平台原样展示，不篡改、不伪造，不对信息真实性承担担保责任</Text>
        </View>
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
      <View style={styles.contentWrap}>
        <Text style={styles.bulletText}>本平台免费展示政府采购、公共资源交易、央企及行业公开招标信息，信息均来源于官方公开渠道。</Text>
        <Text style={styles.bulletText}>所有公开信息不收取任何费用，VIP 会员仅针对增值分析服务收费。</Text>
        <Text style={styles.bulletText}>信息仅供参考，不构成投标、决策依据，请以官方发布原文为准。</Text>
        <Text style={styles.bulletText}>平台对信息原样展示，不篡改、不伪造、不进行演绎性编辑。</Text>
        <Text style={styles.bulletText}>转载或引用本平台内容请注明来源，禁止倒卖、非法传播。</Text>
        <Text style={styles.bulletText}>如有侵权或信息错误，请联系平台核实处理。</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    iconWrap: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.xs,
    },
    iconText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
    },
    contentWrap: {
      gap: 6,
    },
    bulletText: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 20,
    },
  });
