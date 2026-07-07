import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { toast } from '../toast';
import { api } from '../api';
import { C } from '../theme';
import { scheduleAt } from '../notify';

const PILL = { upcoming: C.red, ongoing: C.green, past: C.ink3 };

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { const r = await api.get('/api/events'); if (r.ok) setEvents(r.data); }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const remind = async (e) => {
    const when = new Date(e.event_date + 'T09:00:00');
    if (isNaN(when) || when < new Date()) { toast('Cannot remind', 'Event date is in the past.', 'err'); return; }
    await scheduleAt('718 Event Today', `${e.title} · ${e.location}`, when);
    toast('Reminder set', `We'll notify you on ${e.event_date}.`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
      {events.map((e) => (
        <View key={e.id} style={{ backgroundColor: C.ink2, borderRadius: 8, marginBottom: 14, padding: 16 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: PILL[e.status], paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{(e.status || '').toUpperCase()}</Text>
          </View>
          <Text style={{ color: C.white, fontSize: 19, fontWeight: '800', marginTop: 10 }}>{e.title}</Text>
          <Text style={{ color: C.greyLight, marginTop: 4 }}>{e.description}</Text>
          <Text style={{ color: C.red, marginTop: 6 }}>📅 {e.event_date} · {e.location}</Text>
          {e.status === 'upcoming' && (
            <TouchableOpacity onPress={() => remind(e)} style={{ borderColor: C.line, borderWidth: 1, padding: 10, borderRadius: 4, marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: C.white }}>🔔 Remind me</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
