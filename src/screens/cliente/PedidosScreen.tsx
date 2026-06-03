import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image, RefreshControl} from 'react-native';
import {Colors} from '../../theme/colors';
import StatusBadge from '../../components/StatusBadge';

type Status = 'aguardando' | 'em_transito' | 'entregue' | 'cancelado';
type Pedido = {
  id: string; empresa: string; excursao: string; status: Status;
  volumes: string; descricao: string; previsao: string;
  timeline: {hora: string; evento: string}[];
  fotos: string[];
};

const pedidos: Pedido[] = [
  {
    id: '#0138', empresa: 'Trans Silva', excursao: 'SP - Lote A', status: 'em_transito',
    volumes: '3', descricao: 'Caixas de eletrônicos', previsao: 'Hoje, ~14:00',
    timeline: [
      {hora: '08:00', evento: 'Pedido recebido'},
      {hora: '09:30', evento: 'Coletado pelo despachante'},
      {hora: '11:15', evento: 'Em rota para excursão'},
    ],
    fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200'],
  },
  {
    id: '#0131', empresa: 'Rápido Norte', excursao: 'RJ - Lote B', status: 'entregue',
    volumes: '1', descricao: 'Envelope documentos', previsao: '',
    timeline: [
      {hora: '07:00', evento: 'Pedido recebido'},
      {hora: '08:45', evento: 'Coletado pelo despachante'},
      {hora: '10:00', evento: 'Entregue na excursão'},
    ],
    fotos: ['https://via.placeholder.com/200'],
  },
  {
    id: '#0125', empresa: 'Trans Silva', excursao: 'BH - Lote A', status: 'aguardando',
    volumes: '2', descricao: 'Peças automotivas', previsao: 'Hoje, ~16:00',
    timeline: [{hora: '06:00', evento: 'Pedido recebido'}],
    fotos: [],
  },
  {
    id: '#0119', empresa: 'Rápido Norte', excursao: 'RJ - Lote C', status: 'entregue',
    volumes: '5', descricao: 'Roupas', previsao: '',
    timeline: [
      {hora: '07:00', evento: 'Pedido recebido'},
      {hora: '08:45', evento: 'Coletado'},
      {hora: '10:00', evento: 'Entregue'},
    ],
    fotos: ['https://via.placeholder.com/200'],
  },
];

const filtros: {label: string; value: Status | 'todos'}[] = [
  {label: 'Todos', value: 'todos'},
  {label: 'Aguardando', value: 'aguardando'},
  {label: 'Em trânsito', value: 'em_transito'},
  {label: 'Entregue', value: 'entregue'},
];

export default function PedidosScreen() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Status | 'todos'>('todos');
  const [selecionado, setSelecionado] = useState<Pedido | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtrados = pedidos.filter(p => {
    const q = busca.toLowerCase();
    const matchBusca = !q || p.id.includes(q) || p.empresa.toLowerCase().includes(q) || p.excursao.toLowerCase().includes(q);
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    return matchBusca && matchFiltro;
  });

  const emAndamento = pedidos.filter(p => p.status === 'em_transito').length;
  const aguardando = pedidos.filter(p => p.status === 'aguardando').length;
  const entregues = pedidos.filter(p => p.status === 'entregue').length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Meus Pedidos</Text>
      </View>

      {/* Resumo */}
      <View style={s.resumoRow}>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: Colors.pulso}]}>{emAndamento}</Text>
          <Text style={s.resumoLabel}>Em trânsito</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#F59E0B'}]}>{aguardando}</Text>
          <Text style={s.resumoLabel}>Aguardando</Text>
        </View>
        <View style={s.resumoCard}>
          <Text style={[s.resumoValor, {color: '#86EFAC'}]}>{entregues}</Text>
          <Text style={s.resumoLabel}>Entregues</Text>
        </View>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar pedido..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosScroll} contentContainerStyle={s.filtrosRow}>
        {filtros.map(f => (
          <TouchableOpacity key={f.value} style={[s.filtroChip, filtro === f.value && s.filtroAtivo]} onPress={() => setFiltro(f.value)}>
            <Text style={[s.filtroText, filtro === f.value && s.filtroTextAtivo]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {filtrados.length === 0 && <Text style={s.empty}>Nenhum pedido encontrado</Text>}
        {filtrados.map(p => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => setSelecionado(p)} activeOpacity={0.8}>
            <View style={s.cardLeft}>
              <Text style={s.pedidoId}>{p.id}</Text>
              <Text style={s.empresa}>{p.empresa}</Text>
              <Text style={s.excursao}>{p.excursao} · {p.volumes} vol.</Text>
              {p.previsao ? <Text style={s.previsao}>⏱️ {p.previsao}</Text> : null}
            </View>
            <StatusBadge status={p.status} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selecionado} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.sheetHeader}>
                <View>
                  <Text style={s.sheetId}>{selecionado?.id}</Text>
                  <Text style={s.sheetEmpresa}>{selecionado?.empresa} · {selecionado?.excursao}</Text>
                </View>
                {selecionado && <StatusBadge status={selecionado.status} />}
              </View>

              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{selecionado?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Descrição</Text><Text style={s.detValue}>{selecionado?.descricao || '—'}</Text></View>
              {selecionado?.previsao ? <View style={s.detRow}><Text style={s.detLabel}>Previsão</Text><Text style={[s.detValue, {color: Colors.pulso}]}>{selecionado.previsao}</Text></View> : null}

              <Text style={s.sectionTitle}>Histórico</Text>
              {selecionado?.timeline.map((t, i) => (
                <View key={i} style={s.timelineItem}>
                  <View style={s.timelineLine}>
                    <View style={[s.timelineDot, i === 0 && {backgroundColor: Colors.pulso}]} />
                    {i < (selecionado.timeline.length - 1) && <View style={s.timelineBar} />}
                  </View>
                  <View style={s.timelineText}>
                    <Text style={s.timelineHora}>{t.hora}</Text>
                    <Text style={s.timelineEvento}>{t.evento}</Text>
                  </View>
                </View>
              ))}

              <Text style={s.sectionTitle}>Fotos {selecionado?.fotos.length ? `(${selecionado.fotos.length})` : ''}</Text>
              {selecionado && selecionado.fotos.length > 0 ? (
                <View style={s.fotosRow}>
                  {selecionado.fotos.map((uri, i) => <Image key={i} source={{uri}} style={s.foto} />)}
                </View>
              ) : (
                <Text style={s.semFotos}>Nenhuma foto registrada ainda</Text>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setSelecionado(null)}>
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
  container:      {flex: 1, backgroundColor: Colors.matriz},
  header:         {padding: 24, paddingTop: 56, paddingBottom: 12},
  title:          {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  resumoRow:      {flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginBottom: 14},
  resumoCard:     {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  resumoValor:    {fontSize: 20, fontWeight: '800'},
  resumoLabel:    {fontSize: 10, color: Colors.gray, marginTop: 2, fontWeight: '600'},
  searchBox:      {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 10, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:     {fontSize: 16, marginRight: 8},
  searchInput:    {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  filtrosScroll:  {maxHeight: 44, marginBottom: 10},
  filtrosRow:     {paddingHorizontal: 24, gap: 8, justifyContent: 'center', flexGrow: 1, alignItems: 'center'},
  filtroChip:     {backgroundColor: '#162433', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1E3448'},
  filtroAtivo:    {backgroundColor: Colors.pulso + '20', borderColor: Colors.pulso},
  filtroText:     {fontSize: 13, color: Colors.gray, fontWeight: '600'},
  filtroTextAtivo:{color: Colors.pulso},
  empty:          {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
  card:           {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1E3448'},
  cardLeft:       {flex: 1, marginRight: 12},
  pedidoId:       {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  empresa:        {fontSize: 13, color: Colors.gray, marginTop: 2},
  excursao:       {fontSize: 12, color: '#60A5FA', marginTop: 2},
  previsao:       {fontSize: 12, color: Colors.pulso, marginTop: 4},
  overlay:        {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:          {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '85%'},
  sheetHeader:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20},
  sheetId:        {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  sheetEmpresa:   {fontSize: 13, color: Colors.gray, marginTop: 2},
  detRow:         {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  detLabel:       {fontSize: 13, color: Colors.gray},
  detValue:       {fontSize: 13, fontWeight: '600', color: Colors.clareza, flex: 1, textAlign: 'right'},
  sectionTitle:   {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 16, marginTop: 20},
  timelineItem:   {flexDirection: 'row', gap: 12, marginBottom: 4},
  timelineLine:   {alignItems: 'center', width: 16},
  timelineDot:    {width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E3448', marginTop: 3},
  timelineBar:    {width: 2, flex: 1, backgroundColor: '#1E3448', marginTop: 4},
  timelineText:   {flex: 1, paddingBottom: 16},
  timelineHora:   {fontSize: 12, color: Colors.gray, marginBottom: 2},
  timelineEvento: {fontSize: 14, color: Colors.clareza, fontWeight: '500'},
  fotosRow:       {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  foto:           {width: 100, height: 100, borderRadius: 10},
  semFotos:       {fontSize: 13, color: Colors.gray, fontStyle: 'italic'},
  closeBtn:       {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText:   {color: Colors.clareza, fontWeight: '600', fontSize: 15},
});
