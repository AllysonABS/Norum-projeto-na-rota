import React from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';

const emAndamento = [
  {id: '#0136', cliente: 'Carla Ramos', destino: 'SP - Lote A', etapa: 'Em rota para excursão'},
  {id: '#0134', cliente: 'Diego Pinto', destino: 'BH - Lote A', etapa: 'Coletado, saindo'},
];

export default function EmAndamentoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Em Andamento</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {emAndamento.map(p => (
          <View key={p.id} style={s.card}>
            <View style={s.pulse} />
            <View style={s.info}>
              <Text style={s.id}>{p.id} · {p.cliente}</Text>
              <Text style={s.etapa}>{p.etapa}</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <TouchableOpacity
              style={s.entregarBtn}
              onPress={() => navigation.navigate('Checklist', {pedidoId: p.id, etapa: 'entrega'})}>
              <Text style={s.entregarText}>Entregar</Text>
            </TouchableOpacity>
          </View>
        ))}
        {emAndamento.length === 0 && (
          <Text style={s.empty}>Nenhum pedido em andamento</Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: Colors.matriz},
  header:      {padding: 24, paddingTop: 56, paddingBottom: 20},
  title:       {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  card:        {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  pulse:       {width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.pulso},
  info:        {flex: 1},
  id:          {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  etapa:       {fontSize: 13, color: Colors.pulso, marginTop: 2},
  destino:     {fontSize: 12, color: Colors.gray, marginTop: 2},
  entregarBtn: {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.pulso},
  entregarText:{color: Colors.pulso, fontWeight: '700', fontSize: 13},
  empty:       {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
});
