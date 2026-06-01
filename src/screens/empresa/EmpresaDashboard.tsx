import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

const stats = [
  {label: 'Clientes ativos',   value: '24',  icon: '👥', color: Colors.pulso},
  {label: 'Despachantes',      value: '6',   icon: '🚚', color: '#60A5FA'},
  {label: 'Excursões abertas', value: '3',   icon: '🗺️', color: '#F59E0B'},
  {label: 'Pedidos hoje',      value: '138', icon: '📦', color: '#C084FC'},
];

const recentes = [
  {id: '#0138', cliente: 'João Silva',   excursao: 'SP - Lote A', status: 'Em trânsito', cor: Colors.pulso},
  {id: '#0137', cliente: 'Maria Santos', excursao: 'RJ - Lote B', status: 'Aguardando',  cor: '#F59E0B'},
  {id: '#0136', cliente: 'Carlos Melo',  excursao: 'BH - Lote A', status: 'Entregue',    cor: '#86EFAC'},
];

export default function EmpresaDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Bom dia 👋</Text>
          <Text style={s.company}>Na Rota Transportes</Text>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={() => navigation.replace('RoleSelect')}>
          <Text style={s.exitText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsGrid}>
        {stats.map(item => (
          <View key={item.label} style={s.statCard}>
            <Text style={s.statIcon}>{item.icon}</Text>
            <Text style={[s.statValue, {color: item.color}]}>{item.value}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Pedidos recentes</Text>
      {recentes.map(p => (
        <View key={p.id} style={s.pedidoCard}>
          <View style={[s.dot, {backgroundColor: p.cor}]} />
          <View style={s.pedidoInfo}>
            <Text style={s.pedidoId}>{p.id} · {p.cliente}</Text>
            <Text style={s.pedidoDest}>{p.excursao}</Text>
          </View>
          <Text style={[s.pedidoStatus, {color: p.cor}]}>{p.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: Colors.matriz},
  content:     {padding: 24, paddingTop: 56, paddingBottom: 20},
  header:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28},
  greeting:    {fontSize: 14, color: Colors.gray, marginBottom: 2},
  company:     {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  exitBtn:     {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  exitText:    {color: Colors.pulso, fontSize: 13, fontWeight: '600'},
  statsGrid:   {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28},
  statCard:    {
    flex: 1, minWidth: '45%',
    backgroundColor: '#162433',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1E3448',
  },
  statIcon:    {fontSize: 22, marginBottom: 8},
  statValue:   {fontSize: 28, fontWeight: '800', marginBottom: 2},
  statLabel:   {fontSize: 12, color: Colors.gray, fontWeight: '500'},
  section:     {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 12},
  pedidoCard:  {
    backgroundColor: '#162433',
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 10,
    borderWidth: 1, borderColor: '#1E3448',
  },
  dot:         {width: 10, height: 10, borderRadius: 5},
  pedidoInfo:  {flex: 1},
  pedidoId:    {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  pedidoDest:  {fontSize: 12, color: Colors.gray, marginTop: 2},
  pedidoStatus:{fontSize: 12, fontWeight: '700'},
});
