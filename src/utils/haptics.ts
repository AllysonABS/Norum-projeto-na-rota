import {Platform} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {enableVibrateFallback: true, ignoreAndroidSystemSettings: false};

export function hapticLight() {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('impactLight', options);
  } else {
    ReactNativeHapticFeedback.trigger('soft', options);
  }
}

export function hapticMedium() {
  ReactNativeHapticFeedback.trigger('impactMedium', options);
}

export function hapticSuccess() {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);
}

export function hapticError() {
  ReactNativeHapticFeedback.trigger('notificationError', options);
}

export function hapticWarning() {
  ReactNativeHapticFeedback.trigger('notificationWarning', options);
}
