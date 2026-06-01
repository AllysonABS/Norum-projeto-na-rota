import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cliente'>;
};

const pedidosMock = [
  {id: '#0012', empresa: 'Trans Silva', status: 'Em trânsito', cor: Colors.pulso},
  {id: '#0011', empresa: 'Rápido Norte', status: 'Entregue', cor: Colors.gray},
  {id: '#0010', empresa: 'Trans Silva', status: 'Aguardando coleta', cor: '#F59E0B'},
];

export default function ClienteDashboard({navigation}: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Meus Pedidos 📦</Text>
        <TouchableOpacity onPress={() => navigation.replace('RoleSelect')}>
          <Text style={styles.switchRole}>Trocar perfil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Acompanhamento</Text>
      <View style={styles.list}>
        {pedidosMock.map(pedido => (
          <TouchableOpacity key={pedido.id} style={styles.card} activeOpacity={0.8}>
            <View style={[styles.statusDot, {backgroundColor: pedido.cor}]} />
            <View style={styles.cardText}>
              <Text style={styles.cardId}>{pedido.id}</Text>
              <Text style={styles.cardEmpresa}>{pedido.empresa}</Text>
            </View>
            <Text style={[styles.cardStatus, {color: pedido.cor}]}>{pedido.status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.matriz},
  content: {padding: 24, paddingTop: 48},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {fontSize: 22, fontWeight: '700', color: Colors.clareza},
  switchRole: {fontSize: 13, color: Colors.pulso, fontWeight: '600'},
  sectionTitle: {
    fontSize: 13,
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: '600',
  },
  list: {gap: 12},
  card: {
    backgroundColor: '#162433',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#1E3448',
  },
  statusDot: {width: 10, height: 10, borderRadius: 5},
  cardText: {flex: 1},
  cardId: {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  cardEmpresa: {fontSize: 13, color: Colors.gray, marginTop: 2},
  cardStatus: {fontSize: 13, fontWeight: '600'},
});
