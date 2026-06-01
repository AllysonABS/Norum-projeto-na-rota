import React from 'react';
import {Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
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
const Tab   = createBottomTabNavigator();

const icon: Record<string, string> = {
  Fila: '📋', 'Em Andamento': '🔄', Histórico: '✅',
};

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused}) => (
          <Text style={{fontSize: focused ? 22 : 18}}>{icon[route.name]}</Text>
        ),
        tabBarActiveTintColor: Colors.pulso,
        tabBarInactiveTintColor: '#4B6070',
        tabBarStyle: {
          backgroundColor: '#0A1820',
          borderTopColor: '#1E3448',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      })}>
      <Tab.Screen name="Fila"         component={FilaScreen} />
      <Tab.Screen name="Em Andamento" component={EmAndamentoScreen} />
      <Tab.Screen name="Histórico"    component={HistoricoScreen} />
    </Tab.Navigator>
  );
}

export default function DespachanteNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs"     component={Tabs} />
      <Stack.Screen
        name="Checklist"
        component={ChecklistScreen}
        options={{presentation: 'modal'}}
      />
    </Stack.Navigator>
  );
}
