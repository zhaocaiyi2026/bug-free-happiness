import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

import AllBidsTab from './tabs/AllBidsTab';
import ProvinceBidsTab from './tabs/ProvinceBidsTab';
import CityBidsTab from './tabs/CityBidsTab';
import FollowBidsTab from './tabs/FollowBidsTab';

const layout = Dimensions.get('window');

export default function HomeScreen() {
  const { theme } = useTheme();
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
      style={styles.tabBar}
      indicatorStyle={styles.tabIndicator}
      tabStyle={{ width: 'auto', paddingHorizontal: Spacing.lg }}
      labelStyle={{
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'none',
      }}
      activeColor="#2563EB"
      inactiveColor="#9CA3AF"
      scrollEnabled={false}
    />
  );

  const handleSearchPress = () => {
    router.navigate('/search');
  };

  const handleFavoritePress = () => {
    router.navigate('/favorites');
  };

  return (
    <Screen backgroundColor="#F5F5F5" statusBarStyle="dark">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerTop}>
            {/* 应用名称 */}
            <Text style={styles.appTitle}>招标通</Text>
            {/* 右侧操作区 */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
                <FontAwesome6 name="magnifying-glass" size={18} color="#1C1917" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavoritePress}>
                <FontAwesome6 name="heart" size={18} color="#C8102E" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* TabView */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          lazy
          style={{ backgroundColor: '#F5F5F5' }}
        />
      </View>
    </Screen>
  );
}
