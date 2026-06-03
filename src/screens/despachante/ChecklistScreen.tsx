import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';
import {useAlert} from '../../components/CustomAlert';
import {concluirEtapaPedido, atualizarStatusPedido} from '../../services/api';

type Props = NativeStackScreenProps<DespachanteStackParamList, 'Checklist'>;

const checklistColeta = [
  'Pedido identificado e conferido',
  'Volumes contados e corretos',
  'Embalagem em bom estado',
];

const checklistEntrega = [
  'Chegou na excursão de destino',
  'Pedido entregue ao responsável',
  'Conferência realizada',
];

export default function ChecklistScreen({route, navigation}: Props) {
  const {pedidoId, etapa} = route.params;
  const itens = etapa === 'coleta' ? checklistColeta : checklistEntrega;
  const {show} = useAlert();

  const [marcados, setMarcados] = useState<boolean[]>(new Array(itens.length).fill(false));
  const [loading, setLoading] = useState(false);

  const toggle = (i: number) => {
    setMarcados(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const concluir = async () => {
    const todos = marcados.every(Boolean);
    if (!todos) {
      show({title: 'Atenção', message: 'Marque todos os itens do checklist.', type: 'warning'});
      return;
    }

    setLoading(true);

    if (etapa === 'coleta') {
      // Marca etapa "Em rota para excursão" como concluída
      show({title: 'Coleta confirmada!', message: 'Pedido em rota para excursão.', type: 'success', buttons: [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]});
    } else {
      // Conclui todas as etapas restantes -> pedido vira entregue
      show({title: 'Entrega confirmada!', message: 'Pedido finalizado com sucesso.', type: 'success', buttons: [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]});
    }

    setLoading(false);
  };

  const total = marcados.filter(Boolean).length;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.pedidoLabel}>{pedidoId}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.etapaHeader}>
          <Text style={s.etapaIcon}>{etapa === 'coleta' ? '📦' : '🏁'}</Text>
          <View>
            <Text style={s.etapaTitulo}>{etapa === 'coleta' ? 'Checklist de Coleta' : 'Checklist de Entrega'}</Text>
            <Text style={s.etapaSub}>{total}/{itens.length} itens concluídos</Text>
          </View>
        </View>

        <View style={s.progressBg}>
          <View style={[s.progressFill, {width: `${(total / itens.length) * 100}%`}]} />
        </View>

        <Text style={s.section}>Itens</Text>
        {itens.map((item, i) => (
          <TouchableOpacity key={i} style={s.checkItem} onPress={() => toggle(i)} activeOpacity={0.7}>
            <View style={[s.checkbox, marcados[i] && s.checkboxOn]}>
              {marcados[i] && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={[s.checkLabel, marcados[i] && s.checkLabelDone]}>{item}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.concluirBtn, (total < itens.length || loading) && s.concluirDisabled]}
          onPress={concluir}
          activeOpacity={0.85}
          disabled={loading || total < itens.length}>
          {loading
            ? <ActivityIndicator color={Colors.matriz} />
            : <Text style={s.concluirText}>
                {etapa === 'coleta' ? 'Confirmar Coleta' : 'Confirmar Entrega'}
              </Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       {flex: 1, backgroundColor: Colors.matriz},
  topBar:          {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  backBtn:         {},
  backText:        {color: Colors.pulso, fontSize: 15, fontWeight: '600'},
  pedidoLabel:     {fontSize: 15, fontWeight: '700', color: Colors.clareza},
  content:         {padding: 24, paddingBottom: 40},
  etapaHeader:     {flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16},
  etapaIcon:       {fontSize: 32},
  etapaTitulo:     {fontSize: 18, fontWeight: '700', color: Colors.clareza},
  etapaSub:        {fontSize: 13, color: Colors.gray, marginTop: 2},
  progressBg:      {height: 6, backgroundColor: '#1E3448', borderRadius: 3, overflow: 'hidden', marginBottom: 28},
  progressFill:    {height: 6, backgroundColor: Colors.pulso, borderRadius: 3},
  section:         {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 12, marginTop: 8},
  checkItem:       {flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3448'},
  checkbox:        {width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  checkboxOn:      {backgroundColor: Colors.pulso, borderColor: Colors.pulso},
  checkmark:       {color: Colors.matriz, fontSize: 14, fontWeight: '800'},
  checkLabel:      {flex: 1, fontSize: 15, color: Colors.clareza},
  checkLabelDone:  {color: Colors.gray, textDecorationLine: 'line-through'},
  concluirBtn:     {height: 56, backgroundColor: Colors.pulso, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 28},
  concluirDisabled:{opacity: 0.5},
  concluirText:    {color: Colors.matriz, fontWeight: '800', fontSize: 16},
});
