import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import PostListScreen from './src/screens/PostListScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import PostCreateScreen from './src/screens/PostCreateScreen';

const Stack = createNativeStackNavigator();

function TopStatusBarBackground({ color }: { color: string }) {
  const insets = useSafeAreaInsets();
  // iOS: insets.top이 상태바 높이. Android: translucent=false면 0이지만 overlay여도 무해.
  return <View style={{ height: insets.top, backgroundColor: color }} />;
}

export default function App() {
  // 원하는 조합으로 색 변경
  const barBg = '#000000'; // 검은 배경
  const barStyle: 'light' | 'dark' | 'auto' = 'light'; // 흰 아이콘

  return (
    <SafeAreaProvider>
      {/* 아이콘/텍스트 색 */}
      <StatusBar style={barStyle} translucent={false} />
      {/* 상태바 영역 배경 오버레이 (iOS에서 특히 중요) */}
      <TopStatusBarBackground color={barBg} />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Posts" component={PostListScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="PostCreate" component={PostCreateScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
