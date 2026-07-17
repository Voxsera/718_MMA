import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function ensurePermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') await Notifications.requestPermissionsAsync();
  } catch (e) { /* ignore on web/unsupported */ }
}

// Fire a local (on-device) notification immediately — used for "gym closed" + booking confirms.
export async function notifyNow(title, body) {
  try { await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null }); } catch (e) {}
}

// Schedule a local reminder at a future time.
export async function scheduleAt(title, body, date) {
  try { await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: date }); } catch (e) {}
}
