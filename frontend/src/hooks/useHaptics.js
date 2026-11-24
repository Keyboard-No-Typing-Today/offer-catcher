import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticTap(style = 'light') {
  try {
    await Haptics.impact({ style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    /* web or unsupported */
  }
}

export async function hapticSuccess() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
}
