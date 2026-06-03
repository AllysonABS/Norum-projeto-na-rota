import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image, RefreshControl, Alert} from 'react-native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

type Etapa = {nome: string; concluida: boolean; hora?: string};
type Status = 'aguardando' | 'em_transito' | 'entregue';

type Pedido = {
  id: string; cliente: string; despachante: string; excursao: string;
  status: Status; etapas: Etapa[]; fotos: string[]; data: string; volumes: string; descricao: string;
};

const clientes = ['João Silva', 'Maria Santos', 'Carlos Melo', 'Ana Beatriz', 'Loja do Pedro'];
const despachantes = ['Ricardo Gomes', 'Fernanda Lima', 'Paulo Mendes'];
const excursoes = ['Trans Silva - SP (Setor A, Vaga 12)', 'Rápido Norte - RJ (Setor B, Vaga 07)', 'Sul Cargas - BH (Setor A, Vaga 23)'];

const hoje = new Date().toLocaleDateString('pt-BR');

const pedidosIniciais: Pedido[] = [
  {
    id: '#0138', cliente: 'João Silva', despachante: 'Ricardo Gomes',
    excursao: 'Trans Silva - SP (Setor A, Vaga 12)', status: 'em_transito',
    volumes: '3', descricao: 'Caixas de eletrônicos', data: hoje,
    etapas: [
      {nome: 'Pedido recebido', concluida: true, hora: '08:30'},
      {nome: 'Coleta realizada', concluida: true, hora: '09:15'},
      {nome: 'Em rota para excursão', concluida: true, hora: '09:45'},
      {nome: 'Entregue na excursão', concluida: false},
    ],
    fotos: [],
  },
  {
    id: '#0137', cliente: 'Maria Santos', despachante: 'Fernanda Lima',
    excursao: 'Rápido Norte - RJ (Setor B, Vaga 07)', status: 'aguardando',
    volumes: '1', descricao: 'Envelope documentos', data: hoje,
    etapas: [
      {nome: 'Pedido recebido', concluida: true, hora: '10:00'},
      {nome: 'Coleta realizada', concluida: false},
      {nome: 'Em rota para excursão', concluida: false},
      {nome: 'Entregue na excursão', concluida: false},
    ],
    fotos: [],
  },
  {
    id: '#0136', cliente: 'Carlos Melo', despachante: 'Ricardo Gomes',
    excursao: 'Sul Cargas - BH (Setor A, Vaga 23)', status: 'entregue',
    volumes: '5', descricao: 'Peças automotivas', data: hoje,
    etapas: [
      {nome: 'Pedido recebido', concluida: true, hora: '07:00'},
      {nome: 'Coleta realizada', concluida: true, hora: '07:40'},
      {nome: 'Em rota para excursão', concluida: true, hora: '08:10'},
      {nome: 'Entregue na excursão', concluida: true, hora: '08:55'},
    ],
    fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200'],
  },
  {
    id: '#0130', cliente: 'Ana Beatriz', despachante: 'Paulo Mendes',
    excursao: 'Trans Silva - SP (Setor A, Vaga 12)', status: 'entregue',
    volumes: '2', descricao: 'Roupas', data: '10/01/2025',
    etapas: [
      {nome: 'Pedido recebido', concluida: true, hora: '08:00'},
      {nome: 'Coleta realizada', concluida: true, hora: '08:30'},
      {nome: 'Em rota para excursão', concluida: true, hora: '09:00'},
      {nome: 'Entregue na excursão', concluida: true, hora: '09:40'},
    ],
    fotos: ['https://via.placeholder.com/200'],
  },
];

const statusConfig: Record<Status, {label: string; cor: string}> = {
  aguardando: {label: 'Aguardando', cor: '#F59E0B'},
  em_transito: {label: 'Em trânsito', cor: Colors.pulso},
  entregue: {label: 'Entregue', cor: '#86EFAC'},
};

const filtros: {label: string; value: Status | 'todos'}[] = [
  {label: 'Todos', value: 'todos'},
  {label: 'Aguardando', value: 'aguardando'},
  {label: 'Em trânsito', value: 'em_transito'},
  {label: 'Entregue', value: 'entregue'},
];

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciais);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Status | 'todos'>('todos');
  const [aba, setAba] = useState<'hoje' | 'historico'>('hoje');
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();

  // Form novo pedido
  const [novoCliente, setNovoCliente] = useState('');
  const [novoDespachante, setNovoDespachante] = useState('');
  const [novoExcursao, setNovoExcursao] = useState('');
  const [novoVolumes, setNovoVolumes] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [showPickerCliente, setShowPickerCliente] = useState(false);
  const [showPickerDesp, setShowPickerDesp] = useState(false);
  const [showPickerExc, setShowPickerExc] = useState(false);

  const limparNovo = () => {
    setNovoCliente(''); setNovoDespachante(''); setNovoExcursao('');
    setNovoVolumes(''); setNovoDescricao('');
  };

  const criarPedido = () => {
    if (!novoCliente || !novoDespachante || !novoExcursao || !novoVolumes) {
      Alert.alert('Preencha os campos obrigatórios'); return;
    }
    const novo: Pedido = {
      id: `#${String(Date.now()).slice(-4)}`,
      cliente: novoCliente, despachante: novoDespachante, excursao: novoExcursao,
      volumes: novoVolumes, descricao: novoDescricao, status: 'aguardando', data: hoje,
      etapas: [
        {nome: 'Pedido recebido', concluida: true, hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})},
        {nome: 'Coleta realizada', concluida: false},
        {nome: 'Em rota para excursão', concluida: false},
        {nome: 'Entregue na excursão', concluida: false},
      ],
      fotos: [],
    };
    setPedidos(prev => [novo, ...prev]);
    limparNovo(); setModalNovo(false);
    showToast('Pedido criado com sucesso!', 'success');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); showToast('Atualizado', 'info'); }, 1000);
  }, []);

  const pedidosFiltrados = pedidos.filter(p => {
    const q = busca.toLowerCase();
    const matchBusca = !q || p.id.includes(q) || p.cliente.toLowerCase().includes(q) || p.despachante.toLowerCase().includes(q);
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    const matchAba = aba === 'hoje' ? p.data === hoje : p.data !== hoje;
    return matchBusca && matchFiltro && matchAba;
  });

  return (
    <View style={s.container}>
      <Toast />
      <View style={s.header}>
        <Text style={s.title}>Pedidos</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalNovo(true)}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Abas hoje/histórico */}
      <View style={s.abasRow}>
        <TouchableOpacity style={[s.aba, aba === 'hoje' && s.abaAtiva]} onPress={() => setAba('hoje')}>
          <Text style={[s.abaText, aba === 'hoje' && s.abaTextAtiva]}>Hoje</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.aba, aba === 'historico' && s.abaAtiva]} onPress={() => setAba('historico')}>
          <Text style={[s.abaText, aba === 'historico' && s.abaTextAtiva]}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar pedido..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      {/* Filtros */}
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
        {pedidosFiltrados.length === 0 && (
          <Text style={s.empty}>Nenhum pedido encontrado</Text>
        )}
        {pedidosFiltrados.map(p => {
          const cfg = statusConfig[p.status];
          const progresso = p.etapas.filter(e => e.concluida).length;
          return (
            <TouchableOpacity key={p.id} style={s.card} onPress={() => setDetalhe(p)} activeOpacity={0.7}>
              <View style={s.cardHeader}>
                <Text style={s.pedidoId}>{p.id}</Text>
                <View style={[s.badge, {backgroundColor: cfg.cor + '20'}]}>
                  <Text style={[s.badgeText, {color: cfg.cor}]}>{cfg.label}</Text>
                </View>
              </View>
              <Text style={s.cardCliente}>👤 {p.cliente}</Text>
              <Text style={s.cardDesp}>🚚 {p.despachante} · {p.volumes} vol.</Text>
              <View style={s.progressRow}>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, {width: `${(progresso / p.etapas.length) * 100}%`, backgroundColor: cfg.cor}]} />
                </View>
                <Text style={s.progressLabel}>{progresso}/{p.etapas.length}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal detalhe */}
      <Modal visible={!!detalhe} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>{detalhe?.id}</Text>
                {detalhe && (
                  <View style={[s.badge, {backgroundColor: statusConfig[detalhe.status].cor + '20'}]}>
                    <Text style={[s.badgeText, {color: statusConfig[detalhe.status].cor}]}>{statusConfig[detalhe.status].label}</Text>
                  </View>
                )}
              </View>
              <View style={s.detRow}><Text style={s.detLabel}>Cliente</Text><Text style={s.detValue}>{detalhe?.cliente}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Despachante</Text><Text style={s.detValue}>{detalhe?.despachante}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Excursão</Text><Text style={s.detValue}>{detalhe?.excursao}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{detalhe?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Descrição</Text><Text style={s.detValue}>{detalhe?.descricao || '—'}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Data</Text><Text style={s.detValue}>{detalhe?.data}</Text></View>

              <Text style={s.sectionTitle}>Progresso</Text>
              {detalhe?.etapas.map((etapa, i) => (
                <View key={i} style={s.etapaRow}>
                  <View style={[s.etapaDot, etapa.concluida && s.etapaDotDone]} />
                  {i < (detalhe?.etapas.length ?? 0) - 1 && (
                    <View style={[s.etapaLine, etapa.concluida && s.etapaLineDone]} />
                  )}
                  <View style={s.etapaInfo}>
                    <Text style={[s.etapaNome, etapa.concluida && s.etapaNomeDone]}>{etapa.nome}</Text>
                    {etapa.hora && <Text style={s.etapaHora}>{etapa.hora}</Text>}
                  </View>
                </View>
              ))}

              <Text style={s.sectionTitle}>Fotos {detalhe?.fotos.length ? `(${detalhe.fotos.length})` : ''}</Text>
              {detalhe && detalhe.fotos.length > 0 ? (
                <View style={s.fotosRow}>
                  {detalhe.fotos.map((uri, i) => <Image key={i} source={{uri}} style={s.foto} />)}
                </View>
              ) : (
                <Text style={s.semFotos}>Nenhuma foto registrada ainda</Text>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setDetalhe(null)}>
                <Text style={s.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal criar pedido */}
      <Modal visible={modalNovo} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>Novo Pedido</Text>

              <Text style={s.label}>Cliente *</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPickerCliente(!showPickerCliente)}>
                <Text style={novoCliente ? s.selectValue : s.selectPlaceholder}>{novoCliente || 'Selecionar cliente...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerCliente && (
                <View style={s.pickerList}>
                  {clientes.map(c => (
                    <TouchableOpacity key={c} style={s.pickerItem} onPress={() => { setNovoCliente(c); setShowPickerCliente(false); }}>
                      <Text style={s.pickerItemText}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>Despachante *</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPickerDesp(!showPickerDesp)}>
                <Text style={novoDespachante ? s.selectValue : s.selectPlaceholder}>{novoDespachante || 'Selecionar despachante...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerDesp && (
                <View style={s.pickerList}>
                  {despachantes.map(d => (
                    <TouchableOpacity key={d} style={s.pickerItem} onPress={() => { setNovoDespachante(d); setShowPickerDesp(false); }}>
                      <Text style={s.pickerItemText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>Excursão de destino *</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPickerExc(!showPickerExc)}>
                <Text style={novoExcursao ? s.selectValue : s.selectPlaceholder}>{novoExcursao || 'Selecionar excursão...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerExc && (
                <View style={s.pickerList}>
                  {excursoes.map(e => (
                    <TouchableOpacity key={e} style={s.pickerItem} onPress={() => { setNovoExcursao(e); setShowPickerExc(false); }}>
                      <Text style={s.pickerItemText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>Quantidade de volumes *</Text>
              <TextInput style={s.input} placeholder="Ex: 3" placeholderTextColor={Colors.gray} value={novoVolumes} onChangeText={setNovoVolumes} keyboardType="numeric" />

              <Text style={s.label}>Descrição</Text>
              <TextInput style={[s.input, {height: 70, textAlignVertical: 'top', paddingTop: 12}]} placeholder="Descreva os itens..." placeholderTextColor={Colors.gray} value={novoDescricao} onChangeText={setNovoDescricao} multiline />

              <TouchableOpacity style={s.saveBtn} onPress={criarPedido}>
                <Text style={s.saveBtnText}>Criar Pedido</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { limparNovo(); setModalNovo(false); }}>
                <Text style={s.cancel}>Cancelar</Text>
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
  header:       {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 12},
  title:        {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  addBtn:       {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  addBtnText:   {color: Colors.matriz, fontWeight: '700', fontSize: 14},
  abasRow:      {flexDirection: 'row', marginHorizontal: 24, marginBottom: 12, backgroundColor: '#162433', borderRadius: 8, padding: 4},
  aba:          {flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6},
  abaAtiva:     {backgroundColor: Colors.pulso},
  abaText:      {fontSize: 14, fontWeight: '600', color: Colors.gray},
  abaTextAtiva: {color: Colors.matriz},
  searchBox:    {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 10, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:   {fontSize: 16, marginRight: 8},
  searchInput:  {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  filtrosScroll:{maxHeight: 44, marginBottom: 10},
  filtrosRow:   {paddingHorizontal: 24, gap: 8, justifyContent: 'center', flexGrow: 1, alignItems: 'center'},
  filtroChip:   {backgroundColor: '#162433', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#1E3448'},
  filtroAtivo:  {backgroundColor: Colors.pulso + '20', borderColor: Colors.pulso},
  filtroText:   {fontSize: 13, color: Colors.gray, fontWeight: '600'},
  filtroTextAtivo:{color: Colors.pulso},
  empty:        {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
  card:         {backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448'},
  cardHeader:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  pedidoId:     {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  badge:        {borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  badgeText:    {fontSize: 12, fontWeight: '700'},
  cardCliente:  {fontSize: 13, color: Colors.clareza, marginBottom: 4},
  cardDesp:     {fontSize: 13, color: Colors.gray, marginBottom: 10},
  progressRow:  {flexDirection: 'row', alignItems: 'center', gap: 10},
  progressBg:   {flex: 1, height: 6, backgroundColor: '#1E3448', borderRadius: 3, overflow: 'hidden'},
  progressFill: {height: 6, borderRadius: 3},
  progressLabel:{fontSize: 12, color: Colors.gray, fontWeight: '600'},
  overlay:      {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:        {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '90%'},
  sheetHeader:  {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
  sheetTitle:   {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  detRow:       {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  detLabel:     {fontSize: 13, color: Colors.gray},
  detValue:     {fontSize: 13, fontWeight: '600', color: Colors.clareza, flex: 1, textAlign: 'right'},
  sectionTitle: {fontSize: 14, fontWeight: '700', color: Colors.pulso, marginTop: 20, marginBottom: 12},
  etapaRow:     {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, position: 'relative'},
  etapaDot:     {width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#1E3448', backgroundColor: '#0F1F2E', marginRight: 12, marginTop: 2},
  etapaDotDone: {backgroundColor: Colors.pulso, borderColor: Colors.pulso},
  etapaLine:    {position: 'absolute', left: 6, top: 16, width: 2, height: 24, backgroundColor: '#1E3448'},
  etapaLineDone:{backgroundColor: Colors.pulso},
  etapaInfo:    {flex: 1},
  etapaNome:    {fontSize: 14, color: Colors.gray},
  etapaNomeDone:{color: Colors.clareza, fontWeight: '600'},
  etapaHora:    {fontSize: 12, color: Colors.gray, marginTop: 2},
  fotosRow:     {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  foto:         {width: 100, height: 100, borderRadius: 10},
  semFotos:     {fontSize: 13, color: Colors.gray, fontStyle: 'italic'},
  closeBtn:     {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText: {color: Colors.clareza, fontWeight: '600', fontSize: 15},
  label:        {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  input:        {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  selectBtn:    {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  selectValue:  {fontSize: 15, color: Colors.clareza},
  selectPlaceholder:{fontSize: 15, color: Colors.gray},
  selectArrow:  {fontSize: 12, color: Colors.gray},
  pickerList:   {backgroundColor: '#1E3448', borderRadius: 8, marginTop: 4, overflow: 'hidden'},
  pickerItem:   {paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#0F1F2E'},
  pickerItemText:{fontSize: 14, color: Colors.clareza},
  saveBtn:      {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:  {color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:       {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
