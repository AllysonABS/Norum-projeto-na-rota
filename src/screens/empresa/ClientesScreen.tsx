import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl} from 'react-native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

type Cliente = {
  id: string; nome: string; cpfCnpj: string; rg: string;
  telefone: string; email: string; dataNascimento: string;
  cep: string; rua: string; numero: string; bairro: string;
  cidade: string; estado: string; observacoes: string; ativo: boolean;
};

const clienteVazio = {rg: '', telefone: '', email: '', dataNascimento: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', observacoes: ''};

const inicial: Cliente[] = [
  {id: '1', nome: 'João Silva', cpfCnpj: '123.456.789-00', ativo: true, ...clienteVazio},
  {id: '2', nome: 'Maria Santos', cpfCnpj: '987.654.321-00', ativo: true, ...clienteVazio},
  {id: '3', nome: 'Loja do Pedro', cpfCnpj: '12.345.678/0001-90', ativo: false, ...clienteVazio},
];

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>(inicial);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [rg, setRg] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const limpar = () => {
    setNome(''); setCpfCnpj(''); setRg(''); setTelefone(''); setEmail('');
    setDataNascimento(''); setCep(''); setRua(''); setNumero('');
    setBairro(''); setCidade(''); setEstado(''); setObservacoes('');
    setEditandoId(null);
  };

  const abrirEditar = (c: Cliente) => {
    setEditandoId(c.id); setNome(c.nome); setCpfCnpj(c.cpfCnpj); setRg(c.rg);
    setTelefone(c.telefone); setEmail(c.email); setDataNascimento(c.dataNascimento);
    setCep(c.cep); setRua(c.rua); setNumero(c.numero); setBairro(c.bairro);
    setCidade(c.cidade); setEstado(c.estado); setObservacoes(c.observacoes);
    setModal(true);
  };

  const toggleAtivo = (id: string) => {
    setClientes(prev => prev.map(c => c.id === id ? {...c, ativo: !c.ativo} : c));
    const c = clientes.find(x => x.id === id);
    showToast(c?.ativo ? 'Cliente desativado' : 'Cliente ativado', 'info');
  };

  const excluir = (id: string) => {
    Alert.alert('Excluir cliente', 'Tem certeza que deseja excluir este cliente?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: () => {
        setClientes(prev => prev.filter(c => c.id !== id));
        showToast('Cliente excluído', 'error');
      }},
    ]);
  };

  const salvar = () => {
    if (!nome || !cpfCnpj || !telefone) {Alert.alert('Preencha os campos obrigatórios (Nome, CPF/CNPJ e Telefone)'); return;}
    const dados = {nome, cpfCnpj, rg, telefone, email, dataNascimento, cep, rua, numero, bairro, cidade, estado, observacoes};
    if (editandoId) {
      setClientes(prev => prev.map(c => c.id === editandoId ? {...c, ...dados} : c));
      showToast('Cliente atualizado!', 'success');
    } else {
      setClientes(prev => [...prev, {id: Date.now().toString(), ...dados, ativo: true}]);
      showToast('Cliente cadastrado!', 'success');
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
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar cliente..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}>
        {clientes
          .filter(c => {
            const q = busca.toLowerCase();
            return !q || c.nome.toLowerCase().includes(q) || c.cpfCnpj.includes(q) || c.telefone.includes(q);
          })
          .map(c => (
          <View key={c.id} style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{c.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{c.nome}</Text>
              <Text style={s.doc}>{c.cpfCnpj}</Text>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => abrirEditar(c)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleAtivo(c.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>{c.ativo ? '⛔' : '✅'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => excluir(c.id)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>{editandoId ? 'Editar Cliente' : 'Novo Cliente'}</Text>

              <Text style={s.sectionTitle}>Dados Pessoais</Text>
              <Text style={s.label}>Nome completo / Razão social *</Text>
              <TextInput style={s.input} placeholder="Nome..." placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
              <Text style={s.label}>CPF / CNPJ *</Text>
              <TextInput style={s.input} placeholder="000.000.000-00" placeholderTextColor={Colors.gray} value={cpfCnpj} onChangeText={setCpfCnpj} keyboardType="numeric" />
              <Text style={s.label}>RG</Text>
              <TextInput style={s.input} placeholder="00.000.000-0" placeholderTextColor={Colors.gray} value={rg} onChangeText={setRg} />
              <Text style={s.label}>Data de Nascimento</Text>
              <TextInput style={s.input} placeholder="DD/MM/AAAA" placeholderTextColor={Colors.gray} value={dataNascimento} onChangeText={setDataNascimento} keyboardType="numeric" />

              <Text style={s.sectionTitle}>Contato</Text>
              <Text style={s.label}>Telefone / WhatsApp *</Text>
              <TextInput style={s.input} placeholder="(00) 00000-0000" placeholderTextColor={Colors.gray} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} placeholder="email@exemplo.com" placeholderTextColor={Colors.gray} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.sectionTitle}>Endereço</Text>
              <Text style={s.label}>CEP</Text>
              <TextInput style={s.input} placeholder="00000-000" placeholderTextColor={Colors.gray} value={cep} onChangeText={setCep} keyboardType="numeric" />
              <Text style={s.label}>Rua</Text>
              <TextInput style={s.input} placeholder="Rua..." placeholderTextColor={Colors.gray} value={rua} onChangeText={setRua} />
              <View style={s.row}>
                <View style={{flex: 1}}>
                  <Text style={s.label}>Número</Text>
                  <TextInput style={s.input} placeholder="Nº" placeholderTextColor={Colors.gray} value={numero} onChangeText={setNumero} keyboardType="numeric" />
                </View>
                <View style={{flex: 2, marginLeft: 12}}>
                  <Text style={s.label}>Bairro</Text>
                  <TextInput style={s.input} placeholder="Bairro..." placeholderTextColor={Colors.gray} value={bairro} onChangeText={setBairro} />
                </View>
              </View>
              <View style={s.row}>
                <View style={{flex: 2}}>
                  <Text style={s.label}>Cidade</Text>
                  <TextInput style={s.input} placeholder="Cidade..." placeholderTextColor={Colors.gray} value={cidade} onChangeText={setCidade} />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={s.label}>Estado</Text>
                  <TextInput style={s.input} placeholder="UF" placeholderTextColor={Colors.gray} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
                </View>
              </View>

              <Text style={s.sectionTitle}>Observações</Text>
              <TextInput style={[s.input, {height: 80, textAlignVertical: 'top', paddingTop: 12}]} placeholder="Anotações sobre o cliente..." placeholderTextColor={Colors.gray} value={observacoes} onChangeText={setObservacoes} multiline />

              <TouchableOpacity style={s.saveBtn} onPress={salvar}>
                <Text style={s.saveBtnText}>{editandoId ? 'Salvar' : 'Cadastrar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {limpar(); setModal(false);}}>
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
  container: {flex: 1, backgroundColor: Colors.matriz},
  header:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 20},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  addBtn:    {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  addBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 14},
  card:      {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1E3448'},
  avatar:    {width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  avatarText:{color: Colors.pulso, fontWeight: '700', fontSize: 18},
  info:      {flex: 1},
  nome:      {fontSize: 15, fontWeight: '700', color: Colors.clareza},
  doc:       {fontSize: 13, color: Colors.gray, marginTop: 2},
  status:    {borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4},
  statusText:{fontSize: 12, fontWeight: '700'},
  cardActions:{flexDirection: 'row', gap: 12, alignItems: 'center'},
  iconBtn:   {fontSize: 18},
  searchBox: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 14, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:{fontSize: 16, marginRight: 8},
  searchInput:{flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  overlay:   {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:     {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '90%'},
  sheetTitle:{fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 8},
  sectionTitle:{fontSize: 15, fontWeight: '700', color: Colors.pulso, marginTop: 20, marginBottom: 4},
  label:     {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  row:       {flexDirection: 'row'},
  input:     {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  saveBtn:   {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:    {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
