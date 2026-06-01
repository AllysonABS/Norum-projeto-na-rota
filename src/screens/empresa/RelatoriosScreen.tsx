import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';

const periodos = ['Hoje', 'Semana', 'Mês'] as const;
type Periodo = typeof periodos[number];

const dados: Record<Periodo, {totalPedidos: number; entregues: number; aguardando: number; emTransito: number; taxaEntrega: number; tempoMedio: string; topDespachantes: {nome: string; entregas: number}[]}> = {
  Hoje: {
    totalPedidos: 138, entregues: 121, aguardando: 5, emTransito: 12,
    taxaEntrega: 87.7, tempoMedio: '48 min',
    topDespachantes: [{nome: 'Ricardo Gomes', entregas: 18}, {nome: 'Fernanda Lima', entregas: 14}, {nome: 'Paulo Mendes', entregas: 9}],
  },
  Semana: {
    totalPedidos: 847, entregues: 790, aguardando: 12, emTransito: 45,
    taxaEntrega: 93.3, tempoMedio: '42 min',
    topDespachantes: [{nome: 'Ricardo Gomes', entregas: 112}, {nome: 'Fernanda Lima', entregas: 98}, {nome: 'Paulo Mendes', entregas: 67}],
  },
  Mês: {
    totalPedidos: 3420, entregues: 3280, aguardando: 30, emTransito: 110,
    taxaEntrega: 95.9, tempoMedio: '39 min',
    topDespachantes: [{nome: 'Ricardo Gomes', entregas: 445}, {nome: 'Fernanda Lima', entregas: 398}, {nome: 'Paulo Mendes', entregas: 290}],
  },
};

export default function RelatoriosScreen() {
  const navigation = useNavigation();
  const [periodo, setPeriodo] = useState<Periodo>('Semana');
  const d = dados[periodo];
  const barMax = Math.max(...d.topDespachantes.map(x => x.entregas));

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Relatórios</Text>

        <View style={s.periodoRow}>
          {periodos.map(p => (
            <TouchableOpacity key={p} style={[s.periodoBtn, periodo === p && s.periodoBtnAtivo]} onPress={() => setPeriodo(p)}>
              <Text style={[s.periodoText, periodo === p && s.periodoTextAtivo]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumo */}
        <View style={s.resumoGrid}>
          <View style={s.resumoCard}>
            <Text style={s.resumoValor}>{d.totalPedidos}</Text>
            <Text style={s.resumoLabel}>Total pedidos</Text>
          </View>
          <View style={s.resumoCard}>
            <Text style={[s.resumoValor, {color: '#86EFAC'}]}>{d.entregues}</Text>
            <Text style={s.resumoLabel}>Entregues</Text>
          </View>
          <View style={s.resumoCard}>
            <Text style={[s.resumoValor, {color: '#F59E0B'}]}>{d.aguardando}</Text>
            <Text style={s.resumoLabel}>Aguardando</Text>
          </View>
          <View style={s.resumoCard}>
            <Text style={[s.resumoValor, {color: Colors.pulso}]}>{d.emTransito}</Text>
            <Text style={s.resumoLabel}>Em trânsito</Text>
          </View>
        </View>

        {/* Taxa de entrega */}
        <View style={s.taxaCard}>
          <View style={s.taxaHeader}>
            <Text style={s.taxaTitle}>Taxa de entrega</Text>
            <Text style={[s.taxaValor, {color: d.taxaEntrega >= 90 ? '#86EFAC' : '#F59E0B'}]}>{d.taxaEntrega}%</Text>
          </View>
          <View style={s.taxaBarBg}>
            <View style={[s.taxaBarFill, {width: `${d.taxaEntrega}%`, backgroundColor: d.taxaEntrega >= 90 ? '#86EFAC' : '#F59E0B'}]} />
          </View>
          <Text style={s.tempoMedio}>⏱️ Tempo médio de entrega: {d.tempoMedio}</Text>
        </View>

        {/* Top despachantes */}
        <Text style={s.section}>Top Despachantes</Text>
        {d.topDespachantes.map((desp, i) => (
          <View key={desp.nome} style={s.despRow}>
            <Text style={s.despPos}>#{i + 1}</Text>
            <View style={s.despInfo}>
              <Text style={s.despNome}>{desp.nome}</Text>
              <View style={s.despBarBg}>
                <View style={[s.despBarFill, {width: `${(desp.entregas / barMax) * 100}%`}]} />
              </View>
            </View>
            <Text style={s.despEntregas}>{desp.entregas}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.matriz},
  content:        {padding: 24, paddingTop: 56, paddingBottom: 40},
  title:          {fontSize: 18, fontWeight: '700', color: Colors.clareza, marginBottom: 20},
  backText:       {color: Colors.pulso, fontSize: 14, fontWeight: '600', marginBottom: 12},
  periodoRow:     {flexDirection: 'row', backgroundColor: '#162433', borderRadius: 8, padding: 4, marginBottom: 20},
  periodoBtn:     {flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6},
  periodoBtnAtivo:{backgroundColor: Colors.pulso},
  periodoText:    {fontSize: 14, fontWeight: '600', color: Colors.gray},
  periodoTextAtivo:{color: Colors.matriz},
  resumoGrid:     {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  resumoCard:     {flex: 1, minWidth: '45%', backgroundColor: '#162433', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E3448'},
  resumoValor:    {fontSize: 24, fontWeight: '800', color: Colors.clareza},
  resumoLabel:    {fontSize: 11, color: Colors.gray, marginTop: 4, fontWeight: '600'},
  taxaCard:       {backgroundColor: '#162433', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#1E3448', marginBottom: 24},
  taxaHeader:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  taxaTitle:      {fontSize: 14, fontWeight: '600', color: Colors.clareza},
  taxaValor:      {fontSize: 20, fontWeight: '800'},
  taxaBarBg:      {height: 8, backgroundColor: '#1E3448', borderRadius: 4, overflow: 'hidden', marginBottom: 12},
  taxaBarFill:    {height: 8, borderRadius: 4},
  tempoMedio:     {fontSize: 13, color: Colors.gray},
  section:        {fontSize: 13, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600', marginBottom: 12},
  despRow:        {backgroundColor: '#162433', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1E3448'},
  despPos:        {fontSize: 14, fontWeight: '800', color: Colors.pulso, width: 28},
  despInfo:       {flex: 1},
  despNome:       {fontSize: 14, fontWeight: '600', color: Colors.clareza, marginBottom: 6},
  despBarBg:      {height: 6, backgroundColor: '#1E3448', borderRadius: 3, overflow: 'hidden'},
  despBarFill:    {height: 6, backgroundColor: Colors.pulso, borderRadius: 3},
  despEntregas:   {fontSize: 14, fontWeight: '700', color: Colors.clareza, width: 40, textAlign: 'right'},
});
