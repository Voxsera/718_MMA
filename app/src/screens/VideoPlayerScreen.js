import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../api';
import { C } from '../theme';

export function youTubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export default function VideoPlayerScreen({ route }) {
  const { video, localUri, startAt } = route.params;
  const ytid = !localUri && youTubeId(video.url);
  const ref = useRef(null);
  const lastSaved = useRef(0);

  const onStatus = (s) => {
    if (!s.isLoaded) return;
    const secs = Math.floor((s.positionMillis || 0) / 1000);
    if (secs - lastSaved.current >= 5) {
      lastSaved.current = secs;
      api.post(`/api/videos/${video.id}/progress`, { seconds: secs });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {ytid ? (
        <View style={{ width: '100%', height: 260, backgroundColor: '#000' }}>
          <Image source={{ uri: `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` }} style={{ width: '100%', height: 260, opacity: 0.55 }} resizeMode="cover" />
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${ytid}`)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ backgroundColor: C.red, width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 30, marginLeft: 4 }}>▶</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1, marginTop: 12 }}>WATCH ON YOUTUBE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Video
          ref={ref}
          source={{ uri: localUri || video.url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          positionMillis={(startAt || 0) * 1000}
          onPlaybackStatusUpdate={onStatus}
          usePoster={!!video.thumbnail}
          posterSource={video.thumbnail ? { uri: video.thumbnail } : undefined}
          posterStyle={{ resizeMode: 'cover' }}
          style={{ width: '100%', height: 260, backgroundColor: '#000' }}
        />
      )}
      <View style={{ padding: 18 }}>
        <Text style={{ color: C.red, letterSpacing: 2, fontSize: 12, fontWeight: '700' }}>{video.discipline} · {video.level}</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '900', marginTop: 6 }}>{video.title}</Text>
        <Text style={{ color: C.grey, marginTop: 6 }}>
          {ytid ? 'Opens in the YouTube app.' : (localUri ? 'Playing offline copy' : 'Streaming') + ' · progress saves automatically.'}
        </Text>
      </View>
    </View>
  );
}
