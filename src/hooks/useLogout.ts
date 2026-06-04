import {useAlert} from '../components/CustomAlert';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useAuth} from '../context/AuthContext';
import {hapticWarning} from '../utils/haptics';

export function useLogout() {
  const {show} = useAlert();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {logout} = useAuth();

  const doLogout = () => {
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
            await logout();
            navigation.replace('Login');
          },
        },
      ],
    });
  };

  return doLogout;
}
