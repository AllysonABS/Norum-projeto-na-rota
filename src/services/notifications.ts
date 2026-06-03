import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid} from 'react-native';

const API_URL = 'https://narota.norum.app';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

export async function registrarTokenEmpresa(empresaId: string, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/empresa/${empresaId}/fcm-token`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token}),
    });
  } catch {}
}

export function onForegroundMessage(callback: (msg: any) => void) {
  return messaging().onMessage(callback);
}
