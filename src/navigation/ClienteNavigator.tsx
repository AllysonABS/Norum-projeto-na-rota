import React from 'react';
import {Text} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../theme/colors';
import PedidosScreen from '../screens/cliente/PedidosScreen';
import EmpresasScreen from '../screens/cliente/EmpresasScreen';
import EmpresaDetailScreen from '../screens/cliente/EmpresaDetailScreen';
import BuscarLojasScreen from '../screens/cliente/BuscarLojasScreen';
import PerfilScreen from '../screens/cliente/PerfilScreen';

const Tab = createMaterialTopTabNavigator();
const EmpresasStack = createNativeStackNavigator();

function EmpresasStackNavigator() {
  return (
    <EmpresasStack.Navigator id="clienteEmpresasStack" screenOptions={{headerShown: false}}>
      <EmpresasStack.Screen name="EmpresasList" component={EmpresasScreen} />
      <EmpresasStack.Screen name="EmpresaDetail" component={EmpresaDetailScreen} />
      <EmpresasStack.Screen name="BuscarLojas" component={BuscarLojasScreen} />
    </EmpresasStack.Navigator>
  );
}

const icon: Record<string, string> = {
  Pedidos: '📦', Lojas: '🏢', Perfil: '👤',
};

export default function ClienteNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id="clienteTab"
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
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Lojas" component={EmpresasStackNavigator} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
