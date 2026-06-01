import React from 'react';
import {Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../theme/colors';
import FilaScreen from '../screens/despachante/FilaScreen';
import EmAndamentoScreen from '../screens/despachante/EmAndamentoScreen';
import HistoricoScreen from '../screens/despachante/HistoricoScreen';
import ChecklistScreen from '../screens/despachante/ChecklistScreen';

export type DespachanteStackParamList = {
  Tabs: undefined;
  Checklist: {pedidoId: string; etapa: 'coleta' | 'entrega'};
};

const Stack = createNativeStackNavigator<DespachanteStackParamList>();
const Tab = createMaterialTopTabNavigator();

const icon: Record<string, string> = {
  Fila: '📋', 'Em Andamento': '🔄', Histórico: '✅',
};

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id="despachanteTab"
      tabBarPosition="bottom"
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => (
          <Text style={{fontSize: focused ? 22 : 18}}>{icon[route.name]}</Text>
        ),
        tabBarShowIcon: true,
        tabBarActiveTintColor: Colors.pulso,
        tabBarInactiveTintColor: '#4B6070',
        tabBarStyle: {
          backgroundColor: '#0A1820',
          borderTopColor: '#1E3448',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600', textTransform: 'none'},
        tabBarIndicatorStyle: {backgroundColor: Colors.pulso, top: 0},
      })}>
      <Tab.Screen name="Fila" component={FilaScreen} />
      <Tab.Screen name="Em Andamento" component={EmAndamentoScreen} />
      <Tab.Screen name="Histórico" component={HistoricoScreen} />
    </Tab.Navigator>
  );
}

export default function DespachanteNavigator() {
  return (
    <Stack.Navigator id="despachanteStack" screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
}
