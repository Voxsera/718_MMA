import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../auth';
import { C } from '../theme';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config';

WebBrowser.maybeCompleteAuthSession();
const googleEnabled = !!(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || GOOGLE_IOS_CLIENT_ID);

// Google button is a separate component so its hook only runs when configured.
function GoogleButton({ onError, mode }) {
  const { loginWithGoogle } = useAuth();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (idToken) loginWithGoogle(idToken).then((r) => { if (!r.ok) onError(r.error); });
    }
  }, [response]);
  return (
    <TouchableOpacity onPress={() => promptAsync()} disabled={!request}
      style={{ borderColor: C.line, borderWidth: 1, padding: 14, borderRadius: 4, marginTop: 16, alignItems: 'center' }}>
      <Text style={{ color: C.white, fontWeight: '700' }}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null); setBusy(true);
    const r = mode === 'register' ? await register(name, email, password) : await login(email, password);
    setBusy(false);
    if (!r.ok) setErr(r.error);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 26, paddingTop: 90, flexGrow: 1, justifyContent: 'center' }}>
        <Text style={{ color: C.white, fontSize: 56, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' }}>7<Text style={{ color: C.red }}>18</Text></Text>
        <Text style={{ color: C.grey, textAlign: 'center', letterSpacing: 4, marginBottom: 28, fontSize: 12 }}>MMA CLUB · MEMBERS</Text>

        <View style={{ flexDirection: 'row', marginBottom: 18, gap: 8 }}>
          {['login', 'register'].map((m) => (
            <TouchableOpacity key={m} onPress={() => { setMode(m); setErr(null); }} style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: mode === m ? C.red : C.ink2, borderRadius: 4 }}>
              <Text style={{ color: C.white, fontWeight: '700', letterSpacing: 1 }}>{m === 'login' ? 'SIGN IN' : 'CREATE'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'register' && <Field label="Name" value={name} onChangeText={setName} />}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity onPress={submit} disabled={busy} style={{ backgroundColor: C.red, padding: 16, borderRadius: 4, marginTop: 18, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
          <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>{busy ? 'PLEASE WAIT…' : mode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
        </TouchableOpacity>

        {err && <Text style={{ color: C.redBright, marginTop: 14, textAlign: 'center' }}>⚠️ {err}</Text>}

        {googleEnabled && <GoogleButton onError={setErr} mode={mode} />}

        <Text style={{ color: C.grey, textAlign: 'center', marginTop: 24, fontSize: 13 }}>
          Only 718 members with an active membership can use the app. Buy a membership on our website, then sign in here.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: C.greyLight, letterSpacing: 1, fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>{label}</Text>
      <TextInput {...props} placeholderTextColor={C.grey}
        style={{ backgroundColor: C.ink, borderColor: C.line, borderWidth: 1, color: C.white, padding: 14, borderRadius: 4, fontSize: 16 }} />
    </View>
  );
}
