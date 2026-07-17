import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { toast } from '../toast';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { youTubeId } from './VideoPlayerScreen';
import { C } from '../theme';

export default function VideosScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [state, setState] = useState({});      // video_id -> {favorite, progress_seconds}
  const [downloads, setDownloads] = useState({}); // video_id -> local uri
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    const v = await api.get('/api/videos'); if (v.ok) setVideos(v.data);
    const st = await api.get('/api/me/video-state');
    if (st.ok) { const m = {}; st.data.forEach((s) => { m[s.video_id] = s; }); setState(m); }
    const d = await AsyncStorage.getItem('downloads'); setDownloads(d ? JSON.parse(d) : {});
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleFav = async (id) => {
    const r = await api.post(`/api/videos/${id}/favorite`, {});
    if (r.ok) setState((s) => ({ ...s, [id]: { ...(s[id] || {}), favorite: r.data.favorite } }));
  };

  const download = async (v) => {
    try {
      const target = FileSystem.documentDirectory + `video_${v.id}.mp4`;
      toast('Downloading…', v.title);
      const res = await FileSystem.downloadAsync(v.url, target);
      const next = { ...downloads, [v.id]: res.uri };
      setDownloads(next); await AsyncStorage.setItem('downloads', JSON.stringify(next));
      toast('Saved offline', v.title);
    } catch (e) { toast('Download failed', String(e.message || e), 'err'); }
  };

  let list = videos;
  if (filter === 'fav') list = videos.filter((v) => state[v.id]?.favorite);
  if (filter === 'continue') list = videos.filter((v) => (state[v.id]?.progress_seconds || 0) > 5);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[['all', 'All'], ['fav', '★ Favorites'], ['continue', 'Continue']].map(([k, lbl]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, backgroundColor: filter === k ? C.red : C.ink2 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {list.length === 0 && <Text style={{ color: C.grey }}>Nothing here yet.</Text>}
      {list.map((v) => {
        const prog = state[v.id]?.progress_seconds || 0;
        const fav = state[v.id]?.favorite;
        const dl = downloads[v.id];
        const yt = youTubeId(v.url);
        const thumb = v.thumbnail || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null);
        return (
          <View key={v.id} style={{ backgroundColor: C.ink2, borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Player', { video: v, localUri: dl, startAt: prog })}>
              {thumb ? <Image source={{ uri: thumb }} style={{ width: '100%', height: 180 }} /> : <View style={{ height: 180, backgroundColor: C.ink3, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 40 }}>🎬</Text></View>}
            </TouchableOpacity>
            <View style={{ padding: 14 }}>
              <Text style={{ color: C.red, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>{v.discipline} · {v.level}</Text>
              <Text style={{ color: C.white, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{v.title}</Text>
              <Text style={{ color: C.grey, marginTop: 2 }}>{v.duration}{prog > 5 ? `  ·  ▶ continue (${Math.floor(prog / 60)}:${String(prog % 60).padStart(2, '0')})` : ''}{dl ? '  ·  ⬇ offline' : ''}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Player', { video: v, localUri: dl, startAt: prog })} style={{ backgroundColor: C.red, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 4 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>▶ Play</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleFav(v.id)} style={{ borderColor: C.line, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 4 }}>
                  <Text style={{ color: fav ? '#ffb400' : C.white }}>{fav ? '★' : '☆'} Fav</Text>
                </TouchableOpacity>
                {!dl && !yt && (
                  <TouchableOpacity onPress={() => download(v)} style={{ borderColor: C.line, borderWidth: 1, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 4 }}>
                    <Text style={{ color: C.white }}>⬇ Save</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
