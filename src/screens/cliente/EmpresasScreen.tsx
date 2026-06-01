import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {Colors} from '../../theme/colors';

const empresas = [
  {id: '1', nome: 'Trans Silva', cnpj: '12.345.678/0001-90', pedidos: 12, cor: Colors.pulso},
  {id: '2', nome: 'Rápido Norte', cnpj: '98.765.432/0001-10', pedidos: 5, cor: '#60A5FA'},
];

export default function EmpresasScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Minhas Empresas</Text>
        <Text style={s.sub}>Empresas com acesso ativo</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: 24, paddingTop: 0, gap: 12}}>
        {empresas.map(e => (
          <View key={e.id} style={s.card}>
            <View style={[s.initial, {backgroundColor: e.cor + '22'}]}>
              <Text style={[s.initialText, {color: e.cor}]}>{e.nome[0]}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.nome}>{e.nome}</Text>
              <Text style={s.cnpj}>{e.cnpj}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeNum}>{e.pedidos}</Text>
              <Text style={s.badgeLabel}>pedidos</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz},
  header:    {padding: 24, paddingTop: 56, paddingBottom: 20},
  title:     {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  sub:       {fontSize: 13, color: Colors.gray, marginTop: 4},
  card:      {backgroundColor: '#162433', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1E3448'},
  initial:   {width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  initialText:{fontSize: 20, fontWeight: '700'},
  info:      {flex: 1},
  nome:      {fontSize: 15, fontWeight: '700', color: Colors.clareza},
  cnpj:      {fontSize: 12, color: Colors.gray, marginTop: 2},
  badge:     {alignItems: 'center'},
  badgeNum:  {fontSize: 20, fontWeight: '800', color: Colors.pulso},
  badgeLabel:{fontSize: 11, color: Colors.gray},
});
