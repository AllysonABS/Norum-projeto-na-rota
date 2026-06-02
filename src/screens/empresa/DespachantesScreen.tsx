import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';
import {useAuth} from '../../context/AuthContext';
import {listarDespachantes, cadastrarDespachante, atualizarDespachante, toggleDespachante, excluirDespachante, DespachanteData} from '../../services/api';

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function DespachantesScreen() {
  const navigation = useNavigation();
  const {empresa} = useAuth();
  const [lista, setLista] = useState<DespachanteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');

  const carregar = async () => {
    if (!empresa?.id) return;
    const res = await listarDespachantes(empresa.id);
    if (res.success && res.despachantes) setLista(res.despachantes);
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [empresa?.id]));

  const limpar = () => { setNome(''); setCpf(''); setTelefone(''); setSenha(''); setEditandoId(null); };

  const abrirEditar = (d: DespachanteData) => {
    setEditandoId(d.id); setNome(d.nome); setCpf(d.cpf); setTelefone(d.telefone || '');
    setSenha(''); setModal(true);
  };

  const handleToggle = async (d: DespachanteData) => {
    if (!empresa?.id) return;
    const res = await toggleDespachante(d.id, empresa.id);
    if (res.success) {
      showToast(d.ativo ? 'Despachante desativado' : 'Despachante ativado', 'info');
      carregar();
    } else Alert.alert('Erro', res.error || 'Falha.');
  };

  const handleExcluir = (d: DespachanteData) => {
    Alert.alert('Excluir despachante', 'Tem certeza que deseja excluir?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: async () => {
        if (!empresa?.id) return;
        const res = await excluirDespachante(d.id, empresa.id);
        if (res.success) { showToast('Despachante excluído', 'error'); carregar(); }
        else Alert.alert('Erro', res.error || 'Falha ao excluir.');
      }},
    ]);
  };

  const salvar = async () => {
    if (!nome || !cpf) { Alert.alert('Preencha nome e CPF'); return; }
    if (!editandoId && !senha) { Alert.alert('Preencha a senha de acesso'); return; }
    if (!empresa?.id) return;

    if (editandoId) {
      const res = await atualizarDespachante(editandoId, {nome, cpf, telefone: telefone || undefined, senha: senha || undefined});
      if (res.success) { showToast('Despachante atualizado!', 'success'); carregar(); }
      else Alert.alert('Erro', res.error || 'Falha ao atualizar.');
    } else {
      const res = await cadastrarDespachante(empresa.id, {nome, cpf, telefone: telefone || undefined, senha});
      if (res.success) { showToast('Despachante cadastrado!', 'success'); carregar(); }
      else Alert.alert('Erro', res.error || 'Falha ao cadastrar.');
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
            return !q || d.nome.toLowerCase().includes(q) || d.cpf.includes(q) || (d.telefone || '').includes(q);
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
              {!d.ativo && <Text style={s.inativo}>Desativado</Text>}
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => abrirEditar(d)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleToggle(d)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>{d.ativo ? '⛔' : '✅'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExcluir(d)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
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
            <Text style={s.label}>Nome completo *</Text>
            <TextInput style={s.input} placeholder="Nome..." placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
            <Text style={s.label}>CPF *</Text>
            <TextInput style={s.input} placeholder="000.000.000-00" placeholderTextColor={Colors.gray} value={cpf} onChangeText={v => setCpf(maskCpf(v))} keyboardType="numeric" />
            <Text style={s.label}>Telefone</Text>
            <TextInput style={s.input} placeholder="(00) 00000-0000" placeholderTextColor={Colors.gray} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
            <Text style={s.label}>{editandoId ? 'Nova senha (deixe vazio para manter)' : 'Senha de acesso *'}</Text>
            <TextInput style={s.input} placeholder="Mínimo 6 caracteres" placeholderTextColor={Colors.gray} value={senha} onChangeText={setSenha} secureTextEntry />
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
  inativo:   {fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: '600'},
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
