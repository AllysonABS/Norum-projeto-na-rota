import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../theme/colors';
import EmpresaDashboard from '../screens/empresa/EmpresaDashboard';
import ClientesScreen from '../screens/empresa/ClientesScreen';
import DespachantesScreen from '../screens/empresa/DespachantesScreen';
import ExcursoesScreen from '../screens/empresa/ExcursoesScreen';

const Tab = createBottomTabNavigator();

const icon: Record<string, string> = {
  Dashboard: '📊', Clientes: '👥', Despachantes: '🚚', Excursões: '🗺️',
};

export default function EmpresaNavigator() {
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
      <Tab.Screen name="Dashboard"    component={EmpresaDashboard} />
      <Tab.Screen name="Clientes"     component={ClientesScreen} />
      <Tab.Screen name="Despachantes" component={DespachantesScreen} />
      <Tab.Screen name="Excursões"    component={ExcursoesScreen} />
    </Tab.Navigator>
  );
}
