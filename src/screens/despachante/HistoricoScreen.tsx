import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Image, TextInput, RefreshControl} from 'react-native';
import {Colors} from '../../theme/colors';

type Entrega = {
  id: string; cliente: string; empresa: string; destino: string;
  hora: string; data: string; volumes: number; fotos: string[];
};

const historico: Entrega[] = [
  {id: '#0133', cliente: 'Lucas Freitas', empresa: 'Trans Silva', destino: 'RJ - Lote B', hora: '14:32', data: 'Hoje', volumes: 2, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
  {id: '#0130', cliente: 'Paula Neves', empresa: 'Rápido Norte', destino: 'SP - Lote A', hora: '11:15', data: 'Hoje', volumes: 3, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
  {id: '#0128', cliente: 'Marcos Alves', empresa: 'Sul Cargas', destino: 'BH - Lote A', hora: '09:40', data: 'Hoje', volumes: 1, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
  {id: '#0125', cliente: 'Beatriz Costa', empresa: 'Trans Silva', destino: 'SP - Lote A', hora: '16:20', data: 'Ontem', volumes: 4, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200', 'https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
  {id: '#0120', cliente: 'Carlos Melo', empresa: 'Rápido Norte', destino: 'RJ - Lote C', hora: '10:05', data: 'Ontem', volumes: 2, fotos: ['https://via.placeholder.com/200']},
  {id: '#0115', cliente: 'Ana Beatriz', empresa: 'Trans Silva', destino: 'SP - Lote B', hora: '08:30', data: '2 dias atrás', volumes: 1, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
];

const filtrosDatas = ['Todos', 'Hoje', 'Ontem'];

export default function HistoricoScreen() {
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('Todos');
  const [detalhe, setDetalhe] = useState<Entrega | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtrados = historico.filter(p => {
    const q = busca.toLowerCase();
    const matchBusca = !q || p.id.includes(q) || p.cliente.toLowerCase().includes(q) || p.empresa.toLowerCase().includes(q);
    const matchData = filtroData === 'Todos' || p.data === filtroData;
    return matchBusca && matchData;
  });

  const totalFotos = historico.reduce((acc, p) => acc + p.fotos.length, 0);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Histórico</Text>
        <Text style={s.sub}>Entregas realizadas</Text>
      </View>

      {/* Resumo */}
      <View style={s.resumoRow}>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#86EFAC'}]}>{historico.length}</Text>
          <Text style={s.resumoLabel}>Entregas</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: Colors.pulso}]}>{totalFotos}</Text>
          <Text style={s.resumoLabel}>Fotos</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#60A5FA'}]}>{historico.reduce((a, p) => a + p.volumes, 0)}</Text>
          <Text style={s.resumoLabel}>Volumes</Text>
        </View>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar entrega..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      {/* Filtros data */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosScroll} contentContainerStyle={s.filtrosRow}>
        {filtrosDatas.map(f => (
          <TouchableOpacity key={f} style={[s.filtroChip, filtroData === f && s.filtroAtivo]} onPress={() => setFiltroData(f)}>
            <Text style={[s.filtroText, filtroData === f && s.filtroTextAtivo]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {filtrados.map(p => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => setDetalhe(p)} activeOpacity={0.8}>
            <View style={s.checkIcon}>
              <Text style={s.checkText}>✓</Text>
            </View>
            <View style={s.info}>
              <Text style={s.id}>{p.id} · {p.cliente}</Text>
              <Text style={s.empresa}>{p.empresa} · {p.volumes} vol.</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <View style={s.right}>
              <Text style={s.hora}>{p.hora}</Text>
              <Text style={s.data}>{p.data}</Text>
              <Text style={s.fotos}>📷 {p.fotos.length}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filtrados.length === 0 && <Text style={s.empty}>Nenhuma entrega encontrada</Text>}
      </ScrollView>

      {/* Modal detalhe */}
      <Modal visible={!!detalhe} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>{detalhe?.id}</Text>
              <View style={s.detRow}><Text style={s.detLabel}>Cliente</Text><Text style={s.detValue}>{detalhe?.cliente}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Empresa</Text><Text style={s.detValue}>{detalhe?.empresa}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Destino</Text><Text style={s.detValue}>{detalhe?.destino}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{detalhe?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Entregue às</Text><Text style={s.detValue}>{detalhe?.hora}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Data</Text><Text style={s.detValue}>{detalhe?.data}</Text></View>

              <Text style={s.sectionTitle}>Fotos ({detalhe?.fotos.length || 0})</Text>
              {detalhe && detalhe.fotos.length > 0 ? (
                <View style={s.fotosGrid}>
                  {detalhe.fotos.map((uri, i) => <Image key={i} source={{uri}} style={s.fotoImg} />)}
                </View>
              ) : (
                <Text style={s.semFotos}>Nenhuma foto</Text>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setDetalhe(null)}>
                <Text style={s.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    {flex: 1, backgroundColor: Colors.matriz},
  header:       {padding: 24, paddingTop: 56, paddingBottom: 12},
  title:        {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  sub:          {fontSize: 13, color: Colors.gray, marginTop: 4},
  resumoRow:    {flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 12},
  resumoCard:   {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  resumoValor:  {fontSize: 20, fontWeight: '800'},
  resumoLabel:  {fontSize: 10, color: Colors.gray, marginTop: 2, fontWeight: '600'},
  searchBox:    {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 10, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:   {fontSize: 16, marginRight: 8},
  searchInput:  {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  filtrosScroll:{maxHeight: 44, marginBottom: 10},
  filtrosRow:   {paddingHorizontal: 24, gap: 8},
  filtroChip:   {backgroundColor: '#162433', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1E3448'},
  filtroAtivo:  {backgroundColor: Colors.pulso + '20', borderColor: Colors.pulso},
  filtroText:   {fontSize: 13, color: Colors.gray, fontWeight: '600'},
  filtroTextAtivo:{color: Colors.pulso},
  card:         {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  checkIcon:    {width: 32, height: 32, borderRadius: 16, backgroundColor: '#052E16', alignItems: 'center', justifyContent: 'center'},
  checkText:    {color: Colors.pulso, fontWeight: '800', fontSize: 14},
  info:         {flex: 1},
  id:           {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  empresa:      {fontSize: 12, color: '#60A5FA', marginTop: 2},
  destino:      {fontSize: 12, color: Colors.gray, marginTop: 2},
  right:        {alignItems: 'flex-end', gap: 3},
  hora:         {fontSize: 12, color: Colors.gray},
  data:         {fontSize: 11, color: Colors.gray},
  fotos:        {fontSize: 12, color: Colors.pulso, fontWeight: '600'},
  empty:        {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
  overlay:      {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:        {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '85%'},
  sheetTitle:   {fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 16},
  detRow:       {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  detLabel:     {fontSize: 13, color: Colors.gray},
  detValue:     {fontSize: 13, fontWeight: '600', color: Colors.clareza},
  sectionTitle: {fontSize: 14, fontWeight: '700', color: Colors.pulso, marginTop: 20, marginBottom: 12},
  fotosGrid:    {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  fotoImg:      {width: 100, height: 100, borderRadius: 10},
  semFotos:     {fontSize: 13, color: Colors.gray, fontStyle: 'italic'},
  closeBtn:     {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText: {color: Colors.clareza, fontWeight: '600', fontSize: 15},
});
