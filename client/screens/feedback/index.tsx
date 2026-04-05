import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const FEEDBACK_TYPES = [
  { key: 'bug', label: 'Bug反馈', icon: 'bug' },
  { key: 'feature', label: '功能建议', icon: 'lightbulb' },
  { key: 'complaint', label: '投诉', icon: 'face-frown' },
  { key: 'praise', label: '表扬', icon: 'face-smile' },
  { key: 'other', label: '其他', icon: 'ellipsis' },
];

export default function FeedbackScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [feedbackType, setFeedbackType] = useState<string>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    setSubmitting(true);
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('提交成功', '感谢您的反馈，我们会尽快处理！', [
        {
          text: '好的',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>意见反馈</Text>
              <View style={{ width: 36 }} />
            </View>
          </View>

          <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 反馈类型 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>反馈类型</Text>
              <View style={styles.typeGrid}>
                {FEEDBACK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeItem, feedbackType === type.key && styles.typeItemActive]}
                    onPress={() => setFeedbackType(type.key)}
                  >
                    <FontAwesome6
                      name={type.icon}
                      size={20}
                      color={feedbackType === type.key ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text style={[styles.typeText, feedbackType === type.key && styles.typeTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 反馈内容 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>反馈内容</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请详细描述您的问题或建议，帮助我们更好地改进..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{content.length}/500</Text>
            </View>

            {/* 联系方式 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>联系方式（选填）</Text>
              <TextInput
                style={styles.contactInput}
                placeholder="手机号或邮箱，方便我们回复您"
                placeholderTextColor="#9CA3AF"
                value={contact}
                onChangeText={setContact}
              />
            </View>

            {/* 提示 */}
            <View style={styles.tipCard}>
              <FontAwesome6 name="circle-info" size={16} color="#2563EB" />
              <Text style={styles.tipText}>
                我们会在1-3个工作日内处理您的反馈，如需快速响应请拨打客服热线：400-888-8888
              </Text>
            </View>

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? '提交中...' : '提交反馈'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
