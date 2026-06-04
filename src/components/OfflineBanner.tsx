import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useNetworkStatus} from '../hooks/useNetworkStatus';
import {setSyncListener} from '../services/syncManager';
import {Colors} from '../theme/colors';
import Icon from './Icon';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  useEffect(() => {
    setSyncListener(status => {
      setSyncStatus(status);
      if (status === 'done') {
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    });
    return () => setSyncListener(null);
  }, []);

  if (isOnline && syncStatus === 'idle') return null;

  if (!isOnline) {
    return (
      <View style={[s.banner, s.offline]}>
        <Icon name="wifi-off" size={14} color="#FFF" />
        <Text style={s.text}>Sem internet · Ações salvas localmente</Text>
      </View>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <View style={[s.banner, s.syncing]}>
        <Icon name="refresh-cw" size={14} color="#FFF" />
        <Text style={s.text}>Sincronizando...</Text>
      </View>
    );
  }

  if (syncStatus === 'done') {
    return (
      <View style={[s.banner, s.done]}>
        <Icon name="check-circle" size={14} color="#FFF" />
        <Text style={s.text}>Tudo sincronizado!</Text>
      </View>
    );
  }

  if (syncStatus === 'error') {
    return (
      <View style={[s.banner, s.error]}>
        <Icon name="alert-triangle" size={14} color="#FFF" />
        <Text style={s.text}>Erro ao sincronizar · Tentando novamente...</Text>
      </View>
    );
  }

  return null;
}

const s = StyleSheet.create({
  banner:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16},
  offline: {backgroundColor: '#6B7280'},
  syncing: {backgroundColor: '#2563EB'},
  done:    {backgroundColor: '#16A34A'},
  error:   {backgroundColor: '#DC2626'},
  text:    {color: '#FFF', fontSize: 12, fontWeight: '600'},
});
