import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '../toast';
import { api } from '../api';
import { C } from '../theme';
import { notifyNow } from '../notify';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const cl = await api.get('/api/classes'); if (cl.ok) setClasses(cl.data);
    const b = await api.get('/api/me/bookings'); if (b.ok) setBookings(b.data);
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const book = async (c) => {
    const r = await api.post(`/api/classes/${c.id}/book`, {});
    if (r.ok) {
      notifyNow('Class booked', `${c.title} · ${c.start_time}`);
      toast(r.data.status === 'waitlist' ? 'Added to waitlist' : 'Booked!', `${c.title} · ${c.start_time}–${c.end_time}`);
      load();
    } else toast('Could not book', r.data.message || r.data.error || 'Try again.', 'err');
  };
  const cancel = async (id) => { await api.post(`/api/bookings/${id}/cancel`, {}); load(); };

  const byDay = {};
  classes.forEach((c) => { (byDay[c.day_of_week] = byDay[c.day_of_week] || []).push(c); });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
      <Text style={{ color: C.white, fontSize: 24, fontWeight: '900', marginBottom: 6 }}>Class Schedule</Text>

      {bookings.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: C.red, letterSpacing: 2, fontWeight: '700', marginVertical: 8 }}>MY BOOKINGS</Text>
          {bookings.map((b) => (
            <View key={b.id} style={{ backgroundColor: C.ink2, padding: 12, borderRadius: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.white, fontWeight: '700' }}>{b.title} <Text style={{ color: b.status === 'waitlist' ? '#ffb400' : C.green }}>· {b.status}</Text></Text>
                <Text style={{ color: C.greyLight }}>{b.slot_date} · {b.start_time}</Text>
              </View>
              <TouchableOpacity onPress={() => cancel(b.id)}><Text style={{ color: C.red }}>Cancel</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {Object.keys(byDay).sort().map((d) => (
        <View key={d} style={{ marginBottom: 14 }}>
          <Text style={{ color: C.grey, letterSpacing: 2, fontWeight: '700', marginVertical: 8 }}>{DAYS[d].toUpperCase()}</Text>
          {byDay[d].map((c) => (
            <View key={c.id} style={{ backgroundColor: C.ink2, borderLeftColor: C.red, borderLeftWidth: 3, padding: 14, borderRadius: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.white, fontWeight: '700' }}>{c.title}</Text>
                <Text style={{ color: C.greyLight }}>{c.start_time}–{c.end_time} · {c.coach} · cap {c.capacity}</Text>
              </View>
              <TouchableOpacity onPress={() => book(c)} style={{ backgroundColor: C.red, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Book</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
