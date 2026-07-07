import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/auth';
import { ensurePermission } from './src/notify';
import { C } from './src/theme';
import { ToastHost } from './src/toast';

import LoginScreen from './src/screens/LoginScreen';
import LockedScreen from './src/screens/LockedScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import VideosScreen from './src/screens/VideosScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import DietScreen from './src/screens/DietScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.bg, card: C.ink, text: C.white, border: C.line, primary: C.red },
};
const screenOpts = {
  headerStyle: { backgroundColor: C.ink }, headerTintColor: C.white,
  headerTitleStyle: { fontWeight: '800', letterSpacing: 1 }, contentStyle: { backgroundColor: C.bg },
};

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const VideoStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={screenOpts}>
      <HomeStack.Screen name="718 MMA" component={HomeScreen} />
      <HomeStack.Screen name="Events" component={EventsScreen} />
    </HomeStack.Navigator>
  );
}
function VideoStackNav() {
  return (
    <VideoStack.Navigator screenOptions={screenOpts}>
      <VideoStack.Screen name="Video Library" component={VideosScreen} />
      <VideoStack.Screen name="Player" component={VideoPlayerScreen} />
    </VideoStack.Navigator>
  );
}
const ic = (e) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{e}</Text>;

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false, tabBarStyle: { backgroundColor: C.ink, borderTopColor: C.line, height: 60, paddingBottom: 8, paddingTop: 6 },
      tabBarActiveTintColor: C.red, tabBarInactiveTintColor: C.grey, tabBarLabelStyle: { fontSize: 11, letterSpacing: 1 },
    }}>
      <Tab.Screen name="Home" component={HomeStackNav} options={{ tabBarIcon: ic('🏠') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: ic('🗓️') }} />
      <Tab.Screen name="Videos" component={VideoStackNav} options={{ tabBarIcon: ic('🎬') }} />
      <Tab.Screen name="Diet" component={DietScreen} options={{ tabBarIcon: ic('🥗') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ic('👤') }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, user, membership } = useAuth();
  useEffect(() => { ensurePermission(); }, []);
  // (RootStack defined at module scope)
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.white, fontSize: 44, fontWeight: '900', fontStyle: 'italic' }}>7<Text style={{ color: C.red }}>18</Text></Text>
        <ActivityIndicator color={C.red} style={{ marginTop: 16 }} />
      </View>
    );
  }
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Login" component={LoginScreen} />
      ) : !membership ? (
        <RootStack.Screen name="Locked" component={LockedScreen} />
      ) : (
        <RootStack.Screen name="Main" component={Tabs} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Root />
        <ToastHost />
      </NavigationContainer>
    </AuthProvider>
  );
}
