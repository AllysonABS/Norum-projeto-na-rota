import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';
import {listarPedidosDespachante, atualizarStatusPedido, concluirEtapaPedido, PedidoData} from '../../services/api';

export default function FilaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {despachante} = useAuth();
  const [pedidos, setPedidos] = useState<PedidoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    if (!despachante?.id) return;
    const res = await listarPedidosDespachante(despachante.id);
    if (res.success && res.pedidos) setPedidos(res.pedidos);
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [despachante?.id]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar().finally(() => setRefreshing(false));
  }, [despachante?.id]);

  const fila = pedidos.filter(p => p.status === 'aguardando');
  const emAndamento = pedidos.filter(p => p.status === 'em_transito');

  const iniciarColeta = async (p: PedidoData) => {
    // Conclui etapa "Coleta realizada" e muda status para em_transito
    const etapaColeta = p.etapas?.find(e => e.nome === 'Coleta realizada' && !e.concluida);
    if (etapaColeta) await concluirEtapaPedido(p.id, etapaColeta.id);
    await atualizarStatusPedido(p.id, 'em_transito');
    carregar();
  };

  const filtrados = fila.filter(p => {
    const q = busca.toLowerCase();
    return !q || p.cliente_nome.toLowerCase().includes(q) || p.excursao_nome.toLowerCase().includes(q);
  });

  if (loading) {
    return <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={Colors.pulso} /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={s.title}>Fila de Expedição</Text>
          <View style={s.badge}><Text style={s.badgeText}>{fila.length}</Text></View>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={() => rootNavigation.replace('Login')}>
          <Text style={s.exitText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={s.resumoRow}>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#F59E0B'}]}>{fila.length}</Text>
          <Text style={s.resumoLabel}>Na fila</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: Colors.pulso}]}>{emAndamento.length}</Text>
          <Text style={s.resumoLabel}>Em andamento</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#86EFAC'}]}>{pedidos.filter(p => p.status === 'entregue').length}</Text>
          <Text style={s.resumoLabel}>Entregues</Text>
        </View>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar pedido..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {filtrados.map(p => (
          <View key={p.id} style={s.card}>
            <View style={s.cardContent}>
              <View style={s.cardTop}>
                <Text style={s.pedidoId}>#{p.numero}</Text>
              </View>
              <Text style={s.cliente}>{p.cliente_nome}</Text>
              <Text style={s.empresa}>{p.volumes} vol. · {p.descricao || 'Sem descrição'}</Text>
              <Text style={s.destino}>📍 {p.excursao_nome}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.iniciarBtn} onPress={() => iniciarColeta(p)}>
                <Text style={s.iniciarText}>Iniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filtrados.length === 0 && <Text style={s.empty}>Nenhum pedido na fila</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: Colors.matriz},
  header:      {flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 12, justifyContent: 'space-between'},
  titleRow:    {flexDirection: 'row', alignItems: 'center', gap: 12},
  exitBtn:     {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  exitText:    {color: Colors.pulso, fontSize: 13, fontWeight: '600'},
  title:       {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  badge:       {backgroundColor: Colors.pulso, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3},
  badgeText:   {color: Colors.matriz, fontWeight: '800', fontSize: 14},
  resumoRow:   {flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 12},
  resumoCard:  {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  resumoValor: {fontSize: 20, fontWeight: '800'},
  resumoLabel: {fontSize: 10, color: Colors.gray, marginTop: 2, fontWeight: '600'},
  searchBox:   {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 12, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:  {fontSize: 16, marginRight: 8},
  searchInput: {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  card:        {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  cardContent: {flex: 1},
  cardTop:     {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4},
  pedidoId:    {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  cliente:     {fontSize: 14, color: Colors.clareza, marginBottom: 2},
  empresa:     {fontSize: 13, color: '#60A5FA', marginBottom: 2},
  destino:     {fontSize: 12, color: Colors.gray},
  actions:     {alignItems: 'center', gap: 8},
  iniciarBtn:  {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  iniciarText: {color: Colors.matriz, fontWeight: '700', fontSize: 13},
  empty:       {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
});
