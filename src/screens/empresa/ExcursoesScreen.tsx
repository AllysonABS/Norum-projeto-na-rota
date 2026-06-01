import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

type Excursao = {
  id: string;
  nome: string;
  setor: string;
  vaga: string;
  responsavel: string;
  telefone: string;
};

const inicial: Excursao[] = [
  {id: '1', nome: 'Trans Silva - SP',    setor: 'A', vaga: '12', responsavel: 'Carlos Motorista', telefone: '(11) 99999-1111'},
  {id: '2', nome: 'Rápido Norte - RJ',   setor: 'B', vaga: '07', responsavel: 'Marcos Silva',     telefone: '(21) 98888-2222'},
  {id: '3', nome: 'Sul Cargas - BH',     setor: 'A', vaga: '23', responsavel: 'Pedro Oliveira',   telefone: '(31) 97777-3333'},
];

export default function ExcursoesScreen() {
  const navigation = useNavigation();
  const [lista, setLista] = useState<Excursao[]>(inicial);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Excursao | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [vaga, setVaga] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');

  const limpar = () => {
    setNome(''); setSetor(''); setVaga(''); setResponsavel(''); setTelefone(''); setEditandoId(null);
  };

  const abrirEditar = (e: Excursao) => {
    setEditandoId(e.id); setNome(e.nome); setSetor(e.setor); setVaga(e.vaga);
    setResponsavel(e.responsavel); setTelefone(e.telefone); setModal(true);
  };

  const excluir = (id: string) => {
    Alert.alert('Excluir excursão', 'Tem certeza que deseja excluir?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: () => {
        setLista(prev => prev.filter(e => e.id !== id));
        showToast('Excursão excluída', 'error');
      }},
    ]);
  };

  const salvar = () => {
    if (!nome || !setor || !vaga || !responsavel) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const dados = {nome, setor, vaga, responsavel, telefone};
    if (editandoId) {
      setLista(prev => prev.map(e => e.id === editandoId ? {...e, ...dados} : e));
      showToast('Excursão atualizada!', 'success');
    } else {
      setLista(prev => [...prev, {id: Date.now().toString(), ...dados}]);
      showToast('Excursão cadastrada!', 'success');
    }
    limpar(); setModal(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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
