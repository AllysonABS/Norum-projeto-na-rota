import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

type Despachante = {id: string; nome: string; cpf: string; telefone: string; ativo: boolean};

const inicial: Despachante[] = [
  {id: '1', nome: 'Ricardo Gomes',  cpf: '111.222.333-44', telefone: '(11) 99999-0001', ativo: true},
  {id: '2', nome: 'Fernanda Lima',  cpf: '555.666.777-88', telefone: '(11) 99999-0002', ativo: true},
  {id: '3', nome: 'Paulo Mendes',   cpf: '999.000.111-22', telefone: '(11) 99999-0003', ativo: false},
];

export default function DespachantesScreen() {
  const navigation = useNavigation();
  const [lista, setLista] = useState<Despachante[]>(inicial);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');

  const limpar = () => { setNome(''); setCpf(''); setTelefone(''); setEditandoId(null); };

  const abrirEditar = (d: Despachante) => {
    setEditandoId(d.id); setNome(d.nome); setCpf(d.cpf); setTelefone(d.telefone);
    setModal(true);
  };

  const toggleAtivo = (id: string) => {
    const d = lista.find(x => x.id === id);
    setLista(prev => prev.map(x => x.id === id ? {...x, ativo: !x.ativo} : x));
    showToast(d?.ativo ? 'Despachante desativado' : 'Despachante ativado', 'info');
  };

  const excluir = (id: string) => {
    Alert.alert('Excluir despachante', 'Tem certeza que deseja excluir?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: () => {
        setLista(prev => prev.filter(d => d.id !== id));
        showToast('Despachante excluído', 'error');
      }},
    ]);
  };

  const salvar = () => {
    if (!nome || !cpf) {Alert.alert('Preencha nome e CPF'); return;}
    if (editandoId) {
      setLista(prev => prev.map(d => d.id === editandoId ? {...d, nome, cpf, telefone} : d));
      showToast('Despachante atualizado!', 'success');
    } else {
      setLista(prev => [...prev, {id: Date.now().toString(), nome, cpf, telefone, ativo: true}]);
      showToast('Despachante cadastrado!', 'success');
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
        <Text style={s.title}>Despachantes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar despachante..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}>
        {lista
          .filter(d => {
            const q = busca.toLowerCase();
            return !q || d.nome.toLowerCase().includes(q) || d.cpf.includes(q) || d.telefone.includes(q);
          })
          .map(d => (
          <View key={d.id} style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{d.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{d.nome}</Text>
              <Text style={s.doc}>{d.cpf}</Text>
              {d.telefone ? <Text style={s.tel}>{d.telefone}</Text> : null}
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => abrirEditar(d)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleAtivo(d.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>{d.ativo ? '⛔' : '✅'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluir(d.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{editandoId ? 'Editar Despachante' : 'Novo Despachante'}</Text>
            <Text style={s.label}>Nome completo</Text>
            <TextInput style={s.input} placeholder="Nome..." placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
            <Text style={s.label}>CPF</Text>
            <TextInput style={s.input} placeholder="000.000.000-00" placeholderTextColor={Colors.gray} value={cpf} onChangeText={setCpf} keyboardType="numeric" />
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
  container: {flex: 1, backgroundColor: Colors.matriz},
  header:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 20},
  backText:  {color: Colors.pulso, fontSize: 14, fontWeight: '600'},
  title:     {fontSize: 18, fontWeight: '700', color: Colors.clareza},
  addBtn:    {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  addBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 14},
  card:      {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1E3448'},
  avatar:    {width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  avatarText:{color: '#60A5FA', fontWeight: '700', fontSize: 18},
  info:      {flex: 1},
  nome:      {fontSize: 15, fontWeight: '700', color: Colors.clareza},
  doc:       {fontSize: 13, color: Colors.gray, marginTop: 2},
  tel:       {fontSize: 12, color: '#60A5FA', marginTop: 2},
  cardActions:{flexDirection: 'row', gap: 12, alignItems: 'center'},
  iconBtn:   {fontSize: 18},
  searchBox: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 14, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:{fontSize: 16, marginRight: 8},
  searchInput:{flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  overlay:   {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:     {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40},
  sheetTitle:{fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 24},
  label:     {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  input:     {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  saveBtn:   {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:    {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
