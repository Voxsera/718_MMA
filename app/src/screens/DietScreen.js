import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, RefreshControl, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { C } from '../theme';

const W = Dimensions.get('window').width - 32;

export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [ratios, setRatios] = useState({});   // url -> width/height
  const [viewer, setViewer] = useState(null);  // url shown fullscreen
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get('/api/diet');
    if (r.ok) {
      setPosts(r.data);
      r.data.forEach((p) => {
        if (p.image_url && !ratios[p.image_url]) {
          Image.getSize(p.image_url, (w, h) => setRatios((s) => ({ ...s, [p.image_url]: w / h })), () => {});
        }
      });
    }
  }, [ratios]);
  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
        <Text style={{ color: C.white, fontSize: 24, fontWeight: '900', marginBottom: 4 }}>Diet Plans</Text>
        <Text style={{ color: C.grey, marginBottom: 16 }}>Shared by your coaches. Tap an image to view full. Pull down to refresh.</Text>
        {posts.length === 0 && <Text style={{ color: C.grey }}>No diet plans yet — check back soon.</Text>}
        {posts.map((p) => {
          const ratio = ratios[p.image_url] || 0.75;
          return (
            <View key={p.id} style={{ backgroundColor: C.ink2, borderRadius: 10, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.line }}>
              {p.title ? <Text style={{ color: C.white, fontWeight: '800', fontSize: 16, padding: 14, paddingBottom: 8 }}>{p.title}</Text> : null}
              <TouchableOpacity activeOpacity={0.9} onPress={() => setViewer(p.image_url)}>
                <Image source={{ uri: p.image_url }} style={{ width: W, height: W / ratio, maxHeight: 520, backgroundColor: '#000' }} resizeMode="contain" />
              </TouchableOpacity>
              {p.note ? <Text style={{ color: C.greyLight, padding: 14, paddingBottom: 6 }}>{p.note}</Text> : null}
              <Text style={{ color: C.grey, fontSize: 12, paddingHorizontal: 14, paddingBottom: 12, paddingTop: p.note ? 0 : 10 }}>{(p.created_at || '').slice(0, 10)} · tap to enlarge</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Fullscreen image viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }}>
          <TouchableOpacity onPress={() => setViewer(null)} style={{ position: 'absolute', top: insets.top + 10, right: 18, zIndex: 2, padding: 10 }}>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} onPress={() => setViewer(null)} style={{ flex: 1, justifyContent: 'center' }}>
            {viewer ? <Image source={{ uri: viewer }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
