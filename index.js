/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Cria canal de notificação
async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Notificações',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}
createChannel();

// Exibe notificação local quando recebe push
async function displayNotification(remoteMessage: any) {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Na Rota',
    body: remoteMessage.notification?.body || '',
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

// Handler para notificações em foreground
messaging().onMessage(async remoteMessage => {
  await displayNotification(remoteMessage);
});

// Handler para notificações em background (não exibe pois o sistema já mostra)
messaging().setBackgroundMessageHandler(async _remoteMessage => {});

AppRegistry.registerComponent(appName, () => App);
