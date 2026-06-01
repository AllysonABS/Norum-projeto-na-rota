import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import {Colors} from '../../theme/colors';

type Despachante = {id: string; nome: string; cpf: string; telefone: string; ativo: boolean};

const inicial: Despachante[] = [
  {id: '1', nome: 'Ricardo Gomes',  cpf: '111.222.333-44', telefone: '(11) 99999-0001', ativo: true},
  {id: '2', nome: 'Fernanda Lima',  cpf: '555.666.777-88', telefone: '(11) 99999-0002', ativo: true},
  {id: '3', nome: 'Paulo Mendes',   cpf: '999.000.111-22', telefone: '(11) 99999-0003', ativo: false},
];

export default function DespachantesScreen() {
  const [lista, setLista] = useState<Despachante[]>(inicial);
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');

  const salvar = () => {
    if (!nome || !cpf) {Alert.alert('Preencha nome e CPF'); return;}
    setLista(prev => [...prev, {id: Date.now().toString(), nome, cpf, telefone, ativo: true}]);
    setNome(''); setCpf(''); setTelefone(''); setModal(false);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Despachantes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {lista.map(d => (
          <View key={d.id} style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{d.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{d.nome}</Text>
              <Text style={s.doc}>{d.cpf}</Text>
              {d.telefone ? <Text style={s.tel}>{d.telefone}</Text> : null}
            </View>
            <View style={[s.status, {backgroundColor: d.ativo ? '#052E16' : '#1C1917'}]}>
              <Text style={[s.statusText, {color: d.ativo ? Colors.pulso : Colors.gray}]}>
                {d.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Novo Despachante</Text>
            <Text style={s.label}>Nome completo</Text>
            <TextInput style={s.input} placeholder="Nome..." placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
            <Text style={s.label}>CPF</Text>
            <TextInput style={s.input} placeholder="000.000.000-00" placeholderTextColor={Colors.gray} value={cpf} onChangeText={setCpf} keyboardType="numeric" />
            <Text style={s.label}>Telefone</Text>
            <TextInput style={s.input} placeholder="(00) 00000-0000" placeholderTextColor={Colors.gray} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
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
  avatarText:{color: '#60A5FA', fontWeight: '700', fontSize: 18},
  info:      {flex: 1},
  nome:      {fontSize: 15, fontWeight: '700', color: Colors.clareza},
  doc:       {fontSize: 13, color: Colors.gray, marginTop: 2},
  tel:       {fontSize: 12, color: '#60A5FA', marginTop: 2},
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
