import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Colors} from '../../theme/colors';
import StatusBadge from '../../components/StatusBadge';

type Foto = {uri: string; label: string};
type Pedido = {
  id: string; empresa: string; excursao: string;
  status: 'aguardando' | 'em_transito' | 'entregue' | 'cancelado';
  timeline: {hora: string; evento: string}[];
  fotos: Foto[];
};

const pedidos: Pedido[] = [
  {
    id: '#0138', empresa: 'Trans Silva', excursao: 'SP - Lote A',
    status: 'em_transito',
    timeline: [
      {hora: '08:00', evento: 'Pedido recebido'},
      {hora: '09:30', evento: 'Coletado pelo despachante'},
      {hora: '11:15', evento: 'Em rota para excursão'},
    ],
    fotos: [],
  },
  {
    id: '#0131', empresa: 'Rápido Norte', excursao: 'RJ - Lote B',
    status: 'entregue',
    timeline: [
      {hora: '07:00', evento: 'Pedido recebido'},
      {hora: '08:45', evento: 'Coletado pelo despachante'},
      {hora: '10:00', evento: 'Entregue na excursão'},
    ],
    fotos: [],
  },
  {
    id: '#0125', empresa: 'Trans Silva', excursao: 'BH - Lote A',
    status: 'aguardando',
    timeline: [{hora: '06:00', evento: 'Pedido recebido'}],
    fotos: [],
  },
];

export default function PedidosScreen() {
  const [selecionado, setSelecionado] = useState<Pedido | null>(null);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Meus Pedidos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}>
        {pedidos.map(p => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => setSelecionado(p)} activeOpacity={0.8}>
            <View style={s.cardLeft}>
              <Text style={s.pedidoId}>{p.id}</Text>
              <Text style={s.empresa}>{p.empresa}</Text>
              <Text style={s.excursao}>{p.excursao}</Text>
            </View>
            <StatusBadge status={p.status} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selecionado} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetId}>{selecionado?.id}</Text>
                <Text style={s.sheetEmpresa}>{selecionado?.empresa} · {selecionado?.excursao}</Text>
              </View>
              {selecionado && <StatusBadge status={selecionado.status} />}
            </View>

            <Text style={s.timelineTitle}>Histórico</Text>
            {selecionado?.timeline.map((t, i) => (
              <View key={i} style={s.timelineItem}>
                <View style={s.timelineLine}>
                  <View style={s.timelineDot} />
                  {i < (selecionado.timeline.length - 1) && <View style={s.timelineBar} />}
                </View>
                <View style={s.timelineText}>
                  <Text style={s.timelineHora}>{t.hora}</Text>
                  <Text style={s.timelineEvento}>{t.evento}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={s.closeBtn} onPress={() => setSelecionado(null)}>
              <Text style={s.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.matriz},
  header:         {padding: 24, paddingTop: 56, paddingBottom: 20},
  title:          {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  card:           {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1E3448'},
  cardLeft:       {flex: 1, marginRight: 12},
  pedidoId:       {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  empresa:        {fontSize: 13, color: Colors.gray, marginTop: 2},
  excursao:       {fontSize: 12, color: '#60A5FA', marginTop: 2},
  overlay:        {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:          {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40},
  sheetHeader:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24},
  sheetId:        {fontSize: 20, fontWeight: '700', color: Colors.clareza},
  sheetEmpresa:   {fontSize: 13, color: Colors.gray, marginTop: 2},
  timelineTitle:  {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 16},
  timelineItem:   {flexDirection: 'row', gap: 12, marginBottom: 4},
  timelineLine:   {alignItems: 'center', width: 16},
  timelineDot:    {width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.pulso, marginTop: 3},
  timelineBar:    {width: 2, flex: 1, backgroundColor: '#1E3448', marginTop: 4},
  timelineText:   {flex: 1, paddingBottom: 16},
  timelineHora:   {fontSize: 12, color: Colors.gray, marginBottom: 2},
  timelineEvento: {fontSize: 14, color: Colors.clareza, fontWeight: '500'},
  closeBtn:       {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText:   {color: Colors.clareza, fontWeight: '600', fontSize: 15},
});
