import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Colors} from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import EsqueceuSenhaScreen from '../screens/auth/EsqueceuSenhaScreen';
import CadastroClienteScreen from '../screens/auth/CadastroClienteScreen';
import EmpresaNavigator from './EmpresaNavigator';
import ClienteNavigator from './ClienteNavigator';
import DespachanteNavigator from './DespachanteNavigator';

export type RootStackParamList = {
  Login: undefined;
  CadastroCliente: undefined;
  EsqueceuSenha: undefined;
  RoleSelect: undefined;
  Empresa: undefined;
  Cliente: undefined;
  Despachante: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root"
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: Colors.matriz},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenhaScreen} />
        <Stack.Screen name="CadastroCliente" component={CadastroClienteScreen} />
        <Stack.Screen name="RoleSelect"  component={RoleSelectScreen} />
        <Stack.Screen name="Empresa"     component={EmpresaNavigator} />
        <Stack.Screen name="Cliente"     component={ClienteNavigator} />
        <Stack.Screen name="Despachante" component={DespachanteNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
