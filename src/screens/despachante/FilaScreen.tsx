import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';

const pedidos = [
  {id: '#0140', cliente: 'Ana Beatriz',    destino: 'SP - Lote A', urgente: true},
  {id: '#0139', cliente: 'Bruno Carvalho', destino: 'RJ - Lote B', urgente: false},
  {id: '#0138', cliente: 'João Silva',     destino: 'SP - Lote A', urgente: false},
];

export default function FilaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Fila de Expedição</Text>
        <View style={s.badge}><Text style={s.badgeText}>{pedidos.length}</Text></View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {pedidos.map(p => (
          <TouchableOpacity
            key={p.id} style={s.card} activeOpacity={0.8}
            onPress={() => navigation.navigate('Checklist', {pedidoId: p.id, etapa: 'coleta'})}>
            <View style={s.cardContent}>
              <View style={s.cardTop}>
                <Text style={s.pedidoId}>{p.id}</Text>
                {p.urgente && <View style={s.urgente}><Text style={s.urgenteText}>URGENTE</Text></View>}
              </View>
              <Text style={s.cliente}>{p.cliente}</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <View style={s.iniciarBtn}>
              <Text style={s.iniciarText}>Iniciar</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: Colors.matriz},
  header:      {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24, paddingTop: 56, paddingBottom: 20},
  title:       {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  badge:       {backgroundColor: Colors.pulso, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3},
  badgeText:   {color: Colors.matriz, fontWeight: '800', fontSize: 14},
  card:        {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  cardContent: {flex: 1},
  cardTop:     {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  pedidoId:    {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  urgente:     {backgroundColor: '#7F1D1D', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2},
  urgenteText: {fontSize: 10, fontWeight: '700', color: '#FCA5A5'},
  cliente:     {fontSize: 14, color: Colors.clareza, marginBottom: 2},
  destino:     {fontSize: 13, color: Colors.gray},
  iniciarBtn:  {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  iniciarText: {color: Colors.matriz, fontWeight: '700', fontSize: 13},
});
