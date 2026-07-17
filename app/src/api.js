import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

let token = null;
export async function loadToken() { token = await AsyncStorage.getItem('token'); return token; }
export async function setToken(t) { token = t; if (t) await AsyncStorage.setItem('token', t); else await AsyncStorage.removeItem('token'); }
export function getToken() { return token; }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  try {
    const res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let data = null;
    try { data = await res.json(); } catch { data = {}; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    // Network failure (server down, wrong IP, different Wi-Fi, firewall). Fail gracefully.
    return { ok: false, status: 0, data: {}, error: 'network', message: String(e && e.message || e) };
  }
}
export const api = {
  get: (p) => req('GET', p),
  post: (p, b) => req('POST', p, b),
  patch: (p, b) => req('PATCH', p, b),
  del: (p) => req('DELETE', p),
};
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
