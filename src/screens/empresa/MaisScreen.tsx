import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import Icon from '../../components/Icon';
import {useLogout} from '../../hooks/useLogout';

const itens = [
  {label: 'Despachantes', icon: 'truck', route: 'Despachantes'},
  {label: 'Excursões', icon: 'map', route: 'Excursões'},
  {label: 'Relatórios', icon: 'bar-chart-2', route: 'Relatórios'},
  {label: 'Configurações', icon: 'settings', route: 'Configurações'},
];

export default function MaisScreen() {
  const navigation = useNavigation<any>();
  const logout = useLogout();

  return (
    <View style={s.container}>
      <Text style={s.title} accessibilityRole="header">Mais</Text>
      <View style={s.grid}>
        {itens.map(item => (
          <TouchableOpacity
            key={item.route}
            style={s.card}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Ir para ${item.label}`}>
            <View style={s.iconWrap}>
              <Icon name={item.icon} size={28} color={Colors.pulso} />
            </View>
            <Text style={s.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={s.exitBtn}
        onPress={logout}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Sair da conta">
        <Icon name="log-out" size={18} color="#EF4444" />
        <Text style={s.exitText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz, padding: 24, paddingTop: 56},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza, marginBottom: 24},
  grid:      {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  card:      {width: '47%', backgroundColor: '#162433', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448', gap: 12},
  iconWrap:  {width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.pulso + '15', alignItems: 'center', justifyContent: 'center'},
  label:     {fontSize: 14, fontWeight: '600', color: Colors.clareza},
  exitBtn:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, height: 52, backgroundColor: '#162433', borderRadius: 12, borderWidth: 1, borderColor: '#EF4444'},
  exitText:  {fontSize: 15, fontWeight: '700', color: '#EF4444'},
});
