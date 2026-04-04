import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';
import { createStyles } from './styles';

interface User {
  id: number;
  phone: string;
  nickname: string;
  role: 'admin' | 'user';
  vip_level: number;
  vip_expire_at: string | null;
  points: number;
  avatar: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  admins: number;
  vips: number;
  todayNew: number;
}

const VIP_OPTIONS = [
  { value: 0, label: '普通用户' },
  { value: 1, label: '月度会员' },
  { value: 2, label: '年度会员' },
  { value: 999, label: '永久会员' },
];

export default function UserManageScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, vips: 0, todayNew: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/stats`, {
        headers: { 'x-user-id': String(currentUser?.id) },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchUsers = async (pageNum: number, isRefresh = false) => {
    if (!currentUser?.id) return;

    try {
      if (pageNum === 1) setLoading(true);

      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('pageSize', '20');
      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }
      if (keyword) {
        params.append('keyword', keyword);
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/admin/users?${params.toString()}`, {
        headers: { 'x-user-id': String(currentUser.id) },
      });
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1 || isRefresh) {
          setUsers(data.data.list);
        } else {
          setUsers((prev) => [...prev, ...data.data.list]);
        }
        setHasMore(data.data.page < data.data.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers(1);
  }, [filterRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchUsers(1, true);
  };

  const handleSearch = () => {
    fetchUsers(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(page + 1);
    }
  };

  const handleUpdateVip = async (vipLevel: number) => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${selectedUser.id}/vip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser?.id),
        },
        body: JSON.stringify({ vipLevel }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, vip_level: vipLevel, vip_expire_at: data.data.vip_expire_at }
              : u
          )
        );
        setVipModalVisible(false);
        setSelectedUser(null);
        fetchStats();
        Alert.alert('成功', '会员等级已更新');
      } else {
        Alert.alert('错误', data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新会员等级失败:', error);
      Alert.alert('错误', '更新失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (user: User, newRole: 'admin' | 'user') => {
    if (user.id === currentUser?.id) {
      Alert.alert('提示', '不能修改自己的角色');
      return;
    }

    const confirmMsg = newRole === 'admin' ? '设为管理员' : '取消管理员权限';
    
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`确定将 ${user.nickname} ${confirmMsg}？`);
      if (!confirmed) return;
    } else {
      return new Promise((resolve) => {
        Alert.alert(
          '确认操作',
          `确定将 ${user.nickname} ${confirmMsg}？`,
          [
            { text: '取消', style: 'cancel', onPress: () => resolve(false) },
            { text: '确定', onPress: () => resolve(true) },
          ]
        );
      }).then(async (confirmed) => {
        if (!confirmed) return;
        await executeRoleUpdate(user, newRole);
      });
    }
    
    await executeRoleUpdate(user, newRole);
  };

  const executeRoleUpdate = async (user: User, newRole: 'admin' | 'user') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser?.id),
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
        fetchStats();
        Alert.alert('成功', '角色已更新');
      } else {
        Alert.alert('错误', data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      Alert.alert('错误', '更新失败');
    }
  };

  const getVipLabel = (level: number) => {
    if (level === 999) return '永久';
    if (level === 2) return '年费';
    if (level === 1) return '月度';
    return '';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getAvatarStyle = (user: User) => {
    if (user.vip_level > 0) return styles.avatarVip;
    if (user.role === 'admin') return styles.avatarAdmin;
    return styles.avatar;
  };

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      const isCurrentUser = item.id === currentUser?.id;

      return (
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            {/* 头像 */}
            <View style={getAvatarStyle(item)}>
              <Text style={styles.avatarText}>
                {item.nickname?.charAt(0) || item.phone.slice(-2)}
              </Text>
            </View>

            {/* 用户信息 */}
            <View style={styles.userMain}>
              <View style={styles.userTopRow}>
                <Text style={styles.userNickname} numberOfLines={1} ellipsizeMode="tail">
                  {item.nickname || `用户${item.phone.slice(-4)}`}
                </Text>
                <View style={styles.badgesRow}>
                  {item.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>管理</Text>
                    </View>
                  )}
                  {item.vip_level > 0 && (
                    <View style={styles.vipBadge}>
                      <FontAwesome6 name="crown" size={8} color="#FFFFFF" />
                      <Text style={styles.vipBadgeText}>{getVipLabel(item.vip_level)}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.userMeta}>
                <Text style={styles.userPhone}>{item.phone}</Text>
                <Text style={styles.userDate}>{formatDate(item.created_at)}</Text>
              </View>
            </View>

            {/* 操作按钮 */}
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnVip]}
                onPress={() => {
                  setSelectedUser(item);
                  setVipModalVisible(true);
                }}
              >
                <FontAwesome6 name="crown" size={14} color="#D97706" />
              </TouchableOpacity>

              {!isCurrentUser && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    item.role === 'admin' ? styles.actionBtnRemove : styles.actionBtnAdmin,
                  ]}
                  onPress={() => handleUpdateRole(item, item.role === 'admin' ? 'user' : 'admin')}
                >
                  <FontAwesome6
                    name={item.role === 'admin' ? 'user-minus' : 'user-plus'}
                    size={14}
                    color={item.role === 'admin' ? '#DC2626' : '#2563EB'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    },
    [styles, currentUser]
  );

  // 非管理员显示无权限页面
  if (currentUser?.role !== 'admin') {
    return (
      <Screen backgroundColor="#F8FAFC">
        <View style={styles.noPermission}>
          <FontAwesome6 name="shield-halved" size={48} color="#CBD5E1" />
          <Text style={styles.noPermissionText}>无权限访问</Text>
          <Text style={styles.noPermissionHint}>仅管理员可查看用户管理</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#F8FAFC" safeAreaEdges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>用户管理</Text>
          </View>
          <Text style={styles.headerSubtitle}>管理系统用户和会员权限</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>总用户</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.vips}</Text>
            <Text style={styles.statLabel}>会员</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.admins}</Text>
            <Text style={styles.statLabel}>管理员</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.todayNew}</Text>
            <Text style={styles.statLabel}>今日新增</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'user', 'admin'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterTab, filterRole === role && styles.filterTabActive]}
              onPress={() => setFilterRole(role)}
            >
              <Text style={[styles.filterTabText, filterRole === role && styles.filterTabTextActive]}>
                {role === 'all' ? '全部' : role === 'admin' ? '管理员' : '普通'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" size={12} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索手机号/昵称"
            placeholderTextColor="#64748B"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        {/* User List */}
        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && page > 1 ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: Spacing.sm }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="users-slash" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>暂无用户数据</Text>
              </View>
            }
          />
        )}
      </View>

      {/* VIP Modal */}
      <Modal visible={vipModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>设置会员等级</Text>
              <TouchableOpacity onPress={() => setVipModalVisible(false)}>
                <FontAwesome6 name="xmark" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalUserInfo}>
                {selectedUser?.nickname} ({selectedUser?.phone})
              </Text>
              <Text style={styles.modalCurrentVip}>
                当前：{VIP_OPTIONS.find(o => o.value === selectedUser?.vip_level)?.label || '普通用户'}
              </Text>

              <View style={styles.vipOptions}>
                {VIP_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.vipOption,
                      selectedUser?.vip_level === option.value && styles.vipOptionActive,
                    ]}
                    onPress={() => handleUpdateVip(option.value)}
                    disabled={actionLoading}
                  >
                    <FontAwesome6
                      name={option.value === 0 ? 'user' : 'crown'}
                      size={16}
                      color={selectedUser?.vip_level === option.value ? '#FFFFFF' : '#F59E0B'}
                    />
                    <Text
                      style={[
                        styles.vipOptionText,
                        selectedUser?.vip_level === option.value && styles.vipOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {actionLoading && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
