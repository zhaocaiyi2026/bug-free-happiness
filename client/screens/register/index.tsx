import { API_BASE_URL } from '@/constants/api';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 验证手机号格式
  const isPhoneValid = useMemo(() => {
    return /^1[3-9]\d{9}$/.test(phone);
  }, [phone]);

  // 发送验证码
  const handleSendSms = async () => {
    if (!isPhoneValid) {
      setErrorMessage('请输入正确的手机号');
      return;
    }

    if (countdown > 0) return;

    setErrorMessage('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/send-sms`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        }
      );
      const data = await res.json();

      if (data.success) {
        if (data.code) {
          Alert.alert('验证码已发送', `【开发模式】验证码: ${data.code}\n\n正式环境验证码将发送到手机`);
          setSmsCode(data.code);
        } else {
          Alert.alert('成功', '验证码已发送到您的手机');
        }
        setCountdown(60);
      } else {
        setErrorMessage(data.message || '发送失败，请稍后重试');
      }
    } catch (error) {
      setErrorMessage('网络错误，请检查网络连接');
    }
  };

  // 注册
  const handleRegister = async () => {
    if (!isPhoneValid) {
      setErrorMessage('请输入正确的手机号');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('请先同意用户协议和隐私政策');
      return;
    }

    if (!password) {
      setErrorMessage('请设置密码');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            password,
            nickname: nickname || `用户${phone.slice(-4)}`,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        Alert.alert('注册成功', '您的账号已创建成功，请登录', [
          {
            text: '去登录',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const errorMsg = data.message || '注册失败';
        if (errorMsg.includes('已注册')) {
          setErrorMessage('该手机号已注册，请直接登录');
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error('注册失败:', error);
      setErrorMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开用户协议
  const openAgreement = () => {
    router.push('/agreement');
  };

  // 打开隐私政策
  const openPrivacy = () => {
    router.push('/privacy');
  };

  return (
    <Screen backgroundColor="#FFFFFF" statusBarStyle="dark">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={Platform.OS === 'web'}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 返回按钮和标题 */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <FontAwesome6 name="arrow-left" size={18} color="#1C1917" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>注册账号</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <FontAwesome6 name="gavel" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>招标通</Text>
              <Text style={styles.appSlogan}>创建账号，开启专业招标服务</Text>
            </View>

            {/* 表单 */}
            <View style={styles.form}>
              {/* 手机号 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 name="phone" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
                {phone.length > 0 && (
                  <TouchableOpacity onPress={() => setPhone('')}>
                    <FontAwesome6 name="circle-xmark" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 验证码 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 name="envelope" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入验证码"
                  placeholderTextColor="#9CA3AF"
                  value={smsCode}
                  onChangeText={setSmsCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.smsButton, (!isPhoneValid || countdown > 0) && styles.smsButtonDisabled]}
                  onPress={handleSendSms}
                  disabled={!isPhoneValid || countdown > 0}
                >
                  <Text style={[styles.smsButtonText, (!isPhoneValid || countdown > 0) && styles.smsButtonTextDisabled]}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 密码 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请设置密码（至少6位）"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  maxLength={20}
                />
              </View>

              {/* 确认密码 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  maxLength={20}
                />
              </View>

              {/* 昵称 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 name="user" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="请输入昵称（选填）"
                  placeholderTextColor="#9CA3AF"
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={20}
                />
              </View>

              {/* 错误提示 */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <FontAwesome6 name="circle-exclamation" size={14} color="#C8102E" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 协议 */}
              <TouchableOpacity style={styles.agreement} onPress={() => setAgreeTerms(!agreeTerms)}>
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <FontAwesome6 name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={styles.agreementText}>
                  我已阅读并同意
                  <Text style={styles.agreementLink} onPress={openAgreement}>《用户协议》</Text>
                  和
                  <Text style={styles.agreementLink} onPress={openPrivacy}>《隐私政策》</Text>
                </Text>
              </TouchableOpacity>

              {/* 注册按钮 */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>注册</Text>
                )}
              </TouchableOpacity>

              {/* 登录链接 */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.back()}
              >
                <Text style={styles.loginLinkText}>
                  已有账号？<Text style={styles.loginLinkHighlight}>返回登录</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}
