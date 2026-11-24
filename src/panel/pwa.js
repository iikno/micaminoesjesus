// Install + push helpers of the panel. The service worker (public/panel/sw.js) only handles push and the offline page.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { get, post } from './api';
import { detectEnv } from './env';

export const env = () => detectEnv(navigator.userAgent, {
  standalone: window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true, touch: navigator.maxTouchPoints, platform: navigator.platform,
});

// ---- install (Android/Chrome): the browser offers the prompt once; keep it until the person taps ----
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((f) => f());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; emit(); });
}
export function useInstallPrompt() {
  const can = useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, () => !!deferred);
  const prompt = async () => {
    const p = deferred;
    deferred = null; emit();
    await p?.prompt();
  };
  return { can, prompt };
}

export const registerPanelWorker = () => { navigator.serviceWorker?.register('/panel/sw.js', { scope: '/' }).catch(() => {}); };

// ---- push ----
export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
let keyP;
const pushKey = () => (keyP ??= get('/api/admin/push/key').catch(() => { keyP = null; return { enabled: false }; }));
export function usePushKey() {
  const [k, set] = useState(null);
  useEffect(() => { pushKey().then(set); }, []);
  return k;
}
const b64ToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const registration = () => navigator.serviceWorker.getRegistration('/');
export const thisDevice = async () => (await registration())?.pushManager.getSubscription() ?? null;

// Turn on for this device. Permission is asked first and only from a tap (iPhone refuses it after other awaits).
// Returns 'on' | 'denied' | 'dismissed'.
export async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'dismissed';
  const { key } = await pushKey();
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('sw_timeout')), 8000))]);
  await (await reg.pushManager.getSubscription())?.unsubscribe(); // a changed server key would make the old one unusable
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  await post('/api/admin/push/subscribe', sub.toJSON());
  return 'on';
}

// Turn off for this device only (also used at logout so the next person on a shared phone does not get these).
export async function disablePush() {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  const sub = await thisDevice();
  if (!sub) return;
  await post('/api/admin/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

// On every panel open: if this device is subscribed, (re)attach it to whoever is signed in now.
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted' || !(await pushKey()).enabled) return;
  const sub = await thisDevice();
  if (sub) await post('/api/admin/push/subscribe', sub.toJSON());
}
