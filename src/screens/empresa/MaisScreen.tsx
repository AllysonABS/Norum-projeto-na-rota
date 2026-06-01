import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';

const itens = [
  {label: 'Despachantes', icon: '🚚', route: 'Despachantes'},
  {label: 'Excursões', icon: '🗺️', route: 'Excursões'},
  {label: 'Relatórios', icon: '📈', route: 'Relatórios'},
  {label: 'Configurações', icon: '⚙️', route: 'Configurações'},
];

export default function MaisScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <Text style={s.title}>Mais</Text>
      <View style={s.grid}>
        {itens.map(item => (
          <TouchableOpacity key={item.route} style={s.card} onPress={() => navigation.navigate(item.route)} activeOpacity={0.7}>
            <Text style={s.icon}>{item.icon}</Text>
            <Text style={s.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz, padding: 24, paddingTop: 56},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza, marginBottom: 24},
  grid:      {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  card:      {width: '47%', backgroundColor: '#162433', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  icon:      {fontSize: 32, marginBottom: 10},
  label:     {fontSize: 14, fontWeight: '600', color: Colors.clareza},
});
