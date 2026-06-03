import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';
import {contarNotificacoesNaoLidas, listarPedidosEmpresa, listarClientesEmpresa, listarDespachantes, listarExcursoes, PedidoData} from '../../services/api';
import {requestNotificationPermission, getFCMToken, registrarTokenEmpresa, onForegroundMessage} from '../../services/notifications';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia ☀️';
  if (h < 18) return 'Boa tarde 🌤️';
  return 'Boa noite 🌙';
};

const statusCor: Record<string, string> = {
  aguardando: '#F59E0B',
  em_transito: Colors.pulso,
  entregue: '#86EFAC',
};

export default function EmpresaDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {empresa} = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);
  const [pedidos, setPedidos] = useState<PedidoData[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalDespachantes, setTotalDespachantes] = useState(0);
  const [totalExcursoes, setTotalExcursoes] = useState(0);

  useEffect(() => {
    (async () => {
      if (!empresa?.id) return;
      const permitido = await requestNotificationPermission();
      if (!permitido) return;
      const token = await getFCMToken();
      if (token) await registrarTokenEmpresa(empresa.id, token);
    })();
  }, [empresa?.id]);

  useFocusEffect(useCallback(() => {
    if (!empresa?.id) return;
    contarNotificacoesNaoLidas(empresa.id).then(r => { if (r.success) setNaoLidas(r.total || 0); });
    listarPedidosEmpresa(empresa.id).then(r => { if (r.success && r.pedidos) setPedidos(r.pedidos); });
    listarClientesEmpresa(empresa.id).then(r => { if (r.success && r.clientes) setTotalClientes(r.clientes.length); });
    listarDespachantes(empresa.id).then(r => { if (r.success && r.despachantes) setTotalDespachantes(r.despachantes.length); });
    listarExcursoes(empresa.id).then(r => { if (r.success && r.excursoes) setTotalExcursoes(r.excursoes.length); });
  }, [empresa?.id]));

  useFocusEffect(useCallback(() => {
    if (!empresa?.id) return;
    const interval = setInterval(() => {
      contarNotificacoesNaoLidas(empresa.id).then(r => { if (r.success) setNaoLidas(r.total || 0); });
    }, 15000);
    return () => clearInterval(interval);
  }, [empresa?.id]));

  useEffect(() => {
    const unsub = onForegroundMessage(() => {
      if (empresa?.id) contarNotificacoesNaoLidas(empresa.id).then(r => { if (r.success) setNaoLidas(r.total || 0); });
    });
    return unsub;
  }, [empresa?.id]);

  // Dados calculados
  const hoje = new Date().toDateString();
  const pedidosHoje = pedidos.filter(p => new Date(p.criado_em).toDateString() === hoje);
  const emTransito = pedidos.filter(p => p.status === 'em_transito').length;
  const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
  const entreguesHoje = pedidosHoje.filter(p => p.status === 'entregue').length;
  const recentes = pedidos.slice(0, 5);

  const stats = [
    {label: 'Clientes ativos', value: String(totalClientes), icon: '👥', color: Colors.pulso},
    {label: 'Despachantes', value: String(totalDespachantes), icon: '🚚', color: '#60A5FA'},
    {label: 'Excursões', value: String(totalExcursoes), icon: '🗺️', color: '#F59E0B'},
    {label: 'Pedidos hoje', value: String(pedidosHoje.length), icon: '📦', color: '#C084FC'},
  ];

  const statusPedidos = [
    {label: 'Em trânsito', valor: emTransito, cor: Colors.pulso},
    {label: 'Aguardando', valor: aguardando, cor: '#F59E0B'},
    {label: 'Entregues hoje', valor: entreguesHoje, cor: '#86EFAC'},
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.company}>{empresa?.nome_empresa || 'Na Rota Transportes'}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.notifBtn} onPress={() => (navigation as any).navigate('Notificações')}>
            <Text style={s.notifIcon}>🔔</Text>
            {naoLidas > 0 && <View style={s.badgeNotif}><Text style={s.badgeNotifText}>{naoLidas > 9 ? '9+' : naoLidas}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={s.exitBtn} onPress={() => navigation.replace('Login')}>
            <Text style={s.exitText}>Sair</Text>
          </TouchableOpacity>
        </View>
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

      <Text style={s.section}>Status dos pedidos</Text>
      <View style={s.statusRow}>
        {statusPedidos.map(sp => (
          <View key={sp.label} style={s.statusCard}>
            <Text style={[s.statusValor, {color: sp.cor}]}>{sp.valor}</Text>
            <Text style={s.statusLabel}>{sp.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Pedidos recentes</Text>
      {recentes.length === 0 ? (
        <Text style={s.emptyText}>Nenhum pedido criado ainda</Text>
      ) : recentes.map(p => (
        <View key={p.id} style={s.pedidoCard}>
          <View style={[s.dot, {backgroundColor: statusCor[p.status] || Colors.gray}]} />
          <View style={s.pedidoInfo}>
            <Text style={s.pedidoId}>#{p.numero} · {p.cliente_nome}</Text>
            <Text style={s.pedidoDest}>{p.excursao_nome}</Text>
          </View>
          <Text style={[s.pedidoStatus, {color: statusCor[p.status] || Colors.gray}]}>
            {p.status === 'aguardando' ? 'Aguardando' : p.status === 'em_transito' ? 'Em trânsito' : 'Entregue'}
          </Text>
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
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 10},
  notifBtn:    {position: 'relative', padding: 8},
  notifIcon:   {fontSize: 22},
  badgeNotif:  {position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4},
  badgeNotifText:{color: '#FFF', fontSize: 10, fontWeight: '800'},
  exitBtn:     {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  exitText:    {color: Colors.pulso, fontSize: 13, fontWeight: '600'},
  statsGrid:   {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
  statCard:    {flex: 1, minWidth: '45%', backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448'},
  statIcon:    {fontSize: 22, marginBottom: 8},
  statValue:   {fontSize: 28, fontWeight: '800', marginBottom: 2},
  statLabel:   {fontSize: 12, color: Colors.gray, fontWeight: '500'},
  section:     {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 12, marginTop: 8},
  statusRow:   {flexDirection: 'row', gap: 10, marginBottom: 20},
  statusCard:  {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  statusValor: {fontSize: 22, fontWeight: '800'},
  statusLabel: {fontSize: 11, color: Colors.gray, marginTop: 4, fontWeight: '600', textAlign: 'center'},
  pedidoCard:  {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1E3448'},
  dot:         {width: 10, height: 10, borderRadius: 5},
  pedidoInfo:  {flex: 1},
  pedidoId:    {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  pedidoDest:  {fontSize: 12, color: Colors.gray, marginTop: 2},
  pedidoStatus:{fontSize: 12, fontWeight: '700'},
  emptyText:   {fontSize: 14, color: Colors.gray, textAlign: 'center', marginTop: 10, marginBottom: 20},
});
