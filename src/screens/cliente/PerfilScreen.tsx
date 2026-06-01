import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

export default function PerfilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.avatarWrap}>
        <View style={s.avatar}><Text style={s.avatarText}>J</Text></View>
        <Text style={s.nome}>João da Silva</Text>
        <Text style={s.cpf}>123.456.789-00</Text>
      </View>

      <View style={s.section}>
        {[
          {label: 'Telefone', value: '(11) 98888-7777'},
          {label: 'E-mail',   value: 'joao@email.com'},
          {label: 'Cadastro', value: '12/01/2024'},
        ].map(item => (
          <View key={item.label} style={s.row}>
            <Text style={s.rowLabel}>{item.label}</Text>
            <Text style={s.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.exitBtn} onPress={() => navigation.replace('RoleSelect')}>
        <Text style={s.exitText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  {flex: 1, backgroundColor: Colors.matriz},
  content:    {padding: 24, paddingTop: 56},
  avatarWrap: {alignItems: 'center', marginBottom: 32},
  avatar:     {width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.pulso + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.pulso},
  avatarText: {fontSize: 32, fontWeight: '700', color: Colors.pulso},
  nome:       {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  cpf:        {fontSize: 14, color: Colors.gray, marginTop: 4},
  section:    {backgroundColor: '#162433', borderRadius: 12, borderWidth: 1, borderColor: '#1E3448', overflow: 'hidden', marginBottom: 24},
  row:        {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  rowLabel:   {fontSize: 14, color: Colors.gray},
  rowValue:   {fontSize: 14, fontWeight: '600', color: Colors.clareza},
  exitBtn:    {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger},
  exitText:   {color: Colors.danger, fontWeight: '700', fontSize: 15},
});
