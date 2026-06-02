import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia ☀️';
  if (h < 18) return 'Boa tarde 🌤️';
  return 'Boa noite 🌙';
};

const stats = [
  {label: 'Clientes ativos',   value: '24',  icon: '👥', color: Colors.pulso},
  {label: 'Despachantes',      value: '6',   icon: '🚚', color: '#60A5FA'},
  {label: 'Excursões abertas', value: '3',   icon: '🗺️', color: '#F59E0B'},
  {label: 'Pedidos hoje',      value: '138', icon: '📦', color: '#C084FC'},
];

const statusPedidos = [
  {label: 'Em trânsito', valor: 12, cor: Colors.pulso},
  {label: 'Aguardando', valor: 5, cor: '#F59E0B'},
  {label: 'Entregues hoje', valor: 121, cor: '#86EFAC'},
];


const pedidosSemana = [
  {dia: 'Seg', valor: 18},
  {dia: 'Ter', valor: 25},
  {dia: 'Qua', valor: 12},
  {dia: 'Qui', valor: 30},
  {dia: 'Sex', valor: 22},
  {dia: 'Sáb', valor: 8},
  {dia: 'Dom', valor: 3},
];
const maxPedidos = Math.max(...pedidosSemana.map(p => p.valor));

const alertas = [
  {msg: '2 excursões sem responsável definido', icon: '⚠️', cor: '#F59E0B'},
  {msg: '3 clientes inativos há mais de 30 dias', icon: '⛔', cor: '#EF4444'},
  {msg: '1 despachante com documentação vencida', icon: '📋', cor: '#F97316'},
  {msg: '2 pedidos parados há mais de 2h', icon: '⏰', cor: '#EF4444'},
];

const desempenho = [
  {nome: 'Ricardo Gomes', entregas: 45, parados: 0},
  {nome: 'Fernanda Lima', entregas: 38, parados: 1},
  {nome: 'Paulo Mendes', entregas: 22, parados: 2},
];

const ultimosClientes = [
  {nome: 'Ana Beatriz', data: 'Hoje'},
  {nome: 'Marcos Vinícius', data: 'Ontem'},
  {nome: 'Transportes Lima', data: '2 dias atrás'},
];

const recentes = [
  {id: '#0138', cliente: 'João Silva',   excursao: 'SP - Lote A', status: 'Em trânsito', cor: Colors.pulso},
  {id: '#0137', cliente: 'Maria Santos', excursao: 'RJ - Lote B', status: 'Aguardando',  cor: '#F59E0B'},
  {id: '#0136', cliente: 'Carlos Melo',  excursao: 'BH - Lote A', status: 'Entregue',    cor: '#86EFAC'},
  {id: '#0135', cliente: 'Ana Beatriz',  excursao: 'SP - Lote A', status: 'Parado há 2h', cor: '#EF4444'},
];


export default function EmpresaDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.company}>Na Rota Transportes</Text>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={() => navigation.replace('Login')}>
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

      {/* Resumo de status dos pedidos */}
      <Text style={s.section}>Status dos pedidos</Text>
      <View style={s.statusRow}>
        {statusPedidos.map(sp => (
          <View key={sp.label} style={s.statusCard}>
            <Text style={[s.statusValor, {color: sp.cor}]}>{sp.valor}</Text>
            <Text style={s.statusLabel}>{sp.label}</Text>
          </View>
        ))}
      </View>

      {/* Gráfico de atividade */}
      <Text style={s.section}>Atividade da semana</Text>
      <View style={s.chartCard}>
        <View style={s.chartBars}>
          {pedidosSemana.map(p => (
            <View key={p.dia} style={s.chartCol}>
              <View style={s.barBg}>
                <View style={[s.barFill, {height: `${(p.valor / maxPedidos) * 100}%`}]} />
              </View>
              <Text style={s.barLabel}>{p.dia}</Text>
            </View>
          ))}
        </View>
        <Text style={s.chartTotal}>Total: {pedidosSemana.reduce((a, b) => a + b.valor, 0)} pedidos</Text>
      </View>

      {/* Alertas */}
      <Text style={s.section}>Alertas</Text>
      {alertas.map((a, i) => (
        <View key={i} style={s.alertCard}>
          <Text style={s.alertIcon}>{a.icon}</Text>
          <Text style={[s.alertMsg, {color: a.cor}]}>{a.msg}</Text>
        </View>
      ))}

      {/* Desempenho dos despachantes */}
      <Text style={[s.section, {marginTop: 20}]}>Desempenho dos despachantes</Text>
      {desempenho.map((d, i) => (
        <View key={i} style={s.despRow}>
          <View style={s.despAvatar}>
            <Text style={s.despAvatarText}>{d.nome[0]}</Text>
          </View>
          <View style={s.despInfo}>
            <Text style={s.despNome}>{d.nome}</Text>
            <Text style={s.despStats}>{d.entregas} entregas esta semana</Text>
          </View>
          {d.parados > 0 && (
            <View style={s.despAlerta}>
              <Text style={s.despAlertaText}>{d.parados} parado{d.parados > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Últimos clientes */}
      <Text style={[s.section, {marginTop: 20}]}>Últimos clientes cadastrados</Text>
      {ultimosClientes.map((c, i) => (
        <View key={i} style={s.clienteRow}>
          <View style={s.clienteAvatar}>
            <Text style={s.clienteAvatarText}>{c.nome[0]}</Text>
          </View>
          <Text style={s.clienteNome}>{c.nome}</Text>
          <Text style={s.clienteData}>{c.data}</Text>
        </View>
      ))}

      <Text style={[s.section, {marginTop: 20}]}>Pedidos recentes</Text>
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
  content:     {padding: 24, paddingTop: 56, paddingBottom: 40},
  header:      {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20},
  greeting:    {fontSize: 14, color: Colors.gray, marginBottom: 2},
  company:     {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  exitBtn:     {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  exitText:    {color: Colors.pulso, fontSize: 13, fontWeight: '600'},

  statsGrid:   {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
  statCard:    {flex: 1, minWidth: '45%', backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448'},
  statIcon:    {fontSize: 22, marginBottom: 8},
  statValue:   {fontSize: 28, fontWeight: '800', marginBottom: 2},
  statLabel:   {fontSize: 12, color: Colors.gray, fontWeight: '500'},
  section:     {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 12},
  chartCard:   {backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448', marginBottom: 20},
  chartBars:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, gap: 6},
  chartCol:    {flex: 1, alignItems: 'center'},
  barBg:       {width: '100%', height: 80, backgroundColor: '#1E3448', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden'},
  barFill:     {width: '100%', backgroundColor: Colors.pulso, borderRadius: 4},
  barLabel:    {fontSize: 10, color: Colors.gray, marginTop: 6, fontWeight: '600'},
  chartTotal:  {fontSize: 12, color: Colors.gray, marginTop: 12, textAlign: 'center'},
  alertCard:   {backgroundColor: '#162433', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, borderWidth: 1, borderColor: '#1E3448'},
  alertIcon:   {fontSize: 18},
  alertMsg:    {fontSize: 13, fontWeight: '600', flex: 1},
  statusRow:   {flexDirection: 'row', gap: 10, marginBottom: 20},
  statusCard:  {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  statusValor: {fontSize: 22, fontWeight: '800'},
  statusLabel: {fontSize: 11, color: Colors.gray, marginTop: 4, fontWeight: '600', textAlign: 'center'},
  despRow:     {backgroundColor: '#162433', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E3448'},
  despAvatar:  {width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  despAvatarText:{color: '#60A5FA', fontWeight: '700', fontSize: 14},
  despInfo:    {flex: 1},
  despNome:    {fontSize: 14, fontWeight: '600', color: Colors.clareza},
  despStats:   {fontSize: 12, color: Colors.gray, marginTop: 2},
  despAlerta:  {backgroundColor: '#EF444420', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4},
  despAlertaText:{fontSize: 11, color: '#EF4444', fontWeight: '700'},
  clienteRow:  {backgroundColor: '#162433', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E3448'},
  clienteAvatar:{width: 34, height: 34, borderRadius: 17, backgroundColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  clienteAvatarText:{color: Colors.pulso, fontWeight: '700', fontSize: 14},
  clienteNome: {flex: 1, fontSize: 14, fontWeight: '600', color: Colors.clareza},
  clienteData: {fontSize: 12, color: Colors.gray},
  pedidoCard:  {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1E3448'},
  dot:         {width: 10, height: 10, borderRadius: 5},
  pedidoInfo:  {flex: 1},
  pedidoId:    {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  pedidoDest:  {fontSize: 12, color: Colors.gray, marginTop: 2},
  pedidoStatus:{fontSize: 12, fontWeight: '700'},
});
