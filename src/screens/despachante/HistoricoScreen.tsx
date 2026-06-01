import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {Colors} from '../../theme/colors';

const historico = [
  {id: '#0133', cliente: 'Lucas Freitas',  destino: 'RJ - Lote B', hora: '14:32', fotos: 2},
  {id: '#0130', cliente: 'Paula Neves',    destino: 'SP - Lote A', hora: '11:15', fotos: 3},
  {id: '#0128', cliente: 'Marcos Alves',   destino: 'BH - Lote A', hora: '09:40', fotos: 2},
  {id: '#0125', cliente: 'Beatriz Costa',  destino: 'SP - Lote A', hora: 'Ontem', fotos: 4},
];

export default function HistoricoScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Histórico</Text>
        <Text style={s.sub}>Entregas realizadas</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {historico.map(p => (
          <View key={p.id} style={s.card}>
            <View style={s.checkIcon}>
              <Text style={s.checkText}>✓</Text>
            </View>
            <View style={s.info}>
              <Text style={s.id}>{p.id} · {p.cliente}</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <View style={s.right}>
              <Text style={s.hora}>{p.hora}</Text>
              <Text style={s.fotos}>📷 {p.fotos}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz},
  header:    {padding: 24, paddingTop: 56, paddingBottom: 20},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  sub:       {fontSize: 13, color: Colors.gray, marginTop: 4},
  card:      {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  checkIcon: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#052E16', alignItems: 'center', justifyContent: 'center'},
  checkText: {color: Colors.pulso, fontWeight: '800', fontSize: 14},
  info:      {flex: 1},
  id:        {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  destino:   {fontSize: 12, color: Colors.gray, marginTop: 2},
  right:     {alignItems: 'flex-end', gap: 4},
  hora:      {fontSize: 12, color: Colors.gray},
  fotos:     {fontSize: 12, color: Colors.pulso, fontWeight: '600'},
});
