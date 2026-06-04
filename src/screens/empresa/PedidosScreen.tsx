import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Image, RefreshControl, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';
import {useAlert} from '../../components/CustomAlert';
import {useAuth} from '../../context/AuthContext';
import PhotoGallery from '../../components/PhotoGallery';
import {criarPedido, listarPedidosEmpresa, listarClientesEmpresa, listarDespachantes, listarExcursoes, PedidoData} from '../../services/api';
import {formatHora} from '../../utils/date';

type Status = 'aguardando' | 'em_transito' | 'entregue';

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
  const {empresa} = useAuth();
  const {showToast} = useToast();
  const {show} = useAlert();
  const [pedidos, setPedidos] = useState<PedidoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Status | 'todos'>('todos');
  const [detalhe, setDetalhe] = useState<PedidoData | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dados para o formulário de criar pedido
  const [clientes, setClientes] = useState<any[]>([]);
  const [despachantes, setDespachantes] = useState<any[]>([]);
  const [excursoes, setExcursoes] = useState<any[]>([]);
  const [novoCliente, setNovoCliente] = useState<any>(null);
  const [novoDespachante, setNovoDespachante] = useState<any>(null);
  const [novoExcursao, setNovoExcursao] = useState<any>(null);
  const [novoVolumes, setNovoVolumes] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [showPickerCliente, setShowPickerCliente] = useState(false);
  const [showPickerDesp, setShowPickerDesp] = useState(false);
  const [showPickerExc, setShowPickerExc] = useState(false);
  const [criando, setCriando] = useState(false);

  const carregar = async () => {
    if (!empresa?.id) return;
    const res = await listarPedidosEmpresa(empresa.id);
    if (res.success && res.pedidos) setPedidos(res.pedidos);
  };

  const carregarDadosForm = async () => {
    if (!empresa?.id) return;
    const [resCli, resDesp, resExc] = await Promise.all([
      listarClientesEmpresa(empresa.id),
      listarDespachantes(empresa.id),
      listarExcursoes(empresa.id),
    ]);
    if (resCli.success && resCli.clientes) setClientes(resCli.clientes);
    if (resDesp.success && resDesp.despachantes) setDespachantes(resDesp.despachantes);
    if (resExc.success && resExc.excursoes) setExcursoes(resExc.excursoes);
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [empresa?.id]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar().finally(() => setRefreshing(false));
  }, [empresa?.id]);

  const abrirNovo = () => {
    carregarDadosForm();
    setNovoCliente(null); setNovoDespachante(null); setNovoExcursao(null);
    setNovoVolumes(''); setNovoDescricao('');
    setModalNovo(true);
  };

  const handleCriar = async () => {
    if (!novoCliente || !novoDespachante || !novoExcursao || !novoVolumes) {
      show({title: 'Atenção', message: 'Preencha os campos obrigatórios.', type: 'warning'}); return;
    }
    if (!empresa?.id) return;
    setCriando(true);
    const res = await criarPedido(empresa.id, {
      cliente_id: novoCliente.cliente_id || undefined,
      despachante_id: novoDespachante.id || undefined,
      excursao_id: novoExcursao.id || undefined,
      cliente_nome: novoCliente.nome,
      despachante_nome: novoDespachante.nome,
      excursao_nome: `${novoExcursao.nome} (Setor ${novoExcursao.setor}, Vaga ${novoExcursao.vaga})`,
      volumes: parseInt(novoVolumes, 10),
      descricao: novoDescricao || undefined,
    });
    setCriando(false);
    if (res.success) {
      showToast('Pedido criado com sucesso!', 'success');
      setModalNovo(false);
      carregar();
    } else {
      show({title: 'Erro', message: res.error || 'Falha ao criar pedido.', type: 'error'});
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const q = busca.toLowerCase();
    const matchBusca = !q || p.cliente_nome.toLowerCase().includes(q) || p.despachante_nome.toLowerCase().includes(q) || p.excursao_nome.toLowerCase().includes(q);
    const matchFiltro = filtro === 'todos' || p.status === filtro;
    return matchBusca && matchFiltro;
  });

  if (loading) {
    return <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={Colors.pulso} /></View>;
  }

  return (
    <View style={s.container}>
      <Toast />
      <View style={s.header}>
        <Text style={s.title}>Pedidos</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirNovo}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
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
        {pedidosFiltrados.length === 0 && <Text style={s.empty}>Nenhum pedido encontrado</Text>}
        {pedidosFiltrados.map(p => {
          const cfg = statusConfig[p.status];
          const etapas = p.etapas || [];
          const progresso = etapas.filter(e => e.concluida).length;
          return (
            <TouchableOpacity key={p.id} style={s.card} onPress={() => setDetalhe(p)} activeOpacity={0.7}>
              <View style={s.cardHeader}>
                <Text style={s.pedidoId}>#{p.numero}</Text>
                <View style={[s.badge, {backgroundColor: cfg.cor + '20'}]}>
                  <Text style={[s.badgeText, {color: cfg.cor}]}>{cfg.label}</Text>
                </View>
              </View>
              <Text style={s.cardCliente}>👤 {p.cliente_nome}</Text>
              <Text style={s.cardDesp}>🚚 {p.despachante_nome} · {p.volumes} vol.</Text>
              <View style={s.progressRow}>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, {width: `${(progresso / Math.max(etapas.length, 1)) * 100}%`, backgroundColor: cfg.cor}]} />
                </View>
                <Text style={s.progressLabel}>{progresso}/{etapas.length}</Text>
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
                <Text style={s.sheetTitle}>#{detalhe?.numero}</Text>
                {detalhe && (
                  <View style={[s.badge, {backgroundColor: statusConfig[detalhe.status].cor + '20'}]}>
                    <Text style={[s.badgeText, {color: statusConfig[detalhe.status].cor}]}>{statusConfig[detalhe.status].label}</Text>
                  </View>
                )}
              </View>
              <View style={s.detRow}><Text style={s.detLabel}>Cliente</Text><Text style={s.detValue}>{detalhe?.cliente_nome}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Despachante</Text><Text style={s.detValue}>{detalhe?.despachante_nome}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Excursão</Text><Text style={s.detValue}>{detalhe?.excursao_nome}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{detalhe?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Descrição</Text><Text style={s.detValue}>{detalhe?.descricao || '—'}</Text></View>

              <Text style={s.sectionTitle}>Progresso</Text>
              {detalhe?.etapas?.map((etapa, i) => (
                <View key={etapa.id} style={s.etapaRow}>
                  <View style={[s.etapaDot, etapa.concluida && s.etapaDotDone]} />
                  {i < (detalhe.etapas?.length ?? 0) - 1 && <View style={[s.etapaLine, etapa.concluida && s.etapaLineDone]} />}
                  <View style={s.etapaInfo}>
                    <Text style={[s.etapaNome, etapa.concluida && s.etapaNomeDone]}>{etapa.nome}</Text>
                    {etapa.hora && <Text style={s.etapaHora}>{formatHora(etapa.hora)}</Text>}
                  </View>
                </View>
              ))}

              {detalhe?.fotos && detalhe.fotos.length > 0 && (
                <>
                  <Text style={s.sectionTitle}>Fotos ({detalhe.fotos.length})</Text>
                  <PhotoGallery fotos={detalhe.fotos} />
                </>
              )}

              {detalhe?.observacao ? (
                <>
                  <Text style={s.sectionTitle}>Observação</Text>
                  <Text style={s.obsText}>{detalhe.observacao}</Text>
                </>
              ) : null}

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
                <Text style={novoCliente ? s.selectValue : s.selectPlaceholder}>{novoCliente?.nome || 'Selecionar cliente...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerCliente && (
                <View style={s.pickerList}>
                  {clientes.map(c => (
                    <TouchableOpacity key={c.vinculo_id} style={s.pickerItem} onPress={() => { setNovoCliente(c); setShowPickerCliente(false); }}>
                      <Text style={s.pickerItemText}>{c.nome}</Text>
                    </TouchableOpacity>
                  ))}
                  {clientes.length === 0 && <Text style={s.pickerEmpty}>Nenhum cliente vinculado</Text>}
                </View>
              )}

              <Text style={s.label}>Despachante *</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPickerDesp(!showPickerDesp)}>
                <Text style={novoDespachante ? s.selectValue : s.selectPlaceholder}>{novoDespachante?.nome || 'Selecionar despachante...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerDesp && (
                <View style={s.pickerList}>
                  {despachantes.map(d => (
                    <TouchableOpacity key={d.id} style={s.pickerItem} onPress={() => { setNovoDespachante(d); setShowPickerDesp(false); }}>
                      <Text style={s.pickerItemText}>{d.nome}</Text>
                    </TouchableOpacity>
                  ))}
                  {despachantes.length === 0 && <Text style={s.pickerEmpty}>Nenhum despachante cadastrado</Text>}
                </View>
              )}

              <Text style={s.label}>Excursão de destino *</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowPickerExc(!showPickerExc)}>
                <Text style={novoExcursao ? s.selectValue : s.selectPlaceholder}>{novoExcursao ? `${novoExcursao.nome} (Setor ${novoExcursao.setor}, Vaga ${novoExcursao.vaga})` : 'Selecionar excursão...'}</Text>
                <Text style={s.selectArrow}>▼</Text>
              </TouchableOpacity>
              {showPickerExc && (
                <View style={s.pickerList}>
                  {excursoes.map(e => (
                    <TouchableOpacity key={e.id} style={s.pickerItem} onPress={() => { setNovoExcursao(e); setShowPickerExc(false); }}>
                      <Text style={s.pickerItemText}>{e.nome} (Setor {e.setor}, Vaga {e.vaga})</Text>
                    </TouchableOpacity>
                  ))}
                  {excursoes.length === 0 && <Text style={s.pickerEmpty}>Nenhuma excursão cadastrada</Text>}
                </View>
              )}

              <Text style={s.label}>Quantidade de volumes *</Text>
              <TextInput style={s.input} placeholder="Ex: 3" placeholderTextColor={Colors.gray} value={novoVolumes} onChangeText={setNovoVolumes} keyboardType="numeric" />

              <Text style={s.label}>Descrição</Text>
              <TextInput style={[s.input, {height: 70, textAlignVertical: 'top', paddingTop: 12}]} placeholder="Descreva os itens..." placeholderTextColor={Colors.gray} value={novoDescricao} onChangeText={setNovoDescricao} multiline />

              <TouchableOpacity style={s.saveBtn} onPress={handleCriar} disabled={criando}>
                <Text style={s.saveBtnText}>{criando ? 'Criando...' : 'Criar Pedido'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalNovo(false)}>
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
  closeBtn:     {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText: {color: Colors.clareza, fontWeight: '600', fontSize: 15},
  fotosRow:     {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  foto:         {width: 100, height: 100, borderRadius: 10},
  obsText:      {fontSize: 14, color: Colors.clareza, lineHeight: 20},
  label:        {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  input:        {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  selectBtn:    {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  selectValue:  {fontSize: 15, color: Colors.clareza, flex: 1},
  selectPlaceholder:{fontSize: 15, color: Colors.gray},
  selectArrow:  {fontSize: 12, color: Colors.gray},
  pickerList:   {backgroundColor: '#1E3448', borderRadius: 8, marginTop: 4, overflow: 'hidden', maxHeight: 150},
  pickerItem:   {paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#0F1F2E'},
  pickerItemText:{fontSize: 14, color: Colors.clareza},
  pickerEmpty:  {padding: 16, color: Colors.gray, fontSize: 13, textAlign: 'center'},
  saveBtn:      {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:  {color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:       {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
