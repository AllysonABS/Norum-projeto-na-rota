import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

export default function ConfiguracoesScreen() {
  const navigation = useNavigation();
  const {showToast} = useToast();
  const [nomeEmpresa, setNomeEmpresa] = useState('Na Rota Transportes');
  const [cnpj, setCnpj] = useState('12.345.678/0001-90');
  const [telefone, setTelefone] = useState('(11) 3333-4444');
  const [email, setEmail] = useState('contato@narota.com.br');
  const [endereco, setEndereco] = useState('Rua das Cargas, 100 - São Paulo/SP');
  const [horario, setHorario] = useState('Seg-Sex: 07:00 - 18:00 | Sáb: 07:00 - 12:00');

  const salvar = () => {
    if (!nomeEmpresa || !cnpj) { Alert.alert('Preencha os campos obrigatórios'); return; }
    showToast('Configurações salvas!', 'success');
  };

  return (
    <View style={s.container}>
      <Toast />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Configurações</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Dados da Empresa</Text>
          <Text style={s.label}>Nome / Razão Social *</Text>
          <TextInput style={s.input} value={nomeEmpresa} onChangeText={setNomeEmpresa} placeholderTextColor={Colors.gray} />
          <Text style={s.label}>CNPJ *</Text>
          <TextInput style={s.input} value={cnpj} onChangeText={setCnpj} placeholderTextColor={Colors.gray} keyboardType="numeric" />
          <Text style={s.label}>Telefone</Text>
          <TextInput style={s.input} value={telefone} onChangeText={setTelefone} placeholderTextColor={Colors.gray} keyboardType="phone-pad" />
          <Text style={s.label}>E-mail</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholderTextColor={Colors.gray} keyboardType="email-address" autoCapitalize="none" />
          <Text style={s.label}>Endereço</Text>
          <TextInput style={s.input} value={endereco} onChangeText={setEndereco} placeholderTextColor={Colors.gray} />
          <Text style={s.label}>Horário de Funcionamento</Text>
          <TextInput style={s.input} value={horario} onChangeText={setHorario} placeholderTextColor={Colors.gray} />
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={salvar}>
          <Text style={s.saveBtnText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    {flex: 1, backgroundColor: Colors.matriz},
  content:      {padding: 24, paddingTop: 56, paddingBottom: 40},
  title:        {fontSize: 18, fontWeight: '700', color: Colors.clareza, marginBottom: 24},
  backText:     {color: Colors.pulso, fontSize: 14, fontWeight: '600', marginBottom: 12},
  section:      {backgroundColor: '#162433', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#1E3448', marginBottom: 20},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: Colors.pulso, marginBottom: 8},
  label:        {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 14},
  input:        {height: 48, backgroundColor: '#0F1F2E', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14, color: Colors.clareza, fontSize: 15},
  saveBtn:      {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  saveBtnText:  {color: Colors.matriz, fontWeight: '700', fontSize: 16},
});
