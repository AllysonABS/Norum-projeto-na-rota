import 'react-native-gesture-handler';
import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Keyboard, TouchableWithoutFeedback} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {AuthProvider} from './src/context/AuthContext';
import {AlertProvider} from './src/components/CustomAlert';

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <SafeAreaProvider>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <AppNavigator />
          </TouchableWithoutFeedback>
        </SafeAreaProvider>
      </AlertProvider>
    </AuthProvider>
  );
}
