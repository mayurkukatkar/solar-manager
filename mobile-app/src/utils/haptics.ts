import { Platform, Vibration } from 'react-native';

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

// Attempt optional dynamic import of expo-haptics
let expoHaptics: any = null;
try {
  expoHaptics = require('expo-haptics');
} catch {
  expoHaptics = null;
}

class HapticsService {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subtle selection click (e.g., bottom tab switch, radio toggle, filter pill)
   */
  public selection(): void {
    if (!this.enabled || Platform.OS === 'web') return;

    if (expoHaptics?.selectionAsync) {
      expoHaptics.selectionAsync().catch(() => {});
      return;
    }

    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate(10);
      } catch {}
    }
  }

  /**
   * Physical impact feedback (Light, Medium, Heavy)
   */
  public impact(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Light): void {
    if (!this.enabled || Platform.OS === 'web') return;

    if (expoHaptics?.impactAsync) {
      const expoStyle =
        style === ImpactFeedbackStyle.Heavy
          ? expoHaptics.ImpactFeedbackStyle?.Heavy
          : style === ImpactFeedbackStyle.Medium
          ? expoHaptics.ImpactFeedbackStyle?.Medium
          : expoHaptics.ImpactFeedbackStyle?.Light;

      expoHaptics.impactAsync(expoStyle).catch(() => {});
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const duration =
          style === ImpactFeedbackStyle.Heavy ? 60 : style === ImpactFeedbackStyle.Medium ? 35 : 15;
        Vibration.vibrate(duration);
      } catch {}
    }
  }

  public impactLight(): void {
    this.impact(ImpactFeedbackStyle.Light);
  }

  public impactMedium(): void {
    this.impact(ImpactFeedbackStyle.Medium);
  }

  public impactHeavy(): void {
    this.impact(ImpactFeedbackStyle.Heavy);
  }

  /**
   * Notification feedback (Success, Warning, Error)
   */
  public notification(type: NotificationFeedbackType = NotificationFeedbackType.Success): void {
    if (!this.enabled || Platform.OS === 'web') return;

    if (expoHaptics?.notificationAsync) {
      const expoType =
        type === NotificationFeedbackType.Error
          ? expoHaptics.NotificationFeedbackType?.Error
          : type === NotificationFeedbackType.Warning
          ? expoHaptics.NotificationFeedbackType?.Warning
          : expoHaptics.NotificationFeedbackType?.Success;

      expoHaptics.notificationAsync(expoType).catch(() => {});
      return;
    }

    if (Platform.OS === 'android') {
      try {
        if (type === NotificationFeedbackType.Success) {
          // Double-pulse (30ms on, 60ms pause, 40ms on)
          Vibration.vibrate([0, 30, 60, 40]);
        } else if (type === NotificationFeedbackType.Warning) {
          // Staccato warning buzz
          Vibration.vibrate([0, 50, 50, 50]);
        } else {
          // Triple heavy buzz for electrical failure & scan error
          Vibration.vibrate([0, 80, 50, 80, 50, 120]);
        }
      } catch {}
    }
  }

  public notificationSuccess(): void {
    this.notification(NotificationFeedbackType.Success);
  }

  public notificationWarning(): void {
    this.notification(NotificationFeedbackType.Warning);
  }

  public notificationError(): void {
    this.notification(NotificationFeedbackType.Error);
  }
}

export const haptics = new HapticsService();
