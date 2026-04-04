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
import { useAuth } from '@/contexts/AuthContext';

type LoginMode = 'sms' | 'password';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [mode, setMode] = useState<LoginMode>('sms');
  const [account, setAccount] = useState(''); // 手机号或昵称
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState(''); // 错误提示

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 验证手机号格式
  const isPhoneValid = useMemo(() => {
    return /^1[3-9]\d{9}$/.test(account);
  }, [account]);

  // 验证昵称格式（密码登录时可以用昵称）
  const isNicknameValid = useMemo(() => {
    return account.length >= 2 && account.length <= 20;
  }, [account]);

  // 密码登录时，账号可以是手机号或昵称
  const isAccountValid = useMemo(() => {
    if (mode === 'sms') {
      return isPhoneValid;
    }
    return isPhoneValid || isNicknameValid;
  }, [mode, isPhoneValid, isNicknameValid]);

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
          body: JSON.stringify({ phone: account }),
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

  // 登录
  const handleLogin = async () => {
    if (!isAccountValid) {
      setErrorMessage(mode === 'sms' ? '请输入正确的手机号' : '请输入手机号或昵称');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('请先同意用户协议和隐私政策');
      return;
    }

    if (mode === 'sms' && !smsCode) {
      setErrorMessage('请输入验证码');
      return;
    }

    if (mode === 'password' && !password) {
      setErrorMessage('请输入密码');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const body: any = {};

      if (mode === 'sms') {
        body.phone = account;
        body.smsCode = smsCode;
      } else {
        // 密码登录支持手机号或昵称
        if (isPhoneValid) {
          body.phone = account;
        } else {
          body.nickname = account;
        }
        body.password = password;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();

      if (data.success) {
        await login(data.data);
        router.replace('/');
      } else {
        // 根据错误类型显示不同提示
        const errorMsg = data.message || '操作失败';
        if (errorMsg.includes('验证码')) {
          setErrorMessage('验证码错误或已过期，请重新获取');
        } else if (errorMsg.includes('密码')) {
          setErrorMessage('密码错误，请重试');
        } else if (errorMsg.includes('不存在') || errorMsg.includes('未注册')) {
          setErrorMessage('账号不存在，请先注册');
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      setErrorMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 微信登录
  const handleWechatLogin = () => {
    Alert.alert('微信登录', '微信登录功能开发中，敬请期待');
  };

  // 打开用户协议
  const openAgreement = () => {
    router.push('/agreement');
  };

  // 打开隐私政策
  const openPrivacy = () => {
    router.push('/privacy');
  };

  // 跳转注册页面
  const goToRegister = () => {
    router.push('/register');
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
              <Text style={styles.appName}>招采通</Text>
              <Text style={styles.appSlogan}>专业的招标采购信息聚合平台</Text>
            </View>

            {/* 登录方式切换 */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'sms' && styles.modeTabActive]}
                onPress={() => { setMode('sms'); setErrorMessage(''); }}
              >
                <Text style={[styles.modeTabText, mode === 'sms' && styles.modeTabTextActive]}>
                  短信登录
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'password' && styles.modeTabActive]}
                onPress={() => { setMode('password'); setErrorMessage(''); }}
              >
                <Text style={[styles.modeTabText, mode === 'password' && styles.modeTabTextActive]}>
                  密码登录
                </Text>
              </TouchableOpacity>
            </View>

            {/* 表单 */}
            <View style={styles.form}>
              {/* 手机号/账号 */}
              <View style={styles.inputGroup}>
                <FontAwesome6 
                  name={mode === 'sms' ? 'phone' : 'user'} 
                  size={18} 
                  color="#9CA3AF" 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'sms' ? '请输入手机号' : '请输入手机号或昵称'}
                  placeholderTextColor="#9CA3AF"
                  value={account}
                  onChangeText={setAccount}
                  keyboardType={mode === 'sms' ? 'phone-pad' : 'default'}
                  maxLength={mode === 'sms' ? 11 : 20}
                />
                {account.length > 0 && (
                  <TouchableOpacity onPress={() => setAccount('')}>
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
              {mode === 'password' && (
                <View style={styles.inputGroup}>
                  <FontAwesome6 name="lock" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入密码"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    maxLength={20}
                  />
                </View>
              )}

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

              {/* 登录按钮 */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>登录</Text>
                )}
              </TouchableOpacity>

              {/* 注册链接 */}
              <TouchableOpacity
                style={styles.registerLink}
                onPress={goToRegister}
              >
                <Text style={styles.registerLinkText}>
                  还没有账号？<Text style={styles.registerLinkHighlight}>立即注册</Text>
                </Text>
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
