import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, RefreshControl, ActivityIndicator} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';
import {useAuth} from '../../context/AuthContext';
import {listarPedidosDespachante, concluirEtapaPedido, PedidoData} from '../../services/api';

export default function EmAndamentoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DespachanteStackParamList>>();
  const {despachante} = useAuth();
  const [pedidos, setPedidos] = useState<PedidoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<PedidoData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    if (!despachante?.id) return;
    const res = await listarPedidosDespachante(despachante.id);
    if (res.success && res.pedidos) setPedidos(res.pedidos.filter(p => p.status === 'em_transito'));
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [despachante?.id]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar().finally(() => setRefreshing(false));
  }, [despachante?.id]);

  const confirmarEntrega = async (p: PedidoData) => {
    // Conclui etapas restantes
    const etapas = p.etapas || [];
    for (const etapa of etapas) {
      if (!etapa.concluida) {
        await concluirEtapaPedido(p.id, etapa.id);
      }
    }
    carregar();
  };

  if (loading) {
    return <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={Colors.pulso} /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Em Andamento</Text>
        <View style={s.badge}><Text style={s.badgeText}>{pedidos.length}</Text></View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: 24, paddingTop: 0, gap: 10}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pulso} />}
      >
        {pedidos.map(p => {
          const etapaAtual = p.etapas?.find(e => !e.concluida)?.nome || 'Em andamento';
          return (
            <View key={p.id} style={s.card}>
              <View style={s.cardLeft}>
                <View style={s.pulse} />
              </View>
              <View style={s.info}>
                <View style={s.cardTop}>
                  <Text style={s.id}>#{p.numero} · {p.cliente_nome}</Text>
                </View>
                <Text style={s.empresa}>{p.volumes} vol.</Text>
                <Text style={s.etapa}>{etapaAtual}</Text>
                <Text style={s.destino}>📍 {p.excursao_nome}</Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.entregarBtn} onPress={() => confirmarEntrega(p)}>
                  <Text style={s.entregarText}>Entregar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDetalhe(p)}>
                  <Text style={s.verText}>Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {pedidos.length === 0 && <Text style={s.empty}>Nenhum pedido em andamento</Text>}
      </ScrollView>

      <Modal visible={!!detalhe} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>#{detalhe?.numero}</Text>
              <View style={s.detRow}><Text style={s.detLabel}>Cliente</Text><Text style={s.detValue}>{detalhe?.cliente_nome}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Destino</Text><Text style={s.detValue}>{detalhe?.excursao_nome}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Volumes</Text><Text style={s.detValue}>{detalhe?.volumes}</Text></View>
              <View style={s.detRow}><Text style={s.detLabel}>Descrição</Text><Text style={s.detValue}>{detalhe?.descricao || '—'}</Text></View>

              <Text style={s.sectionTitle}>Etapas</Text>
              {detalhe?.etapas?.map((etapa) => (
                <View key={etapa.id} style={s.etapaRow}>
                  <View style={[s.etapaDot, etapa.concluida && s.etapaDotDone]} />
                  <Text style={[s.etapaNome, etapa.concluida && s.etapaNomeDone]}>{etapa.nome}</Text>
                  {etapa.hora && <Text style={s.etapaHora}>{new Date(etapa.hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</Text>}
                </View>
              ))}

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
  etapaRow:    {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8},
  etapaDot:    {width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#1E3448', backgroundColor: '#0F1F2E'},
  etapaDotDone:{backgroundColor: Colors.pulso, borderColor: Colors.pulso},
  etapaNome:   {flex: 1, fontSize: 14, color: Colors.gray},
  etapaNomeDone:{color: Colors.clareza, fontWeight: '600'},
  etapaHora:   {fontSize: 12, color: Colors.gray},
  closeBtn:    {height: 52, backgroundColor: '#162433', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, borderWidth: 1, borderColor: '#1E3448'},
  closeBtnText:{color: Colors.clareza, fontWeight: '600', fontSize: 15},
});
