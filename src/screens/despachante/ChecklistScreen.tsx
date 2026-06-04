import React, {useState} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Platform, PermissionsAndroid, TextInput,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {launchCamera, launchImageLibrary, CameraOptions} from 'react-native-image-picker';
import {DespachanteStackParamList} from '../../navigation/DespachanteNavigator';
import {Colors} from '../../theme/colors';
import {useAlert} from '../../components/CustomAlert';
import {concluirEtapaPedido, atualizarStatusPedido, uploadFotoPedido, salvarObservacaoPedido} from '../../services/api';

async function solicitarPermissaoCamera(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;
  try {
    const resultado = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permissão de Câmera',
        message: 'Na Rota precisa da câmera para fotografar os pedidos.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      },
    );
    return resultado === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

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
  const [fotos, setFotos] = useState<string[]>([]);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (i: number) => {
    setMarcados(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const tirarFoto = async () => {
    const permitido = await solicitarPermissaoCamera();
    if (!permitido) {
      show({title: 'Permissão negada', message: 'Ative a permissão de câmera nas configurações.', type: 'warning'});
      return;
    }
    const options: CameraOptions = {mediaType: 'photo', quality: 0.7, saveToPhotos: false};
    launchCamera(options, res => {
      if (res.didCancel) return;
      if (res.errorCode) {
        show({title: 'Erro', message: res.errorMessage ?? 'Não foi possível abrir a câmera.', type: 'error'});
        return;
      }
      const uri = res.assets?.[0]?.uri;
      if (uri) setFotos(prev => [...prev, uri]);
    });
  };

  const abrirGaleria = () => {
    launchImageLibrary({mediaType: 'photo', selectionLimit: 1}, res => {
      if (res.didCancel) return;
      if (res.errorCode) {
        show({title: 'Erro', message: res.errorMessage ?? 'Não foi possível abrir a galeria.', type: 'error'});
        return;
      }
      const uri = res.assets?.[0]?.uri;
      if (uri) setFotos(prev => [...prev, uri]);
    });
  };

  const concluir = async () => {
    const todos = marcados.every(Boolean);
    if (!todos) {
      show({title: 'Atenção', message: 'Marque todos os itens do checklist.', type: 'warning'});
      return;
    }

    setLoading(true);

    // Upload das fotos
    for (const uri of fotos) {
      await uploadFotoPedido(pedidoId, uri, etapa);
    }

    // Salva observação se tiver
    if (observacao.trim()) {
      await salvarObservacaoPedido(pedidoId, observacao.trim());
    }

    // Conclui etapas
    await concluirEtapaPedido(pedidoId, etapa);

    setLoading(false);

    if (etapa === 'coleta') {
      show({title: 'Coleta confirmada!', message: 'Pedido em rota para excursão.', type: 'success', buttons: [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]});
    } else {
      show({title: 'Entrega confirmada!', message: 'Pedido finalizado com sucesso.', type: 'success', buttons: [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]});
    }
  };

  const total = marcados.filter(Boolean).length;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
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

        <Text style={s.section}>Fotos ({fotos.length})</Text>
        <View style={s.fotosRow}>
          {fotos.map((uri, i) => (
            <Image key={i} source={{uri}} style={s.foto} />
          ))}
          <TouchableOpacity style={s.addFoto} onPress={tirarFoto}>
            <Text style={s.addFotoIcon}>📷</Text>
            <Text style={s.addFotoText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.addFoto} onPress={abrirGaleria}>
            <Text style={s.addFotoIcon}>🖼️</Text>
            <Text style={s.addFotoText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Observação (opcional)</Text>
        <TextInput
          style={s.obsInput}
          value={observacao}
          onChangeText={setObservacao}
          placeholder="Ex: Cliente não estava, deixei com porteiro..."
          placeholderTextColor={Colors.gray}
          multiline
        />

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
  fotosRow:        {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  foto:            {width: 90, height: 90, borderRadius: 10},
  addFoto:         {width: 90, height: 90, borderRadius: 10, backgroundColor: '#162433', borderWidth: 1, borderColor: '#1E3448', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4},
  addFotoIcon:     {fontSize: 22},
  addFotoText:     {fontSize: 11, color: Colors.gray, fontWeight: '600'},
  obsInput:        {height: 80, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14, paddingTop: 12, color: Colors.clareza, fontSize: 14, textAlignVertical: 'top', marginBottom: 20},
  concluirBtn:     {height: 56, backgroundColor: Colors.pulso, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  concluirDisabled:{opacity: 0.5},
  concluirText:    {color: Colors.matriz, fontWeight: '800', fontSize: 16},
});
