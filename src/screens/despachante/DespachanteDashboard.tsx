import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {Colors} from '../../theme/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Despachante'>;
};

const pedidosMock = [
  {id: '#0012', cliente: 'João da Silva', destino: 'Excursão SP - Lote A', urgente: true},
  {id: '#0013', cliente: 'Maria Souza', destino: 'Excursão RJ - Lote B', urgente: false},
  {id: '#0014', cliente: 'Carlos Mendes', destino: 'Excursão BH - Lote A', urgente: false},
];

export default function DespachanteDashboard({navigation}: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Expedição 🚚</Text>
        <TouchableOpacity onPress={() => navigation.replace('RoleSelect')}>
          <Text style={styles.switchRole}>Trocar perfil</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Pedidos para despachar</Text>
      <View style={styles.list}>
        {pedidosMock.map(pedido => (
          <TouchableOpacity key={pedido.id} style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardText}>
              <View style={styles.cardTop}>
                <Text style={styles.cardId}>{pedido.id}</Text>
                {pedido.urgente && (
                  <View style={styles.urgenteBadge}>
                    <Text style={styles.urgenteText}>URGENTE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardCliente}>{pedido.cliente}</Text>
              <Text style={styles.cardDestino}>{pedido.destino}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
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
  cardText: {flex: 1},
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  cardId: {fontSize: 16, fontWeight: '700', color: Colors.clareza},
  urgenteBadge: {
    backgroundColor: '#7F1D1D',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgenteText: {fontSize: 10, fontWeight: '700', color: '#FCA5A5'},
  cardCliente: {fontSize: 14, color: Colors.clareza, marginBottom: 2},
  cardDestino: {fontSize: 13, color: Colors.gray},
  arrow: {fontSize: 24, color: Colors.pulso},
});
