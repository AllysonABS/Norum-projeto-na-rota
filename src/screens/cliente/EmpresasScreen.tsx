import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking} from 'react-native';
import {Colors} from '../../theme/colors';

const empresas = [
  {id: '1', nome: 'Trans Silva', cnpj: '12.345.678/0001-90', cidade: 'São Paulo, SP', telefone: '(11) 98765-4321', horario: 'Seg-Sex: 07:00-18:00 | Sáb: 07:00-12:00', pedidos: 12, ativos: 3, cor: Colors.pulso},
  {id: '2', nome: 'Rápido Norte', cnpj: '98.765.432/0001-10', cidade: 'Rio de Janeiro, RJ', telefone: '(21) 91234-5678', horario: 'Seg-Sex: 08:00-17:00', pedidos: 5, ativos: 1, cor: '#60A5FA'},
];

export default function EmpresasScreen({navigation}: any) {
  const [busca, setBusca] = useState('');

  const filtradas = empresas.filter(e => {
    const q = busca.toLowerCase();
    return !q || e.nome.toLowerCase().includes(q) || e.cidade.toLowerCase().includes(q);
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Minhas Lojas</Text>
        <Text style={s.sub}>Toque para ver detalhes e pedidos</Text>
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar loja..." placeholderTextColor={Colors.gray} value={busca} onChangeText={setBusca} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtradas.map(e => (
          <TouchableOpacity
            key={e.id}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EmpresaDetail', {empresa: e})}>
            <View style={[s.accent, {backgroundColor: e.cor}]} />
            <View style={s.cardContent}>
              <View style={s.cardTop}>
                <View style={[s.initial, {backgroundColor: e.cor + '18'}]}>
                  <Text style={[s.initialText, {color: e.cor}]}>{e.nome[0]}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.nome}>{e.nome}</Text>
                  <Text style={s.cidade}>📍 {e.cidade}</Text>
                </View>
                <View style={s.arrow}>
                  <Text style={s.arrowText}>›</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <View style={s.metric}>
                  <Text style={s.metricValue}>{e.pedidos}</Text>
                  <Text style={s.metricLabel}>pedidos</Text>
                </View>
                <View style={s.metricDivider} />
                <View style={s.metric}>
                  <Text style={[s.metricValue, {color: Colors.pulso}]}>{e.ativos}</Text>
                  <Text style={s.metricLabel}>ativos</Text>
                </View>
                <View style={s.metricDivider} />
                <View style={s.metric}>
                  <Text style={s.metricValue}>{e.pedidos - e.ativos}</Text>
                  <Text style={s.metricLabel}>concluídos</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz},
  header: {padding: 24, paddingTop: 56, paddingBottom: 12},
  title: {fontSize: 24, fontWeight: '800', color: Colors.clareza},
  sub: {fontSize: 13, color: Colors.gray, marginTop: 4},
  searchBox: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 14, backgroundColor: '#162433', borderRadius: 10, borderWidth: 1, borderColor: '#1E3448', paddingHorizontal: 14},
  searchIcon: {fontSize: 16, marginRight: 8},
  searchInput: {flex: 1, height: 44, color: Colors.clareza, fontSize: 15},
  list: {padding: 20, paddingTop: 0, gap: 16},
  card: {backgroundColor: '#162433', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E3448'},
  accent: {height: 3, width: '100%'},
  cardContent: {padding: 18},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: 14},
  initial: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  initialText: {fontSize: 22, fontWeight: '800'},
  cardInfo: {flex: 1},
  nome: {fontSize: 17, fontWeight: '700', color: Colors.clareza},
  cidade: {fontSize: 12, color: Colors.gray, marginTop: 3},
  arrow: {width: 32, height: 32, borderRadius: 10, backgroundColor: '#1E3448', alignItems: 'center', justifyContent: 'center'},
  arrowText: {fontSize: 20, color: Colors.clareza, fontWeight: '300', marginTop: -2},
  cardBottom: {flexDirection: 'row', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1E3448', justifyContent: 'space-around'},
  metric: {alignItems: 'center'},
  metricValue: {fontSize: 20, fontWeight: '800', color: Colors.clareza},
  metricLabel: {fontSize: 10, color: Colors.gray, marginTop: 2, fontWeight: '600', textTransform: 'uppercase'},
  metricDivider: {width: 1, height: 32, backgroundColor: '#1E3448'},
});
