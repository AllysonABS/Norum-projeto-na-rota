import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Image, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';

type PedidoAndamento = {
  id: string; cliente: string; empresa: string; destino: string;
  etapa: string; tempoDecorrido: string; volumes: number;
  fotos: string[];
};

const emAndamento: PedidoAndamento[] = [
  {id: '#0136', cliente: 'Carla Ramos', empresa: 'Trans Silva', destino: 'SP - Lote A', etapa: 'Em rota para excursão', tempoDecorrido: '32 min', volumes: 2, fotos: ['https://via.placeholder.com/200']},
  {id: '#0134', cliente: 'Diego Pinto', empresa: 'Sul Cargas', destino: 'BH - Lote A', etapa: 'Coletado, saindo', tempoDecorrido: '15 min', volumes: 4, fotos: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200']},
];

export default function EmAndamentoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();
  const [detalhe, setDetalhe] = useState<PedidoAndamento | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Em Andamento</Text>
        <View style={s.badge}><Text style={s.badgeText}>{emAndamento.length}</Text></View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {emAndamento.map(p => (
          <View key={p.id} style={s.card}>
            <View style={s.cardLeft}>
              <View style={s.pulse} />
            </View>
            <View style={s.info}>
              <View style={s.cardTop}>
                <Text style={s.id}>{p.id} · {p.cliente}</Text>
                <Text style={s.tempo}>⏱️ {p.tempoDecorrido}</Text>
              </View>
              <Text style={s.empresa}>{p.empresa} · {p.volumes} vol.</Text>
              <Text style={s.etapa}>{p.etapa}</Text>
              <Text style={s.destino}>📍 {p.destino}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity
                style={s.entregarBtn}
                onPress={() => navigation.navigate('Checklist', {pedidoId: p.id, etapa: 'entrega'})}>
                <Text style={s.entregarText}>Entregar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDetalhe(p)}>
                <Text style={s.verText}>Ver detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {emAndamento.length === 0 && (
          <Text style={s.empty}>Nenhum pedido em andamento</Text>
        )}
      </ScrollView>

      {/* Modal detalhes */}
      <Modal visible={!!detalhe} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>{detalhe?.id}</Text>
              <View style={s.detRow}><Text style={s.detLabel}>Cliente</Text><Text style={s.detValue}>{detalhe?.cliente}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Empresa</Text><Text style={s.detValue}>{detalhe?.empresa}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Destino</Text><Text style={s.detValue}>{detalhe?.destino}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{detalhe?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Etapa atual</Text><Text style={[s.detValue, {color: Colors.pulso}]}>{detalhe?.etapa}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Tempo decorrido</Text><Text style={s.detValue}>{detalhe?.tempoDecorrido}</Text></View>

              <Text style={s.sectionTitle}>Fotos tiradas ({detalhe?.fotos.length || 0})</Text>
              {detalhe && detalhe.fotos.length > 0 ? (
                <View style={s.fotosRow}>
                  {detalhe.fotos.map((uri, i) => <Image key={i} source={{uri}} style={s.foto} />)}
                </View>
              ) : (
                <Text style={s.semFotos}>Nenhuma foto ainda</Text>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setDetalhe(null)}>
                <Text style={s.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: Colors.matriz},
  header:      {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24, paddingTop: 56, paddingBottom: 20},
  title:       {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  badge:       {backgroundColor: Colors.pulso, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3},
  badgeText:   {color: Colors.matriz, fontWeight: '800', fontSize: 14},
  card:        {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#1E3448'},
  cardLeft:    {paddingTop: 4},
  pulse:       {width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.pulso},
  info:        {flex: 1},
  cardTop:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  id:          {fontSize: 14, fontWeight: '700', color: Colors.clareza},
  tempo:       {fontSize: 11, color: Colors.gray},
  empresa:     {fontSize: 13, color: '#60A5FA', marginTop: 4},
  etapa:       {fontSize: 13, color: Colors.pulso, marginTop: 2},
  destino:     {fontSize: 12, color: Colors.gray, marginTop: 2},
  actions:     {justifyContent: 'center', alignItems: 'center', gap: 8},
  entregarBtn: {backgroundColor: '#162433', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.pulso},
  entregarText:{color: Colors.pulso, fontWeight: '700', fontSize: 13},
  verText:     {fontSize: 11, color: Colors.gray, fontWeight: '600'},
  empty:       {textAlign: 'center', color: Colors.gray, marginTop: 40, fontSize: 15},
  overlay:     {flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end'},
  sheet:       {backgroundColor: '#0F1F2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, maxHeight: '80%'},
  sheetTitle:  {fontSize: 20, fontWeight: '700', color: Colors.clareza, marginBottom: 16},
  detRow:      {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  detLabel:    {fontSize: 13, color: Colors.gray},
  detValue:    {fontSize: 13, fontWeight: '600', color: Colors.clareza},
  sectionTitle:{fontSize: 14, fontWeight: '700', color: Colors.pulso, marginTop: 20, marginBottom: 12},
  fotosRow:    {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  foto:        {width: 100, height: 100, borderRadius: 10},
  semFotos:    {fontSize: 13, color: Colors.gray, fontStyle: 'italic'},
  closeBtn:    {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText:{color: Colors.clareza, fontWeight: '600', fontSize: 15},
});
