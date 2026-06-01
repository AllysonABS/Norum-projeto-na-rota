import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import {Colors} from '../../theme/colors';

type Cliente = {id: string; nome: string; cpfCnpj: string; ativo: boolean};

const inicial: Cliente[] = [
  {id: '1', nome: 'João Silva',   cpfCnpj: '123.456.789-00', ativo: true},
  {id: '2', nome: 'Maria Santos', cpfCnpj: '987.654.321-00', ativo: true},
  {id: '3', nome: 'Loja do Pedro', cpfCnpj: '12.345.678/0001-90', ativo: false},
];

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>(inicial);
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

  const salvar = () => {
    if (!nome || !cpfCnpj) {Alert.alert('Preencha todos os campos'); return;}
    setClientes(prev => [...prev, {id: Date.now().toString(), nome, cpfCnpj, ativo: true}]);
    setNome(''); setCpfCnpj(''); setModal(false);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {clientes.map(c => (
          <View key={c.id} style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{c.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{c.nome}</Text>
              <Text style={s.doc}>{c.cpfCnpj}</Text>
            </View>
            <View style={[s.status, {backgroundColor: c.ativo ? '#052E16' : '#1C1917'}]}>
              <Text style={[s.statusText, {color: c.ativo ? Colors.pulso : Colors.gray}]}>
                {c.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Novo Cliente</Text>
            <Text style={s.label}>Nome completo / Razão social</Text>
            <TextInput style={s.input} placeholder="Nome..." placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
            <Text style={s.label}>CPF / CNPJ</Text>
            <TextInput style={s.input} placeholder="000.000.000-00" placeholderTextColor={Colors.gray} value={cpfCnpj} onChangeText={setCpfCnpj} keyboardType="numeric" />
            <TouchableOpacity style={s.saveBtn} onPress={salvar}>
              <Text style={s.saveBtnText}>Cadastrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}>
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
  overlay:   {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:     {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40},
  sheetTitle:{fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 24},
  label:     {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  input:     {height: 50, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 16, color: Colors.clareza, fontSize: 15},
  saveBtn:   {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:    {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
