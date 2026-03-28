import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

type LoginMode = 'sms' | 'password' | 'register';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [mode, setMode] = useState<LoginMode>('sms');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const passwordRef = useRef<TextInput>(null);
  const smsCodeRef = useRef<TextInput>(null);

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
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (countdown > 0) return;

    try {
      // 调用发送验证码API
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/send-sms`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        }
      );
      const data = await res.json();

      if (data.success) {
        // 开发环境：后端会返回验证码，方便测试
        if (data.code) {
          Alert.alert('验证码已发送', `【开发模式】验证码: ${data.code}\n\n正式环境验证码将发送到手机`);
          setSmsCode(data.code); // 自动填充验证码
        } else {
          Alert.alert('成功', '验证码已发送到您的手机');
        }
        setCountdown(60);
      } else {
        Alert.alert('发送失败', data.message || '请稍后重试');
      }
    } catch (error) {
      Alert.alert('网络错误', '请检查网络连接后重试');
    }
  };

  // 登录/注册
  const handleSubmit = async () => {
    if (!isPhoneValid) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('提示', '请先同意用户协议和隐私政策');
      return;
    }

    if (mode === 'sms' && !smsCode) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    if (mode === 'password' && !password) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    if (mode === 'register') {
      if (!password) {
        Alert.alert('提示', '请设置密码');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('提示', '两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        Alert.alert('提示', '密码至少6位');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const body: any = { phone };

      if (mode === 'sms') {
        body.smsCode = smsCode;
      } else {
        body.password = password;
      }

      if (mode === 'register' && nickname) {
        body.nickname = nickname;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();

      if (data.success) {
        // 使用 auth context 保存用户信息
        await login(data.data);
        // 直接跳转到首页，不显示弹窗
        router.replace('/');
      } else {
        Alert.alert('失败', data.message || '操作失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      Alert.alert('失败', '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 微信登录
  const handleWechatLogin = () => {
    Alert.alert('微信登录', '微信登录功能开发中，敬请期待');
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
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing['2xl'] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <FontAwesome6 name="gavel" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>招标通</Text>
              <Text style={styles.appSlogan}>专业的招标信息聚合平台</Text>
            </View>

            {/* 登录方式切换 */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'sms' && styles.modeTabActive]}
                onPress={() => setMode('sms')}
              >
                <Text style={[styles.modeTabText, mode === 'sms' && styles.modeTabTextActive]}>
                  短信登录
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'password' && styles.modeTabActive]}
                onPress={() => setMode('password')}
              >
                <Text style={[styles.modeTabText, mode === 'password' && styles.modeTabTextActive]}>
                  密码登录
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                  注册账号
                </Text>
              </TouchableOpacity>
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

              {/* 短信验证码 */}
              {mode === 'sms' && (
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
              )}

              {/* 密码 */}
              {(mode === 'password' || mode === 'register') && (
                <View style={styles.inputGroup}>
                  <FontAwesome6 name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={mode === 'register' ? '请设置密码（至少6位）' : '请输入密码'}
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    maxLength={20}
                  />
                </View>
              )}

              {/* 确认密码 */}
              {mode === 'register' && (
                <>
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
                </>
              )}

              {/* 协议 */}
              <TouchableOpacity style={styles.agreement} onPress={() => setAgreeTerms(!agreeTerms)}>
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <FontAwesome6 name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={styles.agreementText}>
                  我已阅读并同意
                  <Text style={styles.agreementLink}>《用户协议》</Text>
                  和
                  <Text style={styles.agreementLink}>《隐私政策》</Text>
                </Text>
              </TouchableOpacity>

              {/* 登录按钮 */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'register' ? '注册' : '登录'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 分割线 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>其他登录方式</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 微信登录 */}
            <TouchableOpacity style={styles.wechatButton} onPress={handleWechatLogin}>
              <FontAwesome6 name="comments" size={22} color="#07C160" />
              <Text style={styles.wechatButtonText}>微信登录</Text>
            </TouchableOpacity>

            {/* 底部提示 */}
            <Text style={styles.bottomTip}>
              登录即表示同意相关条款，未注册的手机号将自动创建账号
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}
