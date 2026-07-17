import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../auth';
import { api } from '../api';
import { C } from '../theme';
import { notifyNow } from '../notify';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen({ navigation }) {
  const { user, membership } = useAuth();
  const [status, setStatus] = useState(null);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const st = await api.get('/api/status'); if (st.ok) { setStatus(st.data); if (st.data.closedToday) notifyNow('718 MMA — Closed Today', st.data.message); }
    const cl = await api.get('/api/classes'); if (cl.ok) setClasses(cl.data);
    const ev = await api.get('/api/events'); if (ev.ok) setEvents(ev.data.filter((e) => e.status !== 'past').slice(0, 3));
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const today = new Date().getDay();
  const todays = classes.filter((c) => c.day_of_week === today);
  const expires = membership ? new Date(membership.expires_at) : null;
  const daysLeft = expires ? Math.max(0, Math.ceil((expires - new Date()) / 86400000)) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
      <Text style={{ color: C.white, fontSize: 26, fontWeight: '900' }}>Hi, {(user?.name || 'Fighter').split(' ')[0]} 👊</Text>

      {status?.closedToday && (
        <View style={{ backgroundColor: C.red, padding: 14, borderRadius: 6, marginTop: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>⚠ GYM CLOSED TODAY</Text>
          <Text style={{ color: '#fff', marginTop: 4 }}>{status.message}</Text>
        </View>
      )}

      <Card>
        <Label>Membership</Label>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800' }}>{membership?.plan || '—'}</Text>
        <Text style={{ color: C.red, fontSize: 30, fontWeight: '900', marginTop: 4 }}>{daysLeft}<Text style={{ color: C.grey, fontSize: 14 }}> days left</Text></Text>
      </Card>

      <Label style={{ marginTop: 20 }}>Today's Classes · {DAYS[today]}</Label>
      {todays.length === 0 ? <Text style={{ color: C.grey }}>No classes scheduled today.</Text> :
        todays.map((c) => (
          <View key={c.id} style={{ backgroundColor: C.ink2, borderLeftColor: C.red, borderLeftWidth: 3, padding: 14, borderRadius: 6, marginTop: 8 }}>
            <Text style={{ color: C.white, fontWeight: '700' }}>{c.title}</Text>
            <Text style={{ color: C.greyLight }}>{c.start_time}–{c.end_time} · {c.coach}</Text>
          </View>
        ))}
      <TouchableOpacity onPress={() => navigation.navigate('Schedule')} style={btn}><Text style={btnT}>Book a class →</Text></TouchableOpacity>

      <Label style={{ marginTop: 22 }}>Upcoming Events</Label>
      {events.map((e) => (
        <View key={e.id} style={{ backgroundColor: C.ink2, padding: 14, borderRadius: 6, marginTop: 8 }}>
          <Text style={{ color: C.white, fontWeight: '700' }}>{e.title}</Text>
          <Text style={{ color: C.red }}>{e.event_date} · {e.location}</Text>
        </View>
      ))}
      <TouchableOpacity onPress={() => navigation.navigate('Events')} style={[btn, { backgroundColor: 'transparent', borderColor: C.line, borderWidth: 1 }]}>
        <Text style={[btnT, { color: C.white }]}>All events</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const btn = { backgroundColor: C.red, padding: 14, borderRadius: 4, marginTop: 12, alignItems: 'center' };
const btnT = { color: '#fff', fontWeight: '800', letterSpacing: 1 };
function Card({ children }) { return <View style={{ backgroundColor: C.ink2, borderTopColor: C.red, borderTopWidth: 3, padding: 18, borderRadius: 8, marginTop: 16 }}>{children}</View>; }
function Label({ children, style }) { return <Text style={[{ color: C.red, letterSpacing: 2, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }, style]}>{children}</Text>; }
