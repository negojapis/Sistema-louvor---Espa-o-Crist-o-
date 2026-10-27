import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { App } from '@capacitor/app';

export const isNativePlatform = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Inicializa serviços nativos do dispositivo (StatusBar, Splash, App Lifecycle)
 */
export async function initNativeMobileApp(onBackButton?: () => boolean) {
  if (!isNativePlatform) return;

  try {
    // Configura a barra de status do celular
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#FAF8F5' });
    }
  } catch (err) {
    console.warn('StatusBar init error:', err);
  }

  try {
    // Oculta a tela de abertura nativa suavemente
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.warn('SplashScreen hide error:', err);
  }

  // Tratamento do botão voltar no Android
  if (Capacitor.getPlatform() === 'android') {
    App.addListener('backButton', ({ canGoBack }) => {
      if (onBackButton) {
        const handled = onBackButton();
        if (handled) return;
      }
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }
}

/**
 * Feedback tátil nativo (vibração curta ao interagir)
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (!isNativePlatform) return;
  try {
    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  } catch {
    // Silencioso em caso de dispositivo sem suporte a vibração
  }
}
