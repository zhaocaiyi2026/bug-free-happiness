import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

import AllBidsTab from './tabs/AllBidsTab';
import ProvinceBidsTab from './tabs/ProvinceBidsTab';
import CityBidsTab from './tabs/CityBidsTab';
import FollowBidsTab from './tabs/FollowBidsTab';

const layout = Dimensions.get('window');

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'all', title: '全部' },
    { key: 'province', title: '本省' },
    { key: 'city', title: '本市' },
    { key: 'follow', title: '关注' },
  ]);

  const renderScene = SceneMap({
    all: AllBidsTab,
    province: ProvinceBidsTab,
    city: CityBidsTab,
    follow: FollowBidsTab,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={{
        backgroundColor: '#000000',
        elevation: 0,
        shadowOpacity: 0,
      }}
      indicatorStyle={{
        backgroundColor: '#C8102E',
        height: 3,
      }}
      tabStyle={{
        width: 'auto',
        paddingHorizontal: Spacing.lg,
      }}
      labelStyle={{
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'none',
        letterSpacing: 1,
      }}
      activeColor="#FFFFFF"
      inactiveColor="#8C8C8C"
      scrollEnabled={false}
    />
  );

  const handleSearchPress = () => {
    router.navigate('/search');
  };

  return (
    <Screen backgroundColor="#FAF9F6" statusBarStyle="light">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>招标信息</Text>
              <Text style={styles.headerSubtitle}>TENDER INFO</Text>
            </View>
            <TouchableOpacity onPress={() => router.navigate('/profile')}>
              <FontAwesome6 name="user" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <FontAwesome6 name="magnifying-glass" size={18} color="#8C8C8C" />
            <Text style={styles.searchButtonText}>搜索招标信息...</Text>
          </TouchableOpacity>
        </View>

        {/* TabView */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          lazy
          style={{ backgroundColor: '#FAF9F6' }}
        />
      </View>
    </Screen>
  );
}
