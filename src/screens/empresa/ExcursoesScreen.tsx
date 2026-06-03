import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, RefreshControl, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';
import {useAuth} from '../../context/AuthContext';
import {listarExcursoes, cadastrarExcursao, atualizarExcursao, excluirExcursao, ExcursaoData} from '../../services/api';
import {useAlert} from '../../components/CustomAlert';

export default function ExcursoesScreen() {
  const navigation = useNavigation();
  const {empresa} = useAuth();
  const [lista, setLista] = useState<ExcursaoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ExcursaoData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const {show} = useAlert();
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [vaga, setVaga] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');

  const carregar = async () => {
    if (!empresa?.id) return;
    const res = await listarExcursoes(empresa.id);
    if (res.success && res.excursoes) setLista(res.excursoes);
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [empresa?.id]));

  const limpar = () => {
    setNome(''); setSetor(''); setVaga(''); setResponsavel(''); setTelefone(''); setEditandoId(null);
  };

  const abrirEditar = (e: ExcursaoData) => {
    setEditandoId(e.id); setNome(e.nome); setSetor(e.setor); setVaga(e.vaga);
    setResponsavel(e.responsavel); setTelefone(e.telefone || ''); setModal(true);
  };

  const excluir = (id: string) => {
    show({title: 'Excluir excursão', message: 'Tem certeza que deseja excluir?', type: 'confirm', buttons: [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: async () => {
        const res = await excluirExcursao(id);
        if (res.success) { showToast('Excursão excluída', 'error'); carregar(); }
        else show({title: 'Erro', message: res.error || 'Falha ao excluir.', type: 'error'});
      }},
    ]});
  };

  const salvar = async () => {
    if (!nome || !setor || !vaga || !responsavel) {
      show({title: 'Atenção', message: 'Preencha todos os campos obrigatórios.', type: 'warning'});
      return;
    }
    if (!empresa?.id) return;
    const dados = {nome, setor, vaga, responsavel, telefone};
    if (editandoId) {
      const res = await atualizarExcursao(editandoId, dados);
      if (res.success) { showToast('Excursão atualizada!', 'success'); carregar(); }
      else show({title: 'Erro', message: res.error || 'Falha ao atualizar.', type: 'error'});
    } else {
      const res = await cadastrarExcursao(empresa.id, dados);
      if (res.success) { showToast('Excursão cadastrada!', 'success'); carregar(); }
      else show({title: 'Erro', message: res.error || 'Falha ao cadastrar.', type: 'error'});
    }
    limpar(); setModal(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar().finally(() => setRefreshing(false));
  }, [empresa?.id]);

  if (loading) {
    return <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={Colors.pulso} /></View>;
  }

  return (
    <View style={s.container}>
      <Toast />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Excursões</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar excursão..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 12}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}>
        {lista
          .filter(e => {
            const q = busca.toLowerCase();
            return !q || e.nome.toLowerCase().includes(q) || e.responsavel.toLowerCase().includes(q) || e.setor.toLowerCase().includes(q);
          })
          .map(e => (
          <TouchableOpacity key={e.id} style={s.card} onPress={() => setDetalhe(e)} activeOpacity={0.8}>
            <View style={s.cardTop}>
              <View style={s.setorBadge}>
                <Text style={s.setorText}>Setor {e.setor}</Text>
              </View>
              <View style={s.vagaBadge}>
                <Text style={s.vagaLabel}>Vaga</Text>
                <Text style={s.vagaNum}>{e.vaga}</Text>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity onPress={() => abrirEditar(e)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={s.iconBtn}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluir(e.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={s.iconBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={s.nomeExcursao}>{e.nome}</Text>
            <Text style={s.responsavelText}>👤 {e.responsavel}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal detalhes */}
      <Modal visible={!!detalhe} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{detalhe?.nome}</Text>
            {[
              {label: 'Setor',        value: detalhe?.setor},
              {label: 'Vaga',         value: detalhe?.vaga},
              {label: 'Responsável',  value: detalhe?.responsavel},
              {label: 'Telefone',     value: detalhe?.telefone || '—'},
            ].map(row => (
              <View key={row.label} style={s.detRow}>
                <Text style={s.detLabel}>{row.label}</Text>
                <Text style={s.detValue}>{row.value}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.closeBtn} onPress={() => setDetalhe(null)}>
              <Text style={s.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal cadastro/edição */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{editandoId ? 'Editar Excursão' : 'Nova Excursão'}</Text>

            <Text style={s.label}>Nome da excursão *</Text>
            <TextInput style={s.input} placeholder="Ex: Trans Silva - SP" placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />

            <View style={s.row2}>
              <View style={{flex: 1}}>
                <Text style={s.label}>Setor *</Text>
                <TextInput style={s.input} placeholder="Ex: A" placeholderTextColor={Colors.gray} value={setor} onChangeText={setSetor} autoCapitalize="characters" />
              </View>
              <View style={{flex: 1}}>
                <Text style={s.label}>Nº da vaga *</Text>
                <TextInput style={s.input} placeholder="Ex: 12" placeholderTextColor={Colors.gray} value={vaga} onChangeText={setVaga} keyboardType="numeric" />
              </View>
            </View>

            <Text style={s.label}>Nome do responsável *</Text>
            <TextInput style={s.input} placeholder="Nome do motorista/responsável" placeholderTextColor={Colors.gray} value={responsavel} onChangeText={setResponsavel} />

            <Text style={s.label}>Telefone</Text>
            <TextInput style={s.input} placeholder="(00) 00000-0000" placeholderTextColor={Colors.gray} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

            <TouchableOpacity style={s.saveBtn} onPress={salvar}>
              <Text style={s.saveBtnText}>{editandoId ? 'Salvar' : 'Cadastrar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {limpar(); setModal(false);}}>
              <Text style={s.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    {flex: 1, backgroundColor: Colors.matriz},
  header:       {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 20},
  backText:     {color: Colors.pulso, fontSize: 14, fontWeight: '600'},
  title:        {fontSize: 18, fontWeight: '700', color: Colors.clareza},
  addBtn:       {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  addBtnText:   {color: Colors.matriz, fontWeight: '700', fontSize: 14},
  card:         {backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448'},
  cardTop:      {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
  cardActions:  {flexDirection: 'row', gap: 12, marginLeft: 'auto'},
  iconBtn:      {fontSize: 18},
  searchBox:    {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 14, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:   {fontSize: 16, marginRight: 8},
  searchInput:  {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  setorBadge:   {backgroundColor: '#052E16', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  setorText:    {color: Colors.pulso, fontSize: 12, fontWeight: '700'},
  vagaBadge:    {backgroundColor: '#1E3448', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', gap: 4, alignItems: 'center'},
  vagaLabel:    {color: Colors.gray, fontSize: 12},
  vagaNum:      {color: Colors.clareza, fontSize: 12, fontWeight: '700'},
  nomeExcursao: {fontSize: 16, fontWeight: '700', color: Colors.clareza, marginBottom: 6},
  responsavelText:{fontSize: 13, color: Colors.gray},
  overlay:      {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:        {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40},
  sheetTitle:   {fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 20},
  detRow:       {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  detLabel:     {fontSize: 14, color: Colors.gray},
  detValue:     {fontSize: 14, fontWeight: '600', color: Colors.clareza},
  closeBtn:     {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText: {color: Colors.clareza, fontWeight: '600', fontSize: 15},
  row2:         {flexDirection: 'row', gap: 12},
  label:        {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  input:        {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  saveBtn:      {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:  {color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:       {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
