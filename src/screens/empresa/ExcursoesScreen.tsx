import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import {Colors} from '../../theme/colors';

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
  const [lista, setLista] = useState<Excursao[]>(inicial);
  const [modal, setModal] = useState(false);
  const [detalhe, setDetalhe] = useState<Excursao | null>(null);
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [vaga, setVaga] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');

  const limpar = () => {
    setNome(''); setSetor(''); setVaga(''); setResponsavel(''); setTelefone('');
  };

  const salvar = () => {
    if (!nome || !setor || !vaga || !responsavel) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setLista(prev => [...prev, {id: Date.now().toString(), nome, setor, vaga, responsavel, telefone}]);
    limpar();
    setModal(false);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Excursões</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Text style={s.addBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 12}}>
        {lista.map(e => (
          <TouchableOpacity key={e.id} style={s.card} onPress={() => setDetalhe(e)} activeOpacity={0.8}>
            <View style={s.cardTop}>
              <View style={s.setorBadge}>
                <Text style={s.setorText}>Setor {e.setor}</Text>
              </View>
              <View style={s.vagaBadge}>
                <Text style={s.vagaLabel}>Vaga</Text>
                <Text style={s.vagaNum}>{e.vaga}</Text>
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

      {/* Modal cadastro */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Nova Excursão</Text>

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
              <Text style={s.saveBtnText}>Cadastrar</Text>
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
  title:        {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  addBtn:       {backgroundColor: Colors.pulso, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8},
  addBtnText:   {color: Colors.matriz, fontWeight: '700', fontSize: 14},
  card:         {backgroundColor: '#162433', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E3448'},
  cardTop:      {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
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
