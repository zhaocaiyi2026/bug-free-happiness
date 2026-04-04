/**
 * 新数据提示组件
 * 
 * 当检测到新数据时，显示一个浮动提示条
 * 点击后刷新列表
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

interface NewDataAlertProps {
  /** 是否显示 */
  visible: boolean;
  /** 新数据数量（可选） */
  count?: number;
  /** 点击回调 */
  onPress: () => void;
  /** 关闭回调（可选） */
  onClose?: () => void;
  /** 自动消失时间（毫秒），0 表示不自动消失 */
  autoHideDuration?: number;
}

export function NewDataAlert({
  visible,
  count,
  onPress,
  onClose,
  autoHideDuration = 10000,
}: NewDataAlertProps) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100));
  const opacity = useRef(new Animated.Value(0));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 显示/隐藏动画
  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 自动隐藏
      if (autoHideDuration > 0) {
        timerRef.current = setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, autoHideDuration);
      }
    } else {
      // 隐藏动画
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, autoHideDuration, translateY, opacity, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.primary,
          transform: [{ translateY: translateY.current }],
          opacity: opacity.current,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <FontAwesome6 name="bolt" size={16} color="#FFFFFF" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            有新数据啦！
          </Text>
          {count !== undefined && count > 0 && (
            <Text style={styles.subtitle}>
              新增 {count} 条招标信息
            </Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>点击刷新</Text>
          <FontAwesome6 name="chevron-right" size={12} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: Spacing.xs,
    fontWeight: '500',
  },
});
