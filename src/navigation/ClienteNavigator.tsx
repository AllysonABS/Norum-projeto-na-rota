import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../theme/colors';
import PedidosScreen from '../screens/cliente/PedidosScreen';
import EmpresasScreen from '../screens/cliente/EmpresasScreen';
import PerfilScreen from '../screens/cliente/PerfilScreen';

const Tab = createBottomTabNavigator();

const icon: Record<string, string> = {
  Pedidos: '📦', Empresas: '🏢', Perfil: '👤',
};

export default function ClienteNavigator() {
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
      <Tab.Screen name="Pedidos"  component={PedidosScreen} />
      <Tab.Screen name="Empresas" component={EmpresasScreen} />
      <Tab.Screen name="Perfil"   component={PerfilScreen} />
    </Tab.Navigator>
  );
}
