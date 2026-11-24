import { registerRootComponent } from 'expo';
import { Platform, Alert } from 'react-native';
import App from './App';

// Polyfill Alert.alert for React Native Web so button alerts/dialogs don't fail silently
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = title ? `${title}\n\n${message || ''}` : (message || '');
    if (buttons && buttons.length > 1) {
      const confirmed = typeof window !== 'undefined' ? window.confirm(text) : true;
      if (confirmed) {
        const okBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
        okBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
    } else {
      if (typeof window !== 'undefined') window.alert(text);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  };
}

registerRootComponent(App);
