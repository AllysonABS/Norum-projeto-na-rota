import 'react-native-gesture-handler';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {AuthProvider} from './src/context/AuthContext';
import {AlertProvider} from './src/components/CustomAlert';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <AuthProvider>
        <AlertProvider>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </AlertProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
