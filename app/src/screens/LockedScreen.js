import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../auth';
import { C } from '../theme';
import { WEBSITE_URL } from '../config';

export default function LockedScreen() {
  const { user, logout, refresh } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 60 }}>🔒</Text>
      <Text style={{ color: C.white, fontSize: 26, fontWeight: '900', marginTop: 16, textAlign: 'center' }}>Membership Required</Text>
      <Text style={{ color: C.greyLight, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
        Hi {user?.name || user?.email}. Your account has no active membership. Purchase one to unlock classes, videos and diet plans.
      </Text>
      <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(WEBSITE_URL + '/memberships')}
        style={{ backgroundColor: C.red, padding: 16, borderRadius: 4, marginTop: 24, width: '100%', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>BUY MEMBERSHIP</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={refresh} style={{ padding: 14, marginTop: 8 }}>
        <Text style={{ color: C.greyLight }}>I already paid — refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout} style={{ padding: 10 }}>
        <Text style={{ color: C.red }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
