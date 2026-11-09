import { Vibration, Platform } from 'react-native';
import { haptics } from './haptics';

class SoundEffectsManager {
  private soundEnabled: boolean = true;

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Subtle card glide swipe sound / feel
   */
  public playGlide() {
    if (!this.soundEnabled) return;
    haptics.selection();
  }

  /**
   * Tactile choice select (preset pill, roof type, brand)
   */
  public playSelect() {
    if (!this.soundEnabled) return;
    haptics.impact();
  }

  /**
   * Cash / Advance payment confirmation chime
   */
  public playCashChime() {
    if (!this.soundEnabled) return;
    if (Platform.OS === 'android') {
      try {
        // Double pulse mimicking cash register
        Vibration.vibrate([0, 40, 60, 80]);
      } catch {}
    } else {
      haptics.notificationSuccess();
    }
  }

  /**
   * Statutory DISCOM approval / verification badge sound
   */
  public playVerificationShield() {
    if (!this.soundEnabled) return;
    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate([0, 30, 40, 50, 40, 60]);
      } catch {}
    } else {
      haptics.notificationSuccess();
    }
  }

  /**
   * Grand Finale celebration fanfare
   */
  public playCelebrationFanfare() {
    if (!this.soundEnabled) return;
    if (Platform.OS === 'android') {
      try {
        Vibration.vibrate([0, 60, 50, 90, 60, 120, 80, 200]);
      } catch {}
    } else {
      haptics.notificationSuccess();
    }
  }
}

export const soundEffects = new SoundEffectsManager();

