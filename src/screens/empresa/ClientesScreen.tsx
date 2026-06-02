import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';
import {useAuth} from '../../context/AuthContext';
import {listarClientesEmpresa, atualizarVinculoCliente, bloquearVinculoCliente, excluirVinculoCliente, cadastrarClienteManual} from '../../services/api';

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

type ClienteVinculo = {
  vinculo_id: string; cliente_id: string; status: string;
  nome: string; cpf: string; cnpj: string; rg: string;
  telefone: string; email: string; data_nascimento: string;
  cep: string; endereco: string; cidade: string; estado: string;
  observacoes: string; data_vinculo: string;
};

export default function ClientesScreen() {
  const {empresa} = useAuth();
  const {showToast} = useToast();
  const [clientes, setClientes] = useState<ClienteVinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState<ClienteVinculo | null>(null);

  // Form
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [rg, setRg] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const carregar = async () => {
    if (!empresa?.id) return;
    const res = await listarClientesEmpresa(empresa.id);
    if (res.success && res.clientes) setClientes(res.clientes);
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [empresa?.id]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar().finally(() => setRefreshing(false));
  }, [empresa?.id]);

  const abrirEditar = (c: ClienteVinculo) => {
    setEditando(c);
    setNome(c.nome); setCpf(c.cpf); setCnpj(c.cnpj); setRg(c.rg);
    setTelefone(c.telefone); setEmail(c.email); setDataNascimento(c.data_nascimento);
    setCep(c.cep); setEndereco(c.endereco); setCidade(c.cidade);
    setEstado(c.estado); setObservacoes(c.observacoes);
    setModal(true);
  };

  const fecharModal = () => { setModal(false); setEditando(null); };

  const abrirNovo = () => {
    setNome(''); setCpf(''); setCnpj(''); setRg(''); setTelefone(''); setEmail('');
    setDataNascimento(''); setCep(''); setEndereco(''); setCidade(''); setEstado(''); setObservacoes('');
    setModalNovo(true);
  };

  const salvarNovo = async () => {
    if (!nome || (!cpf && !cnpj)) { Alert.alert('Preencha o nome e pelo menos CPF ou CNPJ'); return; }
    if (!empresa?.id) return;
    const res = await cadastrarClienteManual(empresa.id, {
      nome, cpf: cpf || undefined, cnpj: cnpj || undefined, rg: rg || undefined,
      telefone: telefone || undefined, email: email || undefined,
      data_nascimento: dataNascimento || undefined, cep: cep || undefined,
      endereco: endereco || undefined, cidade: cidade || undefined,
      estado: estado || undefined, observacoes: observacoes || undefined,
    });
    if (res.success) {
      showToast('Cliente cadastrado!', 'success');
      setModalNovo(false);
      carregar();
    } else {
      Alert.alert('Erro', res.error || 'Não foi possível cadastrar.');
    }
  };

  const salvar = async () => {
    if (!nome || !telefone) { Alert.alert('Preencha nome e telefone'); return; }
    if (!editando) return;
    const res = await atualizarVinculoCliente(editando.vinculo_id, {
      nome, cpf, cnpj, rg, telefone, email, data_nascimento: dataNascimento,
      cep, endereco, cidade, estado, observacoes,
    });
    if (res.success) {
      showToast('Cliente atualizado!', 'success');
      fecharModal();
      carregar();
    } else {
      Alert.alert('Erro', res.error || 'Não foi possível salvar.');
    }
  };

  const bloquear = (c: ClienteVinculo) => {
    Alert.alert('Bloquear cliente', `Bloquear ${c.nome}? Ele não poderá se vincular novamente.`, [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Bloquear', style: 'destructive', onPress: async () => {
        const res = await bloquearVinculoCliente(c.vinculo_id);
        if (res.success) { showToast('Cliente bloqueado', 'info'); carregar(); }
        else Alert.alert('Erro', res.error || 'Falha ao bloquear.');
      }},
    ]);
  };

  const excluir = (c: ClienteVinculo) => {
    Alert.alert('Excluir vínculo', `Remover ${c.nome}? Ele poderá se vincular novamente.`, [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Excluir', style: 'destructive', onPress: async () => {
        const res = await excluirVinculoCliente(c.vinculo_id);
        if (res.success) { showToast('Vínculo removido', 'error'); carregar(); }
        else Alert.alert('Erro', res.error || 'Falha ao excluir.');
      }},
    ]);
  };

  const filtrados = clientes.filter(c => {
    const q = busca.toLowerCase();
    return !q || c.nome.toLowerCase().includes(q) || c.cpf.includes(q) || c.telefone.includes(q);
  });

  if (loading) {
    return <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={Colors.pulso} /></View>;
  }

  return (
    <View style={s.container}>
      <Toast />
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={abrirNovo}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar cliente..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10, paddingBottom: 40}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}>
        {filtrados.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>Nenhum cliente vinculado</Text></View>
        ) : filtrados.map(c => (
          <View key={c.vinculo_id} style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{c.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{c.nome}</Text>
              <Text style={s.doc}>{c.cpf ? maskCpf(c.cpf) : ''}{c.cnpj ? ` · ${maskCnpj(c.cnpj)}` : ''}</Text>
              {c.status === 'bloqueado' && <Text style={s.bloqueado}>⛔ Bloqueado</Text>}
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => abrirEditar(c)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={s.iconBtn}>✏️</Text>
              </TouchableOpacity>
              {c.status !== 'bloqueado' && (
                <TouchableOpacity onPress={() => bloquear(c)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={s.iconBtn}>⛔</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => excluir(c)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
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
              <Text style={s.sheetTitle}>Editar Cliente</Text>

              <Text style={s.sectionTitle}>Dados Pessoais</Text>
              <Text style={s.label}>Nome completo / Razão social *</Text>
              <TextInput style={s.input} value={nome} onChangeText={setNome} placeholderTextColor={Colors.gray} />
              <Text style={s.label}>CPF</Text>
              <TextInput style={s.input} value={cpf} onChangeText={v => setCpf(maskCpf(v))} placeholderTextColor={Colors.gray} keyboardType="numeric" />
              <Text style={s.label}>CNPJ</Text>
              <TextInput style={s.input} value={cnpj} onChangeText={v => setCnpj(maskCnpj(v))} placeholderTextColor={Colors.gray} keyboardType="numeric" />
              <Text style={s.label}>RG</Text>
              <TextInput style={s.input} value={rg} onChangeText={setRg} placeholderTextColor={Colors.gray} />
              <Text style={s.label}>Data de Nascimento</Text>
              <TextInput style={s.input} value={dataNascimento} onChangeText={setDataNascimento} placeholderTextColor={Colors.gray} keyboardType="numeric" />

              <Text style={s.sectionTitle}>Contato</Text>
              <Text style={s.label}>Telefone / WhatsApp *</Text>
              <TextInput style={s.input} value={telefone} onChangeText={setTelefone} placeholderTextColor={Colors.gray} keyboardType="phone-pad" />
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholderTextColor={Colors.gray} keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.sectionTitle}>Endereço</Text>
              <Text style={s.label}>CEP</Text>
              <TextInput style={s.input} value={cep} onChangeText={setCep} placeholderTextColor={Colors.gray} keyboardType="numeric" />
              <Text style={s.label}>Endereço</Text>
              <TextInput style={s.input} value={endereco} onChangeText={setEndereco} placeholderTextColor={Colors.gray} />
              <View style={s.row}>
                <View style={{flex: 2}}>
                  <Text style={s.label}>Cidade</Text>
                  <TextInput style={s.input} value={cidade} onChangeText={setCidade} placeholderTextColor={Colors.gray} />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={s.label}>UF</Text>
                  <TextInput style={s.input} value={estado} onChangeText={setEstado} placeholderTextColor={Colors.gray} maxLength={2} autoCapitalize="characters" />
                </View>
              </View>

              <Text style={s.sectionTitle}>Observações</Text>
              <TextInput style={[s.input, {height: 80, textAlignVertical: 'top', paddingTop: 12}]} value={observacoes} onChangeText={setObservacoes} placeholderTextColor={Colors.gray} placeholder="Anotações sobre o cliente..." multiline />

              <TouchableOpacity style={s.saveBtn} onPress={salvar}>
                <Text style={s.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={fecharModal}>
                <Text style={s.cancel}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={modalNovo} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>Novo Cliente</Text>

              <Text style={s.sectionTitle}>Dados Pessoais</Text>
              <Text style={s.label}>Nome completo / Razão social *</Text>
              <TextInput style={s.input} value={nome} onChangeText={setNome} placeholderTextColor={Colors.gray} placeholder="Nome..." />
              <Text style={s.label}>CPF</Text>
              <TextInput style={s.input} value={cpf} onChangeText={v => setCpf(maskCpf(v))} placeholderTextColor={Colors.gray} placeholder="000.000.000-00" keyboardType="numeric" />
              <Text style={s.label}>CNPJ</Text>
              <TextInput style={s.input} value={cnpj} onChangeText={v => setCnpj(maskCnpj(v))} placeholderTextColor={Colors.gray} placeholder="00.000.000/0000-00" keyboardType="numeric" />
              <Text style={s.label}>RG</Text>
              <TextInput style={s.input} value={rg} onChangeText={setRg} placeholderTextColor={Colors.gray} />
              <Text style={s.label}>Data de Nascimento</Text>
              <TextInput style={s.input} value={dataNascimento} onChangeText={setDataNascimento} placeholderTextColor={Colors.gray} placeholder="DD/MM/AAAA" keyboardType="numeric" />

              <Text style={s.sectionTitle}>Contato</Text>
              <Text style={s.label}>Telefone / WhatsApp</Text>
              <TextInput style={s.input} value={telefone} onChangeText={setTelefone} placeholderTextColor={Colors.gray} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholderTextColor={Colors.gray} placeholder="email@exemplo.com" keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.sectionTitle}>Endereço</Text>
              <Text style={s.label}>CEP</Text>
              <TextInput style={s.input} value={cep} onChangeText={setCep} placeholderTextColor={Colors.gray} placeholder="00000-000" keyboardType="numeric" />
              <Text style={s.label}>Endereço</Text>
              <TextInput style={s.input} value={endereco} onChangeText={setEndereco} placeholderTextColor={Colors.gray} placeholder="Rua, número" />
              <View style={s.row}>
                <View style={{flex: 2}}>
                  <Text style={s.label}>Cidade</Text>
                  <TextInput style={s.input} value={cidade} onChangeText={setCidade} placeholderTextColor={Colors.gray} />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={s.label}>UF</Text>
                  <TextInput style={s.input} value={estado} onChangeText={setEstado} placeholderTextColor={Colors.gray} maxLength={2} autoCapitalize="characters" />
                </View>
              </View>

              <Text style={s.sectionTitle}>Observações</Text>
              <TextInput style={[s.input, {height: 80, textAlignVertical: 'top', paddingTop: 12}]} value={observacoes} onChangeText={setObservacoes} placeholderTextColor={Colors.gray} placeholder="Anotações sobre o cliente..." multiline />

              <TouchableOpacity style={s.saveBtn} onPress={salvarNovo}>
                <Text style={s.saveBtnText}>Cadastrar</Text>
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
  bloqueado: {fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: '600'},
  cardActions:{flexDirection: 'row', gap: 12, alignItems: 'center'},
  iconBtn:   {fontSize: 18},
  searchBox: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 14, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon:{fontSize: 16, marginRight: 8},
  searchInput:{flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  empty:     {alignItems: 'center', paddingTop: 60},
  emptyText: {fontSize: 16, color: Colors.gray},
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
