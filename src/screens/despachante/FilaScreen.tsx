import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

type Pedido = {
  id: string; cliente: string; empresa: string; destino: string;
  urgente: boolean; volumes: number; tempoFila: string;
};

const pedidosIniciais: Pedido[] = [
  {id: '#0140', cliente: 'Ana Beatriz', empresa: 'Trans Silva', destino: 'SP - Lote A', urgente: true, volumes: 3, tempoFila: '5 min'},
  {id: '#0139', cliente: 'Bruno Carvalho', empresa: 'Rápido Norte', destino: 'RJ - Lote B', urgente: false, volumes: 1, tempoFila: '12 min'},
  {id: '#0138', cliente: 'João Silva', empresa: 'Trans Silva', destino: 'SP - Lote A', urgente: false, volumes: 5, tempoFila: '25 min'},
  {id: '#0137', cliente: 'Maria Santos', empresa: 'Sul Cargas', destino: 'BH - Lote A', urgente: false, volumes: 2, tempoFila: '40 min'},
];

const excursoes = ['Todas', 'SP - Lote A', 'RJ - Lote B', 'BH - Lote A'];

export default function FilaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciais);
  const [busca, setBusca] = useState('');
  const [filtroExcursao, setFiltroExcursao] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);


  const filtrados = pedidos.filter(p => {
    const q = busca.toLowerCase();
    const matchBusca = !q || p.id.includes(q) || p.cliente.toLowerCase().includes(q) || p.empresa.toLowerCase().includes(q);
    const matchExcursao = filtroExcursao === 'Todas' || p.destino === filtroExcursao;
    return matchBusca && matchExcursao;
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={s.title}>Fila de Expedição</Text>
          <View style={s.badge}><Text style={s.badgeText}>{pedidos.length}</Text></View>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={() => rootNavigation.replace('RoleSelect')}>
          <Text style={s.exitText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View style={s.resumoRow}>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#F59E0B'}]}>{pedidos.length}</Text>
          <Text style={s.resumoLabel}>Na fila</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: Colors.pulso}]}>2</Text>
          <Text style={s.resumoLabel}>Em andamento</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#EF4444'}]}>{pedidos.filter(p => p.urgente).length}</Text>
          <Text style={s.resumoLabel}>Urgentes</Text>
        </View>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar pedido..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      {/* Filtro por excursão */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosScroll} contentContainerStyle={s.filtrosRow}>
        {excursoes.map(e => (
          <TouchableOpacity key={e} style={[s.filtroChip, filtroExcursao === e && s.filtroAtivo]} onPress={() => setFiltroExcursao(e)}>
            <Text style={[s.filtroText, filtroExcursao === e && s.filtroTextAtivo]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {filtrados.map(p => (
          <View key={p.id} style={s.card}>
            <View style={s.cardContent}>
              <View style={s.cardTop}>
                <Text style={s.pedidoId}>{p.id}</Text>
                {p.urgente && <View style={s.urgente}><Text style={s.urgenteText}>URGENTE</Text></View>}
                <Text style={s.tempoFila}>⏱️ {p.tempoFila}</Text>
              </View>
              <Text style={s.cliente}>{p.cliente}</Text>
              <Text style={s.empresa}>{p.empresa} · {p.volumes} vol.</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity
                style={s.iniciarBtn}
                onPress={() => navigation.navigate('Checklist', {pedidoId: p.id, etapa: 'coleta'})}>
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
  urgente:     {backgroundColor: '#7F1D1D', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2},
  urgenteText: {fontSize: 10, fontWeight: '700', color: '#FCA5A5'},
  tempoFila:   {fontSize: 11, color: Colors.gray, marginLeft: 'auto'},
  cliente:     {fontSize: 14, color: Colors.clareza, marginBottom: 2},
  empresa:     {fontSize: 13, color: '#60A5FA', marginBottom: 2},
  destino:     {fontSize: 12, color: Colors.gray},
  actions:     {alignItems: 'center', gap: 8},
  iniciarBtn:  {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8},
  iniciarText: {color: Colors.matriz, fontWeight: '700', fontSize: 13},
  empty:       {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
  filtrosScroll:{maxHeight: 44, marginBottom: 10},
  filtrosRow:   {paddingHorizontal: 24, gap: 8},
  filtroChip:   {backgroundColor: '#162433', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1E3448'},
  filtroAtivo:  {backgroundColor: Colors.pulso + '20', borderColor: Colors.pulso},
  filtroText:   {fontSize: 13, color: Colors.gray, fontWeight: '600'},
  filtroTextAtivo:{color: Colors.pulso},
});
