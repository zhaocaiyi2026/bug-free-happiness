/**
 * 实时数据刷新 Hook
 * 
 * 功能：
 * 1. 定时轮询 sync_status 检测新数据
 * 2. 返回是否有新数据的状态
 * 3. 提供刷新回调
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '@/constants/api';

interface SyncStatus {
  provider: string;
  province: string;
  total_count: number;
  synced_count: number;
  status: string;
  last_sync_time: string;
  last_sync_id: number;
  message: string;
}

interface UseRealtimeDataOptions {
  /** 轮询间隔（毫秒），默认 30000 (30秒) */
  interval?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 检测到新数据时的回调 */
  onNewData?: (status: SyncStatus) => void;
}

interface UseRealtimeDataReturn {
  /** 是否有新数据 */
  hasNewData: boolean;
  /** 当前同步状态 */
  syncStatus: SyncStatus | null;
  /** 是否正在检测 */
  isChecking: boolean;
  /** 最后检测时间 */
  lastCheckTime: Date | null;
  /** 手动刷新（会重置 hasNewData） */
  refresh: () => void;
  /** 手动检测 */
  checkNow: () => Promise<void>;
  /** 标记已读（重置 hasNewData） */
  markAsRead: () => void;
}

/**
 * 实时数据刷新 Hook
 */
export function useRealtimeData(options: UseRealtimeDataOptions = {}): UseRealtimeDataReturn {
  const {
    interval = 30000, // 默认 30 秒
    enabled = true,
    onNewData,
  } = options;

  const [hasNewData, setHasNewData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // 记录上次的 last_sync_id 和 last_sync_time
  const lastSyncIdRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<string | null>(null);
  
  // App 状态（前台/后台）
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 检测新数据
   */
  const checkForNewData = useCallback(async () => {
    try {
      setIsChecking(true);

      /**
       * 服务端文件：server/src/routes/sync-status.ts
       * 接口：GET /api/v1/sync-status/province/:name
       * Path 参数：name: string (省份名称)
       */
      const response = await fetch(`${API_BASE_URL}/sync-status/province/吉林省`);
      
      if (!response.ok) {
        console.log('[实时检测] 获取状态失败');
        return;
      }

      const result = await response.json();
      
      if (!result.success || !result.exists) {
        console.log('[实时检测] 无同步状态记录');
        return;
      }

      const status: SyncStatus = result.data;
      setSyncStatus(status);
      setLastCheckTime(new Date());

      // 首次检测，记录当前状态
      if (lastSyncIdRef.current === null) {
        lastSyncIdRef.current = status.last_sync_id;
        lastSyncTimeRef.current = status.last_sync_time;
        console.log(`[实时检测] 初始化: last_sync_id=${status.last_sync_id}`);
        return;
      }

      // 检测是否有新数据
      const hasNewId = status.last_sync_id > lastSyncIdRef.current;
      const hasNewTime = status.last_sync_time !== lastSyncTimeRef.current;

      if (hasNewId || hasNewTime) {
        console.log(`[实时检测] 发现新数据! ID: ${lastSyncIdRef.current} → ${status.last_sync_id}`);
        
        setHasNewData(true);
        lastSyncIdRef.current = status.last_sync_id;
        lastSyncTimeRef.current = status.last_sync_time;

        // 触发回调
        if (onNewData) {
          onNewData(status);
        }
      } else {
        console.log(`[实时检测] 无新数据 (last_sync_id=${status.last_sync_id})`);
      }

    } catch (error) {
      console.error('[实时检测] 检测异常:', error);
    } finally {
      setIsChecking(false);
    }
  }, [onNewData]);

  /**
   * 标记已读
   */
  const markAsRead = useCallback(() => {
    setHasNewData(false);
  }, []);

  /**
   * 刷新（标记已读并重新检测）
   */
  const refresh = useCallback(() => {
    setHasNewData(false);
    checkForNewData();
  }, [checkForNewData]);

  /**
   * 启动/停止轮询
   */
  useEffect(() => {
    if (!enabled) {
      // 清理定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // App 状态变化监听
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // 从后台切换到前台时，立即检测一次
        console.log('[实时检测] 回到前台，立即检测');
        checkForNewData();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 首次立即检测
    checkForNewData();

    // 启动定时轮询
    intervalRef.current = setInterval(() => {
      // 只有在前台时才轮询
      if (appStateRef.current === 'active') {
        checkForNewData();
      }
    }, interval);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, checkForNewData]);

  return {
    hasNewData,
    syncStatus,
    isChecking,
    lastCheckTime,
    refresh,
    checkNow: checkForNewData,
    markAsRead,
  };
}
