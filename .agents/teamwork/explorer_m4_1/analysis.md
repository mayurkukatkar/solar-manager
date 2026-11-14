# Architectural Investigation & Blueprint: Native Android Interactions, Haptics & Gestures
**Milestone M4**: Native Android Interactions, Performance & Layout Validation  
**Role**: Explorer M4-1 (Haptics & Android Gestures Specialist)  
**Target Codebase**: `mobile-app/` (React Native 0.88, Expo SDK 58, New Architecture)  
**Date**: October 30, 2026

---

## 1. Executive Summary

This investigation delivers the complete architectural evaluation and implementation blueprint for **native Android interactions, purposeful tactile feedback (haptics), touch target ergonomics (48x48 dp), hardware back button (`BackHandler`) handling, and responsive layout resilience** across WhereReady Solar OS.

### Key Discoveries & Health Check
1. **Haptics Architecture**: `expo-haptics` is **not installed** in `mobile-app/package.json`. However, `android.permission.VIBRATE` **is already present** in `android/app/src/main/AndroidManifest.xml` (line 7). To guarantee zero dependency conflicts, zero native module linking crashes, and seamless execution across real devices, emulators, and Expo Go, we architect a unified, resilient haptics utility (`src/utils/haptics.ts`) that features dual-mode execution: an optional dynamic binding to `expo-haptics` with a calibrated fallback to React Native's built-in `Vibration` API using precise millisecond vibration patterns.
2. **Business Interaction Touchpoints**: Identified 7 critical touchpoints for purposeful, non-intrusive haptic feedback: Barcode scanning (success/duplicate), project stage progression gating, electrical QA safety sign-off (<5.0Ω / <2.0s), dirty form discard warnings, bottom tab navigation switches, quick action FAB triggers, and primary UI buttons.
3. **Touch Ergonomics & Accessibility**: Material Design and WCAG 2.5.5 mandate a **48x48 dp minimum touch target**. In `src/theme/tokens.ts`, `touchTarget.min` was configured to `44` (the iOS guideline). Sub-48dp interactive touch targets without `hitSlop` were uncovered in `Header.tsx` (32–34dp buttons), `FieldProjectsScreen.tsx` (28dp contact buttons), and `DashboardScreen.tsx` (30dp quick contact buttons). In contrast, `PipelineScreen.tsx` already successfully implements `minHeight: 48, minWidth: 48`.
4. **Android Hardware Back (`BackHandler`) Safety**: `RootNavigator.tsx` implements global stack popping and a double-back exit guard. However, a comprehensive audit of all 20+ modal surfaces revealed **6 modal containers missing `onRequestClose`**, which traps Android users when the hardware back button or predictive back gesture is triggered.
5. **Dynamic Font Scaling & Screen Responsiveness**: Discovered that `mobile-app/src` does not currently consume screen dimension hooks. Small 320–360dp devices (frequent among Indian tier-2/3 EPC field teams) risk horizontal text truncation on 4-pill rows in `DashboardScreen.tsx`. Tab labels, badges, and metric counters require `maxFontSizeMultiplier` constraints to prevent vertical blowout when Android Accessibility Font Scaling is elevated up to 200%.

---

## 2. Haptics Architecture & Unified Service Design

### 2.1 Package Audit
- `mobile-app/package.json`: Contains React 19.3.0, React Native 0.88.0, and Expo SDK 58. `expo-haptics` is absent from `dependencies`.
- `android/app/src/main/AndroidManifest.xml`: Line 7 explicitly declares:
  ```xml
  <uses-permission android:name="android.permission.VIBRATE"/>
  ```
  This means the native Android vibrator hardware is fully permitted and ready without modifying native manifests.

### 2.2 Architectural Decision: Resilient Universal Haptics Service
Attempting a static import of `expo-haptics` when the module is not installed or unlinked will cause Hermes to crash with `Cannot find module 'expo-haptics'`. Conversely, relying solely on uncalibrated vibrations causes annoying, buzzing phone shakes that degrade UX.

The ideal pattern is a **unified haptic utility** in `mobile-app/src/utils/haptics.ts`:
1. Safely checks for `expo-haptics` via dynamic evaluation.
2. If `expo-haptics` is available, delegates directly to native Taptic Engine / Android HapticFeedbackConstants.
3. If `expo-haptics` is absent, seamlessly falls back to React Native's `Vibration.vibrate(pattern)` using carefully calibrated micro-durations on Android.
4. Provides a silent no-op on Web or unsupported environments.
5. Employs a global enable/disable preference flag (`isHapticsEnabled`).

### 2.3 Calibrated Tactile Profiles for Android
| Haptic Type | Expo Equivalent | React Native `Vibration` Fallback (Android) | Purpose / Sensation |
|---|---|---|---|
| **Selection** | `selectionAsync()` | `Vibration.vibrate(10)` | Crisp 10ms micro-click for tabs, checkboxes, pills |
| **Impact Light** | `impactAsync(Light)` | `Vibration.vibrate(15)` | Subtle 15ms tap for button presses, accordions |
| **Impact Medium** | `impactAsync(Medium)` | `Vibration.vibrate(35)` | 35ms solid pulse for FAB triggers, modal launches |
| **Impact Heavy** | `impactAsync(Heavy)` | `Vibration.vibrate(60)` | 60ms firm thud for stage advancement, payment receipt |
| **Success** | `notificationAsync(Success)` | `Vibration.vibrate([0, 30, 60, 40])` | Double-pulse (30ms on, 60ms pause, 40ms on) for scan & QA pass |
| **Warning** | `notificationAsync(Warning)` | `Vibration.vibrate([0, 50, 50, 50])` | Rapid staccato buzz for dirty form discard & prerequisite block |
| **Error** | `notificationAsync(Error)` | `Vibration.vibrate([0, 80, 50, 80, 50, 120])` | Triple heavy buzz for electrical failure & scan error |

### 2.4 Proposed Implementation: `mobile-app/src/utils/haptics.ts`
```typescript
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
          // Double-tap pulse
          Vibration.vibrate([0, 30, 60, 40]);
        } else if (type === NotificationFeedbackType.Warning) {
          // Staccato warning buzz
          Vibration.vibrate([0, 50, 50, 50]);
        } else {
          // Heavy error pattern
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
```

---

## 3. Key Business Interaction Points (Tactile Integration Blueprint)

Here is the exact mapping of all high-value user interaction points identified during investigation:

### 3.1 Barcode & QR Scan Success
- **Target File**: `mobile-app/src/screens/operations/BarcodeScannerModal.tsx`
- **Location 1 (Module Scanned Successfully)**: Lines 303–311
  ```typescript
  // In handleBarcodeScanned:
  setModuleSerials((prev) => [clean, ...prev]);
  haptics.notificationSuccess(); // <-- PURPOSEFUL TACTILE FEEDBACK FOR FIELD CAMERA
  ```
- **Location 2 (Inverter Scanned Successfully)**: Line 290
  ```typescript
  setInverterSerial(clean);
  haptics.notificationSuccess();
  ```
- **Location 3 (Duplicate Serial Detected)**: Line 296 & Line 337
  ```typescript
  if (dup.isDuplicate) {
    haptics.notificationWarning(); // <-- TACTILE WARNING
    Alert.alert('Duplicate Serial', ...);
  }
  ```
- **Location 4 (Invalid Barcode Parse)**: Line 267
  ```typescript
  if (!parsed) {
    haptics.notificationError();
    Alert.alert('Invalid Barcode', ...);
  }
  ```
- **Location 5 (Scanner Mode Tab Switch)**: Lines 409 & 423
  ```typescript
  onPress={() => {
    haptics.selection();
    setScannedMode('MODULE');
  }}
  ```
- **Field Ergonomics Benefit**: When an installer scans PV modules in continuous mode on a sunny rooftop, the double-pulse success vibration gives instant physical confirmation that the barcode was saved without needing to shield the screen from glare.

---

### 3.2 Canonical Stage Advancement Confirmation
- **Target File**: `mobile-app/src/screens/projects/FieldProjectsScreen.tsx`
- **Location 1 (Prerequisite Gating Violation Blocked)**: Lines 217–223
  ```typescript
  const unmet = prereqs.filter((c) => !c.met);
  if (unmet.length > 0) {
    haptics.notificationWarning(); // <-- TACTILE GATE BLOCK
    Alert.alert('Prerequisites Incomplete', ...);
    return;
  }
  ```
- **Location 2 (Stage Advance Success)**: Line 232
  ```typescript
  await tenantApi.advanceProjectStage(...);
  haptics.notificationSuccess(); // <-- TACTILE MILESTONE PASS
  Alert.alert('Stage Advanced Successfully! 🎉', ...);
  ```
- **Location 3 (Stage Filter Pills)**: Lines 415–455
  ```typescript
  onPress={() => {
    haptics.selection();
    setActiveFilter(stage.id);
  }}
  ```

---

### 3.3 Electrical QA Sign-Off (CEA Safety Regulations)
- **Target File**: `mobile-app/src/screens/operations/InstallationQAModal.tsx`
- **Location 1 (Threshold Violation Blocked)**: Lines 113–119
  ```typescript
  if (!allTestsPass) {
    haptics.notificationError(); // <-- REJECTED STATUTORY THRESHOLD
    Alert.alert('Electrical Safety Gating Blocked', ...);
    return;
  }
  ```
- **Location 2 (CEA Safety Certified Passed)**: Line 141
  ```typescript
  haptics.notificationSuccess(); // <-- TACTILE QA CERTIFICATION CONFIRMED
  Alert.alert('QA Testing Passed & Certified', ...);
  ```
- **Location 3 (Checklist Item Toggle)**: Line 84
  ```typescript
  const toggleItem = (id: string) => {
    haptics.selection();
    setChecklist(...);
  };
  ```

---

### 3.4 Dirty Form Discard Warning (Centralized Hook)
- **Target File**: `mobile-app/src/components/common/ModalHeader.tsx`
- **Observation**: All major modals (`LeadCaptureModal`, `CustomerOnboardingModal`, `InstallationQAModal`, `ProjectDossierModal`, `QuotationBuilderModal`) utilize `useDirtyFormWarning` and `ModalHeader`.
- **Architectural Solution**: Embedding `haptics.notificationWarning()` directly inside `useDirtyFormWarning` provides automatic tactile protection across the entire application:
  ```typescript
  export const useDirtyFormWarning = (
    isDirty: boolean,
    action: () => void,
    title = 'Discard Unsaved Changes?',
    message = 'You have unsaved changes in this form. Are you sure you want to discard them?'
  ) => {
    return () => {
      if (!isDirty) {
        action();
        return;
      }
      haptics.notificationWarning(); // <-- TACTILE REJECTION ALERT
      Alert.alert(title, message, [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: action },
      ]);
    };
  };
  ```
  And in `ModalHeader.tsx` `handleClose` and `handleBack`:
  ```typescript
  const handleClose = () => {
    if (!onClose) return;
    if (isDirty) {
      haptics.notificationWarning();
      Alert.alert(dirtyConfirmTitle, dirtyConfirmMessage, ...);
    } else {
      onClose();
    }
  };
  ```

---

### 3.5 Bottom Tab Bar Navigation Switches
- **Target File**: `mobile-app/src/navigation/RootNavigator.tsx`
- **Observation**: `Tab.Navigator` currently lacks `screenListeners`.
- **Implementation**:
  ```typescript
  <Tab.Navigator
    backBehavior="firstRoute"
    screenListeners={{
      tabPress: () => {
        haptics.selection(); // <-- CRISP NATIVE TAB TICK
      },
    }}
    screenOptions={{ ... }}
  >
  ```
  Every tab selection (Dashboard, Pipeline, Projects, Finance) instantly delivers a crisp 10ms micro-tick.

---

### 3.6 Quick Action FAB Trigger
- **Target Files**: `mobile-app/src/navigation/RootNavigator.tsx` & `mobile-app/src/components/QuickActionsDispatcher.tsx`
- **Center FAB Button (`RootNavigator.tsx` lines 204–224)**:
  ```typescript
  tabBarButton: () => (
    <TouchableOpacity
      style={styles.centerFabContainer}
      onPress={() => {
        haptics.impactMedium(); // <-- SOLID MEDIUM IMPACT WHEN EXPANDING FAB
        setQuickActionsVisible(true);
      }}
      ...
    >
  ```
- **Action Items (`QuickActionsDispatcher.tsx` line 80, 95, 113, 129)**:
  ```typescript
  onPress: () => {
    haptics.impactLight();
    onClose();
    onOpenNewLead();
  }
  ```

---

### 3.7 Primary Action Buttons Primitive
- **Target File**: `mobile-app/src/components/common/Button.tsx`
- **Implementation**: Add an optional `haptic` prop to `ButtonProps`:
  ```typescript
  export interface ButtonProps {
    ...
    haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'none';
  }
  ```
  Inside `onPress`:
  ```typescript
  const handlePress = (e: GestureResponderEvent) => {
    if (!isInteractive) return;
    if (haptic && haptic !== 'none') {
      if (haptic === 'selection') haptics.selection();
      else if (haptic === 'medium') haptics.impactMedium();
      else if (haptic === 'heavy') haptics.impactHeavy();
      else if (haptic === 'success') haptics.notificationSuccess();
      else haptics.impactLight();
    } else if (variant === 'primary' || variant === 'solar' || variant === 'danger') {
      haptics.impactLight(); // Default tactile feedback for primary actions
    }
    onPress(e);
  };
  ```

---

## 4. Android Touch Ergonomics & 48x48 dp Accessibility Audit

### 4.1 Accessibility Standards
- **Google Android Accessibility Guidelines**: Interactive UI elements must have a touch target of at least **48x48 dp**.
- **WCAG 2.5.5 (Target Size)**: 44x44 dp minimum (Enhanced: 48x48 dp).
- If a visual element is smaller than 48dp, React Native's `hitSlop` must be applied so the touch responder area expands to >= 48x48 dp.

### 4.2 Design Token Audit: `mobile-app/src/theme/tokens.ts`
- **Current Lines 115–119**:
  ```typescript
  export const touchTarget = {
    min: 44,          // <-- iOS guideline (44)
    comfortable: 48,
    large: 54,
  } as const;
  ```
- **Upgrade Blueprint**:
  ```typescript
  export const touchTarget = {
    min: Platform.select({ android: 48, default: 44 }),
    comfortable: 48,
    large: 54,
  } as const;
  ```

### 4.3 Sub-48dp Touch Targets Audit & HitSlop Rectification
| Screen / Component | Element | Current Visual Size | HitSlop Present? | Required Rectification |
|---|---|---|---|---|
| `components/Header.tsx:620-635` | `homeSearchBtn`, `homeAvatarBtn` | 32 x 32 dp | ❌ None | Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` (Total: 48x48) |
| `components/Header.tsx:711-730` | `mainSearchBtn`, `avatarPill` | 34 x 34 dp | ❌ None | Add `hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}` (Total: 48x48) |
| `screens/projects/FieldProjectsScreen.tsx:1078-1097` | `circleCallBtn`, `circleWhatsAppBtn` | 28 x 28 dp | ❌ None | Change to `minWidth: 48, minHeight: 48` or add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` |
| `screens/projects/FieldProjectsScreen.tsx:1058-1067` | `pillActionBtn` (Serials, QA, DISCOM, Advance) | ~24 dp height | ❌ None | Set `minHeight: 36` and add `hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}` |
| `screens/dashboard/DashboardScreen.tsx:1366-1380` | `microCallBtn`, `microWhatsAppBtn` | 30 x 30 dp | ❌ None | Add `hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}` |
| `screens/dashboard/DashboardScreen.tsx:1464-1482` | `metricFilterBtn` | ~20 dp height | ❌ None | Set `minHeight: 32` and `hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}` |
| `components/common/Input.tsx:239-242` | `actionBtn` (Clear & Password visibility toggle) | 24 x 24 dp | ⚠️ 8dp | Increase to `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` (Total: 48x48) |
| `components/common/Button.tsx:61-67` | `size === 'sm'` | minHeight: 36 | ⚠️ 6dp | Add `minWidth: 48` to ensure square icon buttons meet 48x48 |

---

## 5. Android Hardware Back Button (`BackHandler`) Audit

### 5.1 Root Navigator Exit Behavior
In `mobile-app/src/navigation/RootNavigator.tsx` (lines 341–395):
- Correctly checks `navigationRef.canGoBack()` and calls `navigationRef.goBack()`.
- Correctly navigates back from secondary tabs (`Pipeline`, `Projects`, `Finance`) to `Dashboard`.
- Implements standard Android **double-tap back to exit** with `ToastAndroid.show('Press back again to exit WhereReady Solar OS')` within a 2000ms window.

### 5.2 Identified Modal Back Button Gaps
When a React Native `<Modal>` is presented on Android, it intercepts the native key events. If `onRequestClose` is omitted, the user is trapped or pressing back causes abrupt stack exits.

We audited every `<Modal>` in the application and identified **6 critical omissions**:

1. **`screens/operations/OperationsScreen.tsx:484`**
   - Current: `<Modal visible={!!activeJob} animationType="slide">`
   - Issue: Technicians opening field job execution cannot press back to exit the sheet.
   - Fix: Add `onRequestClose={() => setActiveJob(null)}`.
2. **`screens/modules/submodules/SurveysModule.tsx:198`**
   - Current: `<Modal visible={scheduleSurveyModal} animationType="slide" transparent>`
   - Issue: Site survey booking dialog traps back button.
   - Fix: Add `onRequestClose={() => setScheduleSurveyModal(false)}`.
3. **`screens/modules/submodules/InvoicingModule.tsx:311`**
   - Current: `<Modal visible={paymentModalVisible} animationType="slide" transparent>`
   - Issue: Payment recording modal does not dismiss on hardware back.
   - Fix: Add `onRequestClose={() => setPaymentModalVisible(false)}`.
4. **`screens/auth/LoginScreen.tsx:233`**
   - Current: `<Modal visible={resetModalVisible} transparent animationType="slide">`
   - Issue: First-time password reset modal lacks back listener.
   - Fix: Add `onRequestClose={() => setResetModalVisible(false)}` (or toast if password reset is strictly mandatory).
5. **`screens/crm/LeadsScreen.tsx:460`**
   - Current: `<Modal visible={addModalVisible} animationType="slide" transparent>`
   - Issue: Add Lead modal lacks back listener.
   - Fix: Add `onRequestClose={() => setAddModalVisible(false)}`.
6. **`screens/finance/FinanceScreen.tsx:791`**
   - Current: `<Modal visible={paymentModalVisible} transparent animationType="slide">`
   - Issue: Finance Screen Payment recording modal lacks back listener.
   - Fix: Add `onRequestClose={() => setPaymentModalVisible(false)}`.

### 5.3 Non-Dismissible Security Modals
`AccountSuspendedModal.tsx` and `SessionExpiredModal.tsx` deliberately enforce non-dismissible states:
```typescript
onRequestClose={() => {
  // Enforce non-dismissible: Android hardware back cannot dismiss
}}
```
**Enhancement**: On Android, when the user presses hardware back while blocked by these screens, provide a subtle Toast feedback:
`ToastAndroid.show('Sign in to continue using Solar OS', ToastAndroid.SHORT);` so the user knows the keypress was received.

---

## 6. Dynamic Font Scaling & Responsive Layout Verification

### 6.1 Android Dynamic Font Scaling
Android users can adjust the font size scale in **Settings > Display > Font Size** (ranging from 0.85x up to 2.0x+ for accessibility).

#### Identified Risks:
1. **Fixed-Height Containers**: Any container with fixed `height` (e.g., `height: 48` on buttons or pills) will clip text when font scale increases to 1.3x+.
   - *Rule*: Always use `minHeight` rather than fixed `height`.
2. **Horizontal Overflow in Multi-Column Pill Rows**:
   - `DashboardScreen.tsx:1271-1284` has 4 pills in `quickActionRow` with `flex: 1`. On a 320dp device, each pill has only ~66dp total width. If font scale is 1.3x+, strings like `"Projects"` and `"60s Quote"` will clip or break awkwardly.
   - *Fix*: Allow `flexWrap: 'wrap'` on screens < 360dp, or set `maxFontSizeMultiplier={1.2}` on compact pill text.
3. **Tab Bar Labels**:
   - In `RootNavigator.tsx:165`, tab labels are 10px bold. At 2.0x font scaling, they can collide with the tab bar top border.
   - *Fix*: In `RootNavigator.tsx:165`, add:
     ```typescript
     tabBarLabelStyle: [styles.tabLabel, { maxFontSizeMultiplier: 1.3 }]
     ```
4. **Tabular Numerals & Metric Display**:
   - Tabular numerals (`fontVariant: ['tabular-nums']`) are properly defined in `tokens.ts`. On KPI hero cards (`DashboardScreen.tsx:356`), large currency numbers (e.g. `₹18.4L`) should have `maxFontSizeMultiplier={1.4}` and `numberOfLines={1}` with `adjustsFontSizeToFit` to prevent breaking onto two lines.

### 6.2 Responsive Screen Breakpoints (Phone vs. Tablet)
We define three core Android operational tiers:
- **Small Android Handsets (320 – 359 dp)**: Budget JioPhone / Galaxy A0 series. Compact margins (12dp), wrapped action pills.
- **Standard Android Handsets (360 – 430 dp)**: Pixel, Samsung Galaxy S, OnePlus. Standard 16dp margins.
- **Android Tablets & Foldables (600 dp+)**: Samsung Galaxy Tab Active, field tablets. Maximum content width constraint (`maxWidth: 720, alignSelf: 'center'`) to avoid ultra-wide, unreadable stretched rows.

---

## 7. Line-by-Line Implementation Blueprint for Implementer Agent

| Phase | Target File | Line Numbers | Action Required |
|---|---|---|---|
| **P1** | `mobile-app/src/utils/haptics.ts` | New File | Implement universal dual-mode `HapticsService` with `expo-haptics` detection and calibrated `Vibration` fallbacks. |
| **P2** | `mobile-app/src/theme/tokens.ts` | 115–119 | Update `touchTarget.min` to `Platform.select({ android: 48, default: 44 })`. |
| **P3** | `mobile-app/src/components/common/Button.tsx` | 18–35, 180–214 | Add optional `haptic` prop and trigger `haptics.impactLight()` on primary button presses. |
| **P4** | `mobile-app/src/components/common/ModalHeader.tsx` | 30–46, 63–85 | Add `haptics.notificationWarning()` inside `useDirtyFormWarning`, `handleClose`, and `handleBack`. |
| **P5** | `mobile-app/src/navigation/RootNavigator.tsx` | 149–167, 204–224 | Add `screenListeners={{ tabPress: () => haptics.selection() }}` to `Tab.Navigator`. Add `haptics.impactMedium()` to center FAB. Constrain `tabBarLabelStyle` with `maxFontSizeMultiplier: 1.3`. |
| **P6** | `mobile-app/src/screens/operations/BarcodeScannerModal.tsx` | 303, 290, 296, 409 | Add `haptics.notificationSuccess()` on scanned module/inverter, `notificationWarning()` on duplicate, `selection()` on mode tab switch. |
| **P7** | `mobile-app/src/screens/projects/FieldProjectsScreen.tsx` | 218, 232, 453, 1078–1097 | Add `haptics.notificationSuccess()` on stage advance, `notificationWarning()` on prereq block. Add `hitSlop` to `circleCallBtn` and `circleWhatsAppBtn`. |
| **P8** | `mobile-app/src/screens/operations/InstallationQAModal.tsx` | 84, 114, 141 | Add `haptics.notificationSuccess()` on QA certification, `notificationError()` on safety block, `selection()` on checklist toggles. |
| **P9** | `mobile-app/src/components/QuickActionsDispatcher.tsx` | 80, 95, 113, 129 | Add `haptics.impactLight()` to quick action triggers. |
| **P10**| **BackHandler Modal Fixes** | Multiple | Add missing `onRequestClose` to: <br>• `screens/operations/OperationsScreen.tsx:484`<br>• `screens/modules/submodules/SurveysModule.tsx:198`<br>• `screens/modules/submodules/InvoicingModule.tsx:311`<br>• `screens/auth/LoginScreen.tsx:233`<br>• `screens/crm/LeadsScreen.tsx:460`<br>• `screens/finance/FinanceScreen.tsx:791` |
| **P11**| **Header Touch Targets** | `components/Header.tsx:620-635, 711-730` | Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to `homeSearchBtn`, `homeAvatarBtn`, `mainSearchBtn`, and `avatarPill`. |

---
*Report prepared by Explorer M4-1 for Milestone M4 orchestration.*
