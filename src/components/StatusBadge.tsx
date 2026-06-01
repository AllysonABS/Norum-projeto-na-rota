import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';

type Status = 'aguardando' | 'em_transito' | 'entregue' | 'cancelado';

const config: Record<Status, {label: string; color: string; bg: string}> = {
  aguardando:  {label: 'Aguardando',   color: '#F59E0B', bg: '#451A03'},
  em_transito: {label: 'Em trânsito',  color: Colors.pulso, bg: '#052E16'},
  entregue:    {label: 'Entregue',     color: '#86EFAC', bg: '#14532D'},
  cancelado:   {label: 'Cancelado',    color: '#FCA5A5', bg: '#7F1D1D'},
};

export default function StatusBadge({status}: {status: Status}) {
  const c = config[status];
  return (
    <View style={[s.badge, {backgroundColor: c.bg}]}>
      <Text style={[s.text, {color: c.color}]}>{c.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  text: {fontSize: 12, fontWeight: '700'},
});
