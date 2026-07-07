import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../auth';
import { api, inr } from '../api';
import { C } from '../theme';
import { WEBSITE_URL } from '../config';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, membership, logout, refresh } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { const r = await api.get('/api/me/payments'); if (r.ok) setReceipts(r.data); }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); await refresh(); setRefreshing(false); };

  const expires = membership ? new Date(membership.expires_at) : null;
  const daysLeft = expires ? Math.max(0, Math.ceil((expires - new Date()) / 86400000)) : 0;
  const expiringSoon = daysLeft <= 7;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
      <Text style={{ color: C.white, fontSize: 24, fontWeight: '900' }}>{user?.name || 'Member'}</Text>
      <Text style={{ color: C.grey, marginBottom: 16 }}>{user?.email}</Text>

      <View style={{ backgroundColor: C.ink2, borderTopColor: C.red, borderTopWidth: 3, padding: 18, borderRadius: 8 }}>
        <Text style={{ color: C.red, letterSpacing: 2, fontSize: 12, fontWeight: '700' }}>MEMBERSHIP</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{membership?.plan || '—'}</Text>
        <Text style={{ color: expiringSoon ? '#ffb400' : C.greyLight, marginTop: 4 }}>
          {expires ? `Active until ${expires.toDateString()} (${daysLeft} days)` : 'No active plan'}
        </Text>
        {expiringSoon && <Text style={{ color: '#ffb400', marginTop: 6 }}>⏳ Your membership is expiring soon — renew to keep access.</Text>}
        <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(WEBSITE_URL + '/memberships')}
          style={{ backgroundColor: C.red, padding: 14, borderRadius: 4, marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>RENEW (UPI / CARD)</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: C.red, letterSpacing: 2, fontSize: 12, fontWeight: '700', marginTop: 22, marginBottom: 8 }}>PAYMENT RECEIPTS</Text>
      {receipts.length === 0 && <Text style={{ color: C.grey }}>No payments yet.</Text>}
      {receipts.map((r, i) => (
        <View key={i} style={{ backgroundColor: C.ink2, padding: 14, borderRadius: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: C.white, fontWeight: '700' }}>{r.plan || 'Membership'}</Text>
            <Text style={{ color: C.grey, fontSize: 12 }}>{(r.created_at || '').slice(0, 10)} · {r.razorpay_payment_id || '—'}</Text>
          </View>
          <Text style={{ color: C.green, fontWeight: '800' }}>{inr(r.amount)}</Text>
        </View>
      ))}

      <TouchableOpacity onPress={logout} style={{ borderColor: C.red, borderWidth: 1, padding: 14, borderRadius: 4, marginTop: 24, alignItems: 'center' }}>
        <Text style={{ color: C.red, fontWeight: '800', letterSpacing: 1 }}>LOG OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
