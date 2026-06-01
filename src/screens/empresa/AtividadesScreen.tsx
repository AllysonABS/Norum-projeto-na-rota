import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, RefreshControl} from 'react-native';
import {Colors} from '../../theme/colors';

type Atividade = {id: string; msg: string; hora: string; tipo: 'coleta' | 'entrega' | 'pedido' | 'alerta'};

const atividades: Atividade[] = [
  {id: '1', msg: 'Ricardo coletou pedido #0138', hora: '09:15', tipo: 'coleta'},
  {id: '2', msg: 'Pedido #0136 entregue na excursão Sul Cargas', hora: '08:55', tipo: 'entrega'},
  {id: '3', msg: 'Novo pedido #0139 criado para Ana Beatriz', hora: '08:50', tipo: 'pedido'},
  {id: '4', msg: 'Fernanda iniciou rota para Rápido Norte - RJ', hora: '08:30', tipo: 'coleta'},
  {id: '5', msg: 'Pedido #0135 parado há mais de 2h', hora: '08:20', tipo: 'alerta'},
  {id: '6', msg: 'Ricardo coletou pedido #0136', hora: '07:40', tipo: 'coleta'},
  {id: '7', msg: 'Pedido #0136 criado para Carlos Melo', hora: '07:00', tipo: 'pedido'},
  {id: '8', msg: 'Paulo Mendes entrou em serviço', hora: '06:55', tipo: 'pedido'},
];

const icones = {coleta: '📦', entrega: '✅', pedido: '🆕', alerta: '⚠️'};
const cores = {coleta: Colors.pulso, entrega: '#86EFAC', pedido: '#60A5FA', alerta: '#F59E0B'};

export default function AtividadesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Atividades</Text>
        <Text style={s.subtitle}>Log em tempo real</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 0}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {atividades.map((a, i) => (
          <View key={a.id} style={s.row}>
            <View style={s.timeline}>
              <View style={[s.dot, {backgroundColor: cores[a.tipo]}]} />
              {i < atividades.length - 1 && <View style={s.line} />}
            </View>
            <View style={s.content}>
              <Text style={s.icon}>{icones[a.tipo]}</Text>
              <View style={s.info}>
                <Text style={s.msg}>{a.msg}</Text>
                <Text style={s.hora}>{a.hora}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz},
  header:    {padding: 24, paddingTop: 56, paddingBottom: 16},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  subtitle:  {fontSize: 13, color: Colors.gray, marginTop: 4},
  row:       {flexDirection: 'row', minHeight: 60},
  timeline:  {width: 20, alignItems: 'center'},
  dot:       {width: 10, height: 10, borderRadius: 5, marginTop: 6},
  line:      {width: 2, flex: 1, backgroundColor: '#1E3448', marginTop: 4},
  content:   {flex: 1, flexDirection: 'row', gap: 10, backgroundColor: '#162433', borderRadius: 10, padding: 14, marginBottom: 8, marginLeft: 10, borderWidth: 1, borderColor: '#1E3448'},
  icon:      {fontSize: 18},
  info:      {flex: 1},
  msg:       {fontSize: 14, color: Colors.clareza, fontWeight: '500'},
  hora:      {fontSize: 12, color: Colors.gray, marginTop: 4},
});
