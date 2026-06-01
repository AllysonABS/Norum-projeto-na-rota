import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';
import Toast, {useToast} from '../../components/Toast';

export default function PerfilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {showToast} = useToast();
  const [modalEditar, setModalEditar] = useState(false);

  // Dados do perfil
  const [nome, setNome] = useState('João da Silva');
  const [cpf] = useState('123.456.789-00');
  const [telefone, setTelefone] = useState('(11) 98888-7777');
  const [email, setEmail] = useState('joao@email.com');
  const [dataNascimento, setDataNascimento] = useState('15/03/1990');
  const [cep, setCep] = useState('01310-100');
  const [rua, setRua] = useState('Av. Paulista');
  const [numero, setNumero] = useState('1000');
  const [bairro, setBairro] = useState('Bela Vista');
  const [cidade, setCidade] = useState('São Paulo');
  const [estado, setEstado] = useState('SP');

  // Form temporário para edição
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formCep, setFormCep] = useState('');
  const [formRua, setFormRua] = useState('');
  const [formNumero, setFormNumero] = useState('');
  const [formBairro, setFormBairro] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formEstado, setFormEstado] = useState('');

  const abrirEditar = () => {
    setFormNome(nome); setFormTelefone(telefone); setFormEmail(email);
    setFormNascimento(dataNascimento); setFormCep(cep); setFormRua(rua);
    setFormNumero(numero); setFormBairro(bairro); setFormCidade(cidade); setFormEstado(estado);
    setModalEditar(true);
  };

  const salvar = () => {
    if (!formNome || !formTelefone) { Alert.alert('Preencha nome e telefone'); return; }
    setNome(formNome); setTelefone(formTelefone); setEmail(formEmail);
    setDataNascimento(formNascimento); setCep(formCep); setRua(formRua);
    setNumero(formNumero); setBairro(formBairro); setCidade(formCidade); setEstado(formEstado);
    setModalEditar(false);
    showToast('Perfil atualizado!', 'success');
  };

  const endereco = rua && cidade ? `${rua}, ${numero} - ${bairro}, ${cidade}/${estado}` : 'Não informado';

  return (
    <View style={s.wrapper}>
      <Toast />
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {/* Avatar e nome */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}><Text style={s.avatarText}>{nome[0]}</Text></View>
          <Text style={s.nome}>{nome}</Text>
          <Text style={s.cpf}>{cpf}</Text>
        </View>

        {/* Resumo de atividade */}
        <View style={s.resumoRow}>
          <View style={s.resumoCard}>
            <Text style={s.resumoValor}>17</Text>
            <Text style={s.resumoLabel}>Pedidos</Text>
          </View>
          <View style={s.resumoCard}>
            <Text style={s.resumoValor}>2</Text>
            <Text style={s.resumoLabel}>Lojas</Text>
          </View>
          <View style={s.resumoCard}>
            <Text style={s.resumoValor}>Jan/24</Text>
            <Text style={s.resumoLabel}>Cliente desde</Text>
          </View>
        </View>

        {/* Dados pessoais */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Dados Pessoais</Text>
            <TouchableOpacity onPress={abrirEditar}>
              <Text style={s.editBtn}>✏️ Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.row}><Text style={s.rowLabel}>Telefone</Text><Text style={s.rowValue}>{telefone}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>E-mail</Text><Text style={s.rowValue}>{email}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Nascimento</Text><Text style={s.rowValue}>{dataNascimento}</Text></View>
        </View>

        {/* Endereço */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Endereço</Text>
          <View style={s.row}><Text style={s.rowLabel}>CEP</Text><Text style={s.rowValue}>{cep || '—'}</Text></View>
          <View style={[s.row, {borderBottomWidth: 0}]}><Text style={s.rowLabel}>Endereço</Text><Text style={s.rowValue}>{endereco}</Text></View>
        </View>

        {/* Opções */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Opções</Text>
          <TouchableOpacity style={s.row} onPress={() => Alert.alert('Em breve', 'Funcionalidade de notificações em desenvolvimento.')}>
            <Text style={s.rowLabel}>🔔 Notificações</Text>
            <Text style={s.rowValue}>Ativadas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.row, {borderBottomWidth: 0}]} onPress={() => Alert.alert('Em breve', 'Funcionalidade de alterar senha em desenvolvimento.')}>
            <Text style={s.rowLabel}>🔒 Alterar senha</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.exitBtn} onPress={() => navigation.replace('RoleSelect')}>
          <Text style={s.exitText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal editar */}
      <Modal visible={modalEditar} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>Editar Perfil</Text>

              <Text style={s.label}>Nome *</Text>
              <TextInput style={s.input} value={formNome} onChangeText={setFormNome} placeholderTextColor={Colors.gray} />
              <Text style={s.label}>Telefone *</Text>
              <TextInput style={s.input} value={formTelefone} onChangeText={setFormTelefone} placeholderTextColor={Colors.gray} keyboardType="phone-pad" />
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} value={formEmail} onChangeText={setFormEmail} placeholderTextColor={Colors.gray} keyboardType="email-address" autoCapitalize="none" />
              <Text style={s.label}>Data de Nascimento</Text>
              <TextInput style={s.input} value={formNascimento} onChangeText={setFormNascimento} placeholderTextColor={Colors.gray} />

              <Text style={s.labelSection}>Endereço</Text>
              <Text style={s.label}>CEP</Text>
              <TextInput style={s.input} value={formCep} onChangeText={setFormCep} placeholderTextColor={Colors.gray} keyboardType="numeric" />
              <Text style={s.label}>Rua</Text>
              <TextInput style={s.input} value={formRua} onChangeText={setFormRua} placeholderTextColor={Colors.gray} />
              <View style={s.formRow}>
                <View style={{flex: 1}}>
                  <Text style={s.label}>Número</Text>
                  <TextInput style={s.input} value={formNumero} onChangeText={setFormNumero} placeholderTextColor={Colors.gray} keyboardType="numeric" />
                </View>
                <View style={{flex: 2, marginLeft: 12}}>
                  <Text style={s.label}>Bairro</Text>
                  <TextInput style={s.input} value={formBairro} onChangeText={setFormBairro} placeholderTextColor={Colors.gray} />
                </View>
              </View>
              <View style={s.formRow}>
                <View style={{flex: 2}}>
                  <Text style={s.label}>Cidade</Text>
                  <TextInput style={s.input} value={formCidade} onChangeText={setFormCidade} placeholderTextColor={Colors.gray} />
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={s.label}>UF</Text>
                  <TextInput style={s.input} value={formEstado} onChangeText={setFormEstado} placeholderTextColor={Colors.gray} maxLength={2} autoCapitalize="characters" />
                </View>
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={salvar}>
                <Text style={s.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalEditar(false)}>
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
  wrapper:    {flex: 1, backgroundColor: Colors.matriz},
  container:  {flex: 1},
  content:    {padding: 24, paddingTop: 56, paddingBottom: 40},
  avatarWrap: {alignItems: 'center', marginBottom: 24},
  avatar:     {width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.pulso + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.pulso},
  avatarText: {fontSize: 32, fontWeight: '700', color: Colors.pulso},
  nome:       {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  cpf:        {fontSize: 14, color: Colors.gray, marginTop: 4},

  resumoRow:  {flexDirection: 'row', gap: 8, marginBottom: 20},
  resumoCard: {flex: 1, backgroundColor: '#162433', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  resumoValor:{fontSize: 18, fontWeight: '800', color: Colors.clareza},
  resumoLabel:{fontSize: 10, color: Colors.gray, marginTop: 2, fontWeight: '600'},

  section:      {backgroundColor: '#162433', borderRadius: 12, borderWidth: 1, borderColor: '#1E3448', overflow: 'hidden', marginBottom: 16},
  sectionHeader:{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0},
  sectionTitle: {fontSize: 13, fontWeight: '700', color: Colors.pulso, padding: 16, paddingBottom: 8},
  editBtn:      {fontSize: 13, color: Colors.pulso, fontWeight: '600'},
  row:          {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  rowLabel:     {fontSize: 14, color: Colors.gray},
  rowValue:     {fontSize: 14, fontWeight: '600', color: Colors.clareza, flex: 1, textAlign: 'right'},
  rowArrow:     {fontSize: 20, color: Colors.gray},

  exitBtn:    {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EF4444'},
  exitText:   {color: '#EF4444', fontWeight: '700', fontSize: 15},

  overlay:    {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:      {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '90%'},
  sheetTitle: {fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 8},
  label:      {fontSize: 13, fontWeight: '600', color: Colors.gray, marginBottom: 6, marginTop: 12},
  labelSection:{fontSize: 15, fontWeight: '700', color: Colors.pulso, marginTop: 20, marginBottom: 4},
  input:      {height: 48, backgroundColor: '#162433', borderRadius: 8, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14, color: Colors.clareza, fontSize: 15},
  formRow:    {flexDirection: 'row'},
  saveBtn:    {height: 52, backgroundColor: Colors.pulso, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  saveBtnText:{color: Colors.matriz, fontWeight: '700', fontSize: 16},
  cancel:     {textAlign: 'center', color: Colors.gray, marginTop: 16, fontSize: 14},
});
