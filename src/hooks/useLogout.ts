import {useAlert} from '../components/CustomAlert';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useAuth} from '../context/AuthContext';
import {clearCredentials} from '../utils/secureStorage';
import {hapticWarning} from '../utils/haptics';

export function useLogout() {
  const {show} = useAlert();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {setEmpresa, setCliente, setDespachante} = useAuth();

  const logout = () => {
    hapticWarning();
    show({
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      type: 'confirm',
      buttons: [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await clearCredentials();
            setEmpresa(null);
            setCliente(null);
            setDespachante(null);
            navigation.replace('Login');
          },
        },
      ],
    });
  };

  return logout;
}
