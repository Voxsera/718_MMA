import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { C } from './theme';

let _show = null;
// toast('Title') or toast('Title', 'message', 'ok'|'err')
export function toast(title, message, type = 'ok') { if (_show) _show({ title, message, type }); }

export function ToastHost() {
  const [data, setData] = useState(null);
  const [op] = useState(new Animated.Value(0));
  useEffect(() => {
    _show = (d) => {
      setData(d);
      Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      setTimeout(() => Animated.timing(op, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setData(null)), 2600);
    };
    return () => { _show = null; };
  }, []);
  if (!data) return null;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, bottom: 90, opacity: op, alignItems: 'center' }}>
      <View style={{ backgroundColor: C.ink2, borderLeftColor: data.type === 'err' ? C.red : C.green, borderLeftWidth: 4, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18, maxWidth: 460, width: '100%', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{data.type === 'err' ? '⚠️ ' : '✅ '}{data.title}</Text>
        {data.message ? <Text style={{ color: C.greyLight, marginTop: 3, fontSize: 13 }}>{data.message}</Text> : null}
      </View>
    </Animated.View>
  );
}
