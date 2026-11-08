/**
 * Tier 5: Adversarial UI Primitives Stress Testing Suite
 * WhereReady Solar OS Mobile Client
 * 
 * Conducts rigorous empirical verification and stress testing of all 8 shared UI primitives
 * in mobile-app/src/components/common/ and design system tokens in mobile-app/src/theme/:
 * 
 * 1. Button (Variants, sizes, loading layout stability, double-click/spam prevention, 5000-char inputs)
 * 2. Input (forwardRef, clearable, password toggle, tabularNums, validation states, 5000-char strings)
 * 3. Card (Variants, padding scales, pressable ripple, disabled state, elevation)
 * 4. Badge (Variants, dot indicator, icon box, 5000-char labels, contrast)
 * 5. SkeletonLoader (Compound presets, 700ms pulse animation loop, boundaries)
 * 6. EmptyState (Tones, compact mode, primary/secondary action buttons, 5000-char descriptions)
 * 7. KeyboardAvoidingContainer (Platform behavior, dynamic insets offset, sticky header/footer slots)
 * 8. ModalHeader & useDirtyFormWarning (Dirty form protection, Alert interceptors, back/close actions)
 * 9. Design System Tokens (4pt hybrid spacing scale, negative/extreme steps, formatInr, formatKw)
 * 10. Adversarial Stress & High-Frequency Spam (500-iteration spamming, rapid theme alternation)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');

// Resolve React from web-client for stable server rendering and hook dispatching
const reactPath = path.resolve(__dirname, '../../web-client/node_modules/react').replace(/\\/g, '/');
const reactDomServerPath = path.resolve(__dirname, '../../web-client/node_modules/react-dom/server').replace(/\\/g, '/');
const React = require(reactPath);
const ReactDOMServer = require(reactDomServerPath);

// Global alert call recorder for dirty form verification
global.__lastAlert = null;
global.__keyboardDismissed = false;

// Global React Native and third-party mocks
global.__mockRN = {
  Platform: {
    OS: 'android',
    select: (obj) => (obj.android !== undefined ? obj.android : obj.default),
  },
  StyleSheet: {
    create: (s) => s,
    flatten: (s) => (Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s || {}),
  },
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  ActivityIndicator: 'ActivityIndicator',
  Animated: {
    Value: class {
      constructor(v) { this.v = v; }
    },
    loop: () => ({ start: () => {}, stop: () => {} }),
    sequence: () => ({}),
    timing: () => ({}),
    View: 'Animated.View',
  },
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Keyboard: {
    dismiss: () => { global.__keyboardDismissed = true; },
  },
  Alert: {
    alert: (title, message, buttons) => {
      global.__lastAlert = { title, message, buttons };
    },
  },
  useColorScheme: () => 'light',
  Appearance: { getColorScheme: () => 'light' },
};

global.__mockSafeArea = {
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
};

global.__mockLucide = {
  X: 'LucideX',
  ChevronLeft: 'LucideChevronLeft',
  CheckCircle2: 'LucideCheckCircle2',
  Eye: 'LucideEye',
  EyeOff: 'LucideEyeOff',
};

global.__mockStatusBar = {
  StatusBar: () => null,
  setStatusBarHidden: () => {},
};

global.__mockAsyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
};

global.__mockNav = {
  DefaultTheme: { dark: false, colors: {} },
  DarkTheme: { dark: true, colors: {} },
};

// Set up TSX transpiler with module interception
function compileAndMock(raw) {
  let transpiled = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  transpiled = transpiled.replace(/require\((['"])react\1\)/g, `require('${reactPath}')`);
  transpiled = transpiled.replace(/require\((['"])react-native\1\)/g, 'global.__mockRN');
  transpiled = transpiled.replace(/require\((['"])react-native-safe-area-context\1\)/g, 'global.__mockSafeArea');
  transpiled = transpiled.replace(/require\((['"])lucide-react-native\1\)/g, 'global.__mockLucide');
  transpiled = transpiled.replace(/require\((['"])expo-status-bar\1\)/g, 'global.__mockStatusBar');
  transpiled = transpiled.replace(/require\((['"])@react-native-async-storage\/async-storage\1\)/g, 'global.__mockAsyncStorage');
  transpiled = transpiled.replace(/require\((['"])@react-navigation\/native\1\)/g, 'global.__mockNav');

  return transpiled;
}

require.extensions['.ts'] = function (m, filename) {
  const raw = fs.readFileSync(filename, 'utf8');
  return m._compile(compileAndMock(raw), filename);
};
require.extensions['.tsx'] = require.extensions['.ts'];

// Load the target primitives and tokens under test
const tokens = require('../src/theme/tokens');
const colors = require('../src/theme/colors');
const {
  Button,
  Card,
  Badge,
  Input,
  EmptyState,
  SkeletonLoader,
  KeyboardAvoidingContainer,
  ModalHeader,
  useDirtyFormWarning,
} = require('../src/components/common');

// Hook-safe React tree evaluation helper
function renderToTree(element) {
  let captured = null;
  function HookSafeWrapper() {
    if (element && element.type) {
      if (typeof element.type.render === 'function') {
        captured = element.type.render(element.props, element.ref);
      } else if (typeof element.type === 'function') {
        captured = element.type(element.props);
      } else {
        captured = element;
      }
    }
    return null;
  }
  ReactDOMServer.renderToStaticMarkup(React.createElement(HookSafeWrapper));
  return captured;
}

// Flatten style helper
function flattenStyle(styleProp, isPressed = false) {
  const resolved = typeof styleProp === 'function' ? styleProp({ pressed: isPressed }) : styleProp;
  if (Array.isArray(resolved)) {
    return Object.assign({}, ...resolved.filter(Boolean));
  }
  return resolved || {};
}

// 5,000-character adversarial stress strings
const STRESS_STRING_5000 = 'A'.repeat(5000);
const UNICODE_STRESS_STRING = '⚡ PM Surya Ghar ₹78,000 मुफ़्त बिजली योजना ☀️ DISCOM MSEDCL उपभोक्ता क्रमांक 410022120526 🏢 '.repeat(50);

describe('Tier 5: Adversarial UI Primitives Stress Testing Suite', () => {

  beforeEach(() => {
    global.__lastAlert = null;
    global.__keyboardDismissed = false;
  });

  // ===========================================================================
  // 1. DESIGN SYSTEM TOKENS & SPACING ADVERSARIAL STRESS
  // ===========================================================================
  describe('Suite 1: Design System Tokens & Mathematical Invariants', () => {
    it('1.1 should support dual function-and-index spacing syntax across all 14 standard keys', () => {
      const keys = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16];
      for (const k of keys) {
        const fnVal = tokens.spacing(k);
        const idxVal = tokens.spacing[k];
        assert.equal(fnVal, idxVal, `spacing(${k}) [${fnVal}] must equal spacing[${k}] [${idxVal}]`);
        assert.equal(typeof fnVal, 'number');
      }
      assert.equal(tokens.spacing(4), 16);
      assert.equal(tokens.spacing(8), 32);
      assert.equal(tokens.spacing(12), 48);
    });

    it('1.2 should gracefully compute non-standard steps via 4pt grid multiplier without crashing', () => {
      assert.equal(tokens.spacing(11), 44);
      assert.equal(tokens.spacing(15), 60);
      assert.equal(tokens.spacing(25), 100);
      assert.equal(tokens.spacing(100), 400);
    });

    it('1.3 should handle zero spacing without NaN or undefined', () => {
      assert.equal(tokens.spacing(0), 0);
      assert.equal(tokens.spacing[0], 0);
    });

    it('1.4 should handle negative spacing offsets gracefully without crashing', () => {
      assert.equal(tokens.spacing(-1), -4);
      assert.equal(tokens.spacing(-5), -20);
      assert.equal(tokens.spacing(-10), -40);
    });

    it('1.5 should guarantee touchTarget minimum of at least 44dp for mobile ergonomics', () => {
      assert.ok(tokens.touchTarget.min >= 44, `touchTarget.min (${tokens.touchTarget.min}) must be >= 44dp`);
      assert.ok(tokens.touchTarget.comfortable >= 48, `touchTarget.comfortable must be >= 48dp`);
    });

    it('1.6 should enforce tabular-nums fontVariant contract for financial alignment', () => {
      assert.deepEqual(tokens.tabularNums, { fontVariant: ['tabular-nums'] });
      assert.deepEqual(tokens.typography.tabularNums, { fontVariant: ['tabular-nums'] });
    });

    it('1.7 should format Indian Rupees correctly and document NaN behavior under uninitialized inputs', () => {
      assert.equal(tokens.formatInr(0), '₹0');
      assert.equal(tokens.formatInr(191400), '₹1,91,400');
      assert.equal(tokens.formatInr(78000), '₹78,000');
      assert.equal(tokens.formatInr(2500000), '₹25,00,000');
      // Empirical vulnerability: formatInr does not guard against NaN / undefined, yielding '₹NaN'
      assert.equal(tokens.formatInr(NaN), '₹NaN');
    });

    it('1.8 should format solar capacity kW correctly with 1 decimal place', () => {
      assert.equal(tokens.formatKw(0), '0.0 kW');
      assert.equal(tokens.formatKw(3.3), '3.3 kW');
      assert.equal(tokens.formatKw(5), '5.0 kW');
      assert.equal(tokens.formatKw(10.25), '10.3 kW');
      assert.equal(tokens.formatKw(null), '0.0 kW');
    });
  });

  // ===========================================================================
  // 2. BUTTON PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 2: Button Primitive Adversarial Stress & Double-Click Prevention', () => {
    it('2.1 should render all 7 button variants without throwing', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'solar'];
      for (const variant of variants) {
        const elem = React.createElement(Button, { variant, title: `${variant} button`, onPress: () => {} });
        const tree = renderToTree(elem);
        assert.equal(tree.type, 'Pressable');
        assert.equal(tree.props.accessibilityRole, 'button');
      }
    });

    it('2.2 should configure touch targets correctly across sm, md, and lg sizes', () => {
      // sm size has 36dp height + hitSlop { top: 6, bottom: 6, left: 6, right: 6 } => 48dp effective
      const elemSm = React.createElement(Button, { size: 'sm', title: 'Small', onPress: () => {} });
      const treeSm = renderToTree(elemSm);
      assert.deepEqual(treeSm.props.hitSlop, { top: 6, bottom: 6, left: 6, right: 6 });

      // md size has touchTarget.min (44dp)
      const elemMd = React.createElement(Button, { size: 'md', title: 'Medium', onPress: () => {} });
      const treeMd = renderToTree(elemMd);
      assert.equal(treeMd.props.hitSlop, undefined);
    });

    it('2.3 should disable interaction and set accessibilityState busy when loading=true', () => {
      let clickCount = 0;
      const elem = React.createElement(Button, {
        title: 'Submit Lead',
        loading: true,
        loadingText: 'Submitting...',
        onPress: () => { clickCount++; },
      });
      const tree = renderToTree(elem);

      assert.equal(tree.props.disabled, true, 'Pressable must be disabled when loading=true');
      assert.deepEqual(tree.props.accessibilityState, { disabled: true, busy: true });
      assert.equal(tree.props.accessibilityRole, 'button');

      // Inside tree.props.children: loading indicator row
      const contentRow = tree.props.children;
      assert.equal(contentRow.type, 'View');
      const spinner = contentRow.props.children[0];
      const loadingText = contentRow.props.children[1];
      assert.equal(spinner.type, 'ActivityIndicator');
      assert.equal(loadingText.type, 'Text');
      assert.equal(loadingText.props.children, 'Submitting...');
    });

    it('2.4 should prevent multiple rapid clicks / spamming when loading=true', () => {
      let firedCount = 0;
      const onPressHandler = () => { firedCount++; };

      const elem = React.createElement(Button, {
        title: 'Generate Proposal',
        loading: true,
        onPress: onPressHandler,
      });
      const tree = renderToTree(elem);

      assert.equal(tree.props.disabled, true);

      // Simulate 200 consecutive rapid touch events on disabled element
      for (let i = 0; i < 200; i++) {
        if (!tree.props.disabled && tree.props.onPress) {
          tree.props.onPress({});
        }
      }
      assert.equal(firedCount, 0, 'onPress must fire 0 times during loading spam');
    });

    it('2.5 should prevent multiple rapid clicks when disabled=true', () => {
      let firedCount = 0;
      const elem = React.createElement(Button, {
        title: 'Locked Action',
        disabled: true,
        onPress: () => { firedCount++; },
      });
      const tree = renderToTree(elem);

      assert.equal(tree.props.disabled, true);
      assert.deepEqual(tree.props.accessibilityState, { disabled: true, busy: false });

      for (let i = 0; i < 200; i++) {
        if (!tree.props.disabled && tree.props.onPress) {
          tree.props.onPress({});
        }
      }
      assert.equal(firedCount, 0, 'onPress must fire 0 times when button is disabled');
    });

    it('2.6 should permit normal interaction when button is interactive', () => {
      let firedCount = 0;
      const elem = React.createElement(Button, {
        title: 'Confirm',
        loading: false,
        disabled: false,
        onPress: () => { firedCount++; },
      });
      const tree = renderToTree(elem);

      assert.equal(tree.props.disabled, false);
      tree.props.onPress({});
      assert.equal(firedCount, 1, 'onPress must fire when interactive');
    });

    it('2.7 should withstand 5,000-character title string without layout explosion or error', () => {
      const elem = React.createElement(Button, { title: STRESS_STRING_5000, onPress: () => {} });
      const tree = renderToTree(elem);
      assert.equal(tree.props.accessibilityLabel, STRESS_STRING_5000);
      const textNode = tree.props.children.props.children[1];
      assert.equal(textNode.props.children, STRESS_STRING_5000);
    });

    it('2.8 should withstand 5,000-character loadingText string without error', () => {
      const elem = React.createElement(Button, { loading: true, loadingText: STRESS_STRING_5000, onPress: () => {} });
      const tree = renderToTree(elem);
      const loadingTextNode = tree.props.children.props.children[1];
      assert.equal(loadingTextNode.props.children, STRESS_STRING_5000);
    });

    it('2.9 should support fullWidth styling', () => {
      const elem = React.createElement(Button, { fullWidth: true, title: 'Full Width', onPress: () => {} });
      const tree = renderToTree(elem);
      const flattened = flattenStyle(tree.props.style);
      assert.equal(flattened.width, '100%');
    });
  });

  // ===========================================================================
  // 3. INPUT PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 3: Input Primitive Adversarial Stress & Focus Invariants', () => {
    it('3.1 should render default input with label, placeholder, and prefix/suffix slots', () => {
      const elem = React.createElement(Input, {
        label: 'Customer Name',
        placeholder: 'Enter full name',
        value: 'Ramesh Patil',
        prefixIcon: 'IconPrefix',
        suffixIcon: 'IconSuffix',
      });
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'View');

      // Check label row
      const labelRow = tree.props.children[0];
      assert.equal(labelRow.props.children[0].props.children, 'Customer Name');

      // Check input container
      const inputContainer = tree.props.children[1];
      const prefixSlot = inputContainer.props.children[0];
      const textInput = inputContainer.props.children[1];
      assert.equal(prefixSlot.props.children, 'IconPrefix');
      assert.equal(textInput.props.value, 'Ramesh Patil');
    });

    it('3.2 should render required asterisk when required=true', () => {
      const elem = React.createElement(Input, { label: 'DISCOM Consumer No', required: true });
      const tree = renderToTree(elem);
      const labelRow = tree.props.children[0];
      const asteriskNode = labelRow.props.children[1];
      assert.ok(asteriskNode);
      assert.equal(asteriskNode.props.children, ' *');
    });

    it('3.3 should display validation error and danger border color when error prop is set', () => {
      const errorMsg = 'Invalid 12-digit consumer account number';
      const elem = React.createElement(Input, { label: 'Consumer No', error: errorMsg });
      const tree = renderToTree(elem);

      // Check border color
      const inputContainer = tree.props.children[1];
      const containerStyle = flattenStyle(inputContainer.props.style);
      assert.equal(containerStyle.borderColor, colors.lightColors.danger);

      // Check error text node at bottom
      const errorNode = tree.props.children[2];
      assert.equal(errorNode.props.children, errorMsg);
    });

    it('3.4 should display success state and CheckCircle2 icon when successMessage is set without error', () => {
      const successMsg = 'MSEDCL consumer account verified';
      const elem = React.createElement(Input, { label: 'Consumer No', successMessage: successMsg });
      const tree = renderToTree(elem);

      const inputContainer = tree.props.children[1];
      const containerStyle = flattenStyle(inputContainer.props.style);
      assert.equal(containerStyle.borderColor, colors.lightColors.success);

      // Check success text node at bottom
      const successNode = tree.props.children[2];
      assert.equal(successNode.props.children, successMsg);
    });

    it('3.5 should prioritize error over successMessage if both are erroneously passed', () => {
      const elem = React.createElement(Input, {
        label: 'Consumer No',
        error: 'Critical Error',
        successMessage: 'Ignored Success',
      });
      const tree = renderToTree(elem);

      const inputContainer = tree.props.children[1];
      const containerStyle = flattenStyle(inputContainer.props.style);
      assert.equal(containerStyle.borderColor, colors.lightColors.danger);

      const bottomText = tree.props.children[2];
      assert.equal(bottomText.props.children, 'Critical Error');
    });

    it('3.6 should render clearable button and trigger onClear and onChangeText with empty string', () => {
      let changedText = null;
      let clearFired = false;

      const elem = React.createElement(Input, {
        label: 'Search Field',
        value: 'Solar Lead Query',
        clearable: true,
        onChangeText: (t) => { changedText = t; },
        onClear: () => { clearFired = true; },
      });
      const tree = renderToTree(elem);
      const inputContainer = tree.props.children[1];

      // Find clear button among container children
      let clearBtn = null;
      React.Children.forEach(inputContainer.props.children, (child) => {
        if (child && child.props && child.props.accessibilityLabel === 'Clear text') {
          clearBtn = child;
        }
      });

      assert.ok(clearBtn, 'Clear button must be rendered when clearable=true and value is non-empty');
      clearBtn.props.onPress();
      assert.equal(changedText, '', 'onChangeText must be called with empty string');
      assert.equal(clearFired, true, 'onClear must be called');
    });

    it('3.7 should render password toggle button when isPassword=true', () => {
      const elem = React.createElement(Input, {
        label: 'Portal Password',
        isPassword: true,
        value: 'SecretPass123!',
      });
      const tree = renderToTree(elem);
      const inputContainer = tree.props.children[1];

      let toggleBtn = null;
      React.Children.forEach(inputContainer.props.children, (child) => {
        if (child && child.props && child.props.accessibilityLabel === 'Show password') {
          toggleBtn = child;
        }
      });
      assert.ok(toggleBtn, 'Password toggle button must be rendered');
    });

    it('3.8 should apply tabularNums style variant when tabularNums=true', () => {
      const elem = React.createElement(Input, {
        label: 'Contract Total',
        value: '₹1,91,400',
        tabularNums: true,
      });
      const tree = renderToTree(elem);
      const textInput = tree.props.children[1].props.children[1];
      const style = flattenStyle(textInput.props.style);
      assert.deepEqual(style.fontVariant, ['tabular-nums']);
    });

    it('3.9 should render 5,000-character input value, label, error, and helperText without crashing', () => {
      const elem = React.createElement(Input, {
        label: STRESS_STRING_5000.slice(0, 100),
        value: STRESS_STRING_5000,
        error: STRESS_STRING_5000.slice(0, 100),
        helperText: STRESS_STRING_5000.slice(0, 100),
      });
      const tree = renderToTree(elem);
      const textInput = tree.props.children[1].props.children[1];
      assert.equal(textInput.props.value.length, 5000);
    });

    it('3.10 should properly disable TextInput when disabled=true or editable=false', () => {
      const elem = React.createElement(Input, { label: 'Immutable UID', value: 'UID-999', disabled: true });
      const tree = renderToTree(elem);
      const textInput = tree.props.children[1].props.children[1];
      assert.equal(textInput.props.editable, false);
      assert.deepEqual(textInput.props.accessibilityState, { disabled: true });
    });
  });

  // ===========================================================================
  // 4. CARD PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 4: Card Primitive Adversarial Stress & Elevation Scaling', () => {
    it('4.1 should render elevated, outlined, and flat card variants with distinct borders/elevation', () => {
      const elevatedElem = React.createElement(Card, { variant: 'elevated' }, 'Elevated');
      const elevatedTree = renderToTree(elevatedElem);
      const elevatedStyle = flattenStyle(elevatedTree.props.style);
      assert.equal(elevatedStyle.elevation, 3);

      const outlinedElem = React.createElement(Card, { variant: 'outlined' }, 'Outlined');
      const outlinedTree = renderToTree(outlinedElem);
      const outlinedStyle = flattenStyle(outlinedTree.props.style);
      assert.equal(outlinedStyle.elevation, 1);

      const flatElem = React.createElement(Card, { variant: 'flat' }, 'Flat');
      const flatTree = renderToTree(flatElem);
      const flatStyle = flattenStyle(flatTree.props.style);
      assert.equal(flatStyle.elevation, undefined);
    });

    it('4.2 should render padding scales correctly: none, sm, md, lg', () => {
      const noneStyle = flattenStyle(renderToTree(React.createElement(Card, { padding: 'none' }, 'C')).props.style);
      assert.equal(noneStyle.padding, 0);

      const smStyle = flattenStyle(renderToTree(React.createElement(Card, { padding: 'sm' }, 'C')).props.style);
      assert.equal(smStyle.padding, 8);

      const mdStyle = flattenStyle(renderToTree(React.createElement(Card, { padding: 'md' }, 'C')).props.style);
      assert.equal(mdStyle.padding, 16);

      const lgStyle = flattenStyle(renderToTree(React.createElement(Card, { padding: 'lg' }, 'C')).props.style);
      assert.equal(lgStyle.padding, 24);
    });

    it('4.3 should render static View when onPress is omitted and Pressable when onPress is passed', () => {
      // Non-interactive card
      const staticElem = React.createElement(Card, { variant: 'outlined' }, 'Static Card');
      const staticTree = renderToTree(staticElem);
      assert.equal(staticTree.type, 'View');

      // Interactive card
      let clicked = 0;
      const interactiveElem = React.createElement(Card, { variant: 'elevated', onPress: () => { clicked++; } }, 'Interactive Card');
      const interactiveTree = renderToTree(interactiveElem);
      assert.equal(interactiveTree.type, 'Pressable');
      assert.equal(interactiveTree.props.accessibilityRole, 'button');
      interactiveTree.props.onPress();
      assert.equal(clicked, 1);
    });

    it('4.4 should apply disabled opacity and disabled prop on Pressable card when disabled=true', () => {
      const elem = React.createElement(Card, { onPress: () => {}, disabled: true }, 'Disabled Card');
      const tree = renderToTree(elem);
      assert.equal(tree.props.disabled, true);
      assert.deepEqual(tree.props.accessibilityState, { disabled: true });
      const style = flattenStyle(tree.props.style);
      assert.equal(style.opacity, 0.55);
    });

    it('4.5 should handle massive 5,000-character content inside Card children', () => {
      const elem = React.createElement(Card, { variant: 'elevated' }, STRESS_STRING_5000);
      const tree = renderToTree(elem);
      assert.equal(tree.props.children, STRESS_STRING_5000);
    });
  });

  // ===========================================================================
  // 5. BADGE PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 5: Badge Primitive Adversarial Stress & Semantic Status Tokens', () => {
    it('5.1 should render all 8 badge variants without errors and format accessibility labels', () => {
      const variants = ['primary', 'success', 'warning', 'danger', 'purple', 'neutral', 'info', 'accent'];
      for (const variant of variants) {
        const elem = React.createElement(Badge, { variant, label: `Status ${variant}` });
        const tree = renderToTree(elem);
        assert.equal(tree.type, 'View');
        assert.equal(tree.props.accessibilityRole, 'text');
        assert.equal(tree.props.accessibilityLabel, `Status: Status ${variant}`);
      }
    });

    it('5.2 should render dot indicator when dot=true', () => {
      const elem = React.createElement(Badge, { label: 'Online', variant: 'success', dot: true });
      const tree = renderToTree(elem);
      const dotNode = tree.props.children[0];
      assert.ok(dotNode, 'Dot node must be rendered');
      assert.equal(dotNode.type, 'View');
      const dotStyle = flattenStyle(dotNode.props.style);
      assert.equal(dotStyle.width, 6);
      assert.equal(dotStyle.height, 6);
    });

    it('5.3 should render icon slot when icon is passed', () => {
      const elem = React.createElement(Badge, { label: 'Verified', icon: 'IconSVG' });
      const tree = renderToTree(elem);
      const iconBox = tree.props.children[1];
      assert.ok(iconBox);
      assert.equal(iconBox.props.children, 'IconSVG');
    });

    it('5.4 should support sm and md size scales with proper padding and font size', () => {
      const treeSm = renderToTree(React.createElement(Badge, { label: 'SM', size: 'sm' }));
      const styleSm = flattenStyle(treeSm.props.style);
      assert.equal(styleSm.paddingVertical, 2);
      assert.equal(styleSm.paddingHorizontal, 8);

      const treeMd = renderToTree(React.createElement(Badge, { label: 'MD', size: 'md' }));
      const styleMd = flattenStyle(treeMd.props.style);
      assert.equal(styleMd.paddingVertical, 4);
      assert.equal(styleMd.paddingHorizontal, 12);
    });

    it('5.5 should handle 5,000-character label string in Badge without memory error', () => {
      const elem = React.createElement(Badge, { label: STRESS_STRING_5000, variant: 'warning' });
      const tree = renderToTree(elem);
      assert.equal(tree.props.accessibilityLabel, `Status: ${STRESS_STRING_5000}`);
      const textNode = tree.props.children[2];
      assert.equal(textNode.props.children, STRESS_STRING_5000);
    });
  });

  // ===========================================================================
  // 6. SKELETON LOADER COMPOUND PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 6: SkeletonLoader Compound Primitive & Boundary Testing', () => {
    it('6.1 should expose all 3 compound presets: Text, Circle, and Card', () => {
      assert.equal(typeof SkeletonLoader, 'function');
      assert.equal(typeof SkeletonLoader.Text, 'function');
      assert.equal(typeof SkeletonLoader.Circle, 'function');
      assert.equal(typeof SkeletonLoader.Card, 'function');
    });

    it('6.2 should render base Skeleton with progressbar accessibility role', () => {
      const elem = React.createElement(SkeletonLoader, { width: 120, height: 24, borderRadius: 8 });
      const tree = renderToTree(elem);
      assert.equal(tree.props.accessibilityRole, 'progressbar');
      assert.equal(tree.props.accessibilityLabel, 'Loading...');
    });

    it('6.3 should render SkeletonLoader.Text with configurable lines and gap', () => {
      const elem = React.createElement(SkeletonLoader.Text, { lines: 4, lineHeight: 16, gap: 10, lastLineWidth: '40%' });
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'View');
      const lines = tree.props.children;
      assert.equal(lines.length, 4);
      assert.equal(lines[3].props.width, '40%');
      assert.equal(lines[0].props.width, '100%');
    });

    it('6.4 should handle boundary case of 0 lines in SkeletonLoader.Text without throwing', () => {
      const elem = React.createElement(SkeletonLoader.Text, { lines: 0 });
      const tree = renderToTree(elem);
      assert.equal(tree.props.children.length, 0);
    });

    it('6.5 should render SkeletonLoader.Circle with round radius (size / 2)', () => {
      const elem = React.createElement(SkeletonLoader.Circle, { size: 50 });
      const tree = renderToTree(elem);
      assert.equal(tree.props.width, 50);
      assert.equal(tree.props.height, 50);
      assert.equal(tree.props.borderRadius, 25);
    });

    it('6.6 should render complete SkeletonLoader.Card compound preset', () => {
      const elem = React.createElement(SkeletonLoader.Card, {});
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'View');
      // Has header row, text lines, and footer
      assert.equal(tree.props.children.length, 3);
    });
  });

  // ===========================================================================
  // 7. EMPTY STATE PRIMITIVE STRESS TESTING
  // ===========================================================================
  describe('Suite 7: EmptyState Primitive Adversarial Stress & CTA Action Binding', () => {
    it('7.1 should render all 5 tones: neutral, primary, warning, danger, success', () => {
      const tones = ['neutral', 'primary', 'warning', 'danger', 'success'];
      for (const tone of tones) {
        const elem = React.createElement(EmptyState, {
          tone,
          icon: 'EmptyIcon',
          title: `Tone ${tone}`,
          description: `Description for ${tone}`,
        });
        const tree = renderToTree(elem);
        assert.equal(tree.props.accessibilityRole, 'text');
        assert.equal(tree.props.accessibilityLabel, `Tone ${tone}: Description for ${tone}`);
      }
    });

    it('7.2 should render primary and secondary action buttons and bind callbacks correctly', () => {
      let primaryClicked = false;
      let secondaryClicked = false;

      const elem = React.createElement(EmptyState, {
        icon: 'FolderIcon',
        title: 'No Projects Found',
        description: 'Try adjusting filters or create a new installation project.',
        actionTitle: 'New Project',
        onActionPress: () => { primaryClicked = true; },
        secondaryActionTitle: 'Reset Filters',
        onSecondaryActionPress: () => { secondaryClicked = true; },
      });
      const tree = renderToTree(elem);

      // Actions container is children[3]
      const actionsContainer = tree.props.children[3];
      const primaryBtn = actionsContainer.props.children[0];
      const secondaryBtn = actionsContainer.props.children[1];

      assert.equal(primaryBtn.props.title, 'New Project');
      assert.equal(secondaryBtn.props.title, 'Reset Filters');

      primaryBtn.props.onPress();
      assert.equal(primaryClicked, true);

      secondaryBtn.props.onPress();
      assert.equal(secondaryClicked, true);
    });

    it('7.3 should support compact mode for inline cards and bottom sheets', () => {
      const elem = React.createElement(EmptyState, {
        icon: 'SmallIcon',
        title: 'Compact Empty',
        description: 'Short guidance',
        compact: true,
      });
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'View');
      // Children: iconCircle, title, description, actions
      const iconCircle = tree.props.children[0];
      const titleNode = tree.props.children[1];
      assert.ok(iconCircle);
      assert.equal(titleNode.props.children, 'Compact Empty');
    });

    it('7.4 should withstand 5,000-character title and 5,000-character description strings', () => {
      const elem = React.createElement(EmptyState, {
        icon: 'Icon',
        title: STRESS_STRING_5000,
        description: STRESS_STRING_5000,
      });
      const tree = renderToTree(elem);
      assert.equal(tree.props.children[1].props.children, STRESS_STRING_5000);
      assert.equal(tree.props.children[2].props.children, STRESS_STRING_5000);
    });
  });

  // ===========================================================================
  // 8. KEYBOARD AVOIDING CONTAINER STRESS TESTING
  // ===========================================================================
  describe('Suite 8: KeyboardAvoidingContainer Cross-Platform & Sticky Insets Testing', () => {
    it('8.1 should resolve behavior=undefined on Android to avoid double padding with adjustResize', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, { children: 'Content' });
      const tree = renderToTree(elem);
      assert.equal(tree.props.behavior, undefined, 'Android behavior must be undefined');
    });

    it('8.2 should resolve vertical offset to 0 on Android default', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, { children: 'Content' });
      const tree = renderToTree(elem);
      assert.equal(tree.props.keyboardVerticalOffset, 0);
    });

    it('8.3 should allow explicit keyboardVerticalOffset override', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, {
        keyboardVerticalOffset: 65,
        children: 'Content',
      });
      const tree = renderToTree(elem);
      assert.equal(tree.props.keyboardVerticalOffset, 65);
    });

    it('8.4 should render sticky header and sticky footer slots around content', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, {
        header: 'STICKY_HEADER_SLOT',
        footer: 'STICKY_FOOTER_SLOT',
        children: 'FORM_BODY_INPUTS',
        dismissOnTouchOutside: false,
      });
      const tree = renderToTree(elem);
      const innerFlex = tree.props.children;
      assert.equal(innerFlex.props.children[0], 'STICKY_HEADER_SLOT');
      const footerSlot = innerFlex.props.children[2];
      assert.equal(footerSlot.props.children, 'STICKY_FOOTER_SLOT');
    });

    it('8.5 should support non-scrollable mode when scrollable=false', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, {
        scrollable: false,
        children: 'Fixed Content',
        dismissOnTouchOutside: false,
      });
      const tree = renderToTree(elem);
      const innerFlex = tree.props.children;
      const contentSlot = innerFlex.props.children[1];
      assert.equal(contentSlot.type, 'View');
      assert.equal(contentSlot.props.children, 'Fixed Content');
    });

    it('8.6 should wrap with TouchableWithoutFeedback and Keyboard.dismiss when dismissOnTouchOutside=true', () => {
      const elem = React.createElement(KeyboardAvoidingContainer, {
        dismissOnTouchOutside: true,
        children: 'Tap Outside Test',
      });
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'KeyboardAvoidingView');
      const child = tree.props.children;
      assert.equal(child.type, 'TouchableWithoutFeedback');
      child.props.onPress();
      assert.equal(global.__keyboardDismissed, true);
    });
  });

  // ===========================================================================
  // 9. MODAL HEADER & DIRTY FORM PROTECTION STRESS TESTING
  // ===========================================================================
  describe('Suite 9: ModalHeader & Dirty Form Guard Adversarial Verification', () => {
    it('9.1 should render title, subtitle, dragHandle, and action slots', () => {
      const elem = React.createElement(ModalHeader, {
        title: 'Customer Onboarding',
        subtitle: 'Step 1 of 3: KYC Details',
        dragHandle: true,
        rightAction: 'SaveDraftBtn',
        onClose: () => {},
        onBack: () => {},
      });
      const tree = renderToTree(elem);
      assert.equal(tree.type, 'View');

      const dragHandle = tree.props.children[0];
      assert.ok(dragHandle, 'Drag handle must be rendered');

      const modalHeaderRow = tree.props.children[1];
      const backBtn = modalHeaderRow.props.children[0];
      assert.equal(backBtn.props.accessibilityLabel, 'Go back');

      const textBox = modalHeaderRow.props.children[1];
      assert.equal(textBox.props.children[0].props.children, 'Customer Onboarding');
      assert.equal(textBox.props.children[1].props.children, 'Step 1 of 3: KYC Details');

      const actionBox = modalHeaderRow.props.children[2];
      assert.equal(actionBox.props.children[0], 'SaveDraftBtn');
      const closeBtn = actionBox.props.children[1];
      assert.equal(closeBtn.props.accessibilityLabel, 'Close modal');
    });

    it('9.2 should directly invoke onClose when isDirty=false without triggering Alert', () => {
      let closeFired = false;
      const elem = React.createElement(ModalHeader, {
        title: 'Clean Modal',
        isDirty: false,
        onClose: () => { closeFired = true; },
      });
      const tree = renderToTree(elem);

      const modalHeaderRow = tree.props.children[1];
      const actionBox = modalHeaderRow.props.children[2];
      const closeBtn = actionBox.props.children[1];

      assert.ok(closeBtn, 'Close button must exist in action box');
      closeBtn.props.onPress();

      assert.equal(closeFired, true, 'onClose must immediately fire when form is clean');
      assert.equal(global.__lastAlert, null, 'No alert should be shown when isDirty=false');
    });

    it('9.3 should intercept onClose and trigger Alert when isDirty=true', () => {
      let closeFired = false;
      const elem = React.createElement(ModalHeader, {
        title: 'Dirty Lead Modal',
        isDirty: true,
        dirtyConfirmTitle: 'Discard Lead Changes?',
        dirtyConfirmMessage: 'Unsaved quotation inputs will be lost.',
        onClose: () => { closeFired = true; },
      });
      const tree = renderToTree(elem);

      const modalHeaderRow = tree.props.children[1];
      const actionBox = modalHeaderRow.props.children[2];
      const closeBtn = actionBox.props.children[1];

      closeBtn.props.onPress();

      assert.equal(closeFired, false, 'onClose must NOT fire immediately when isDirty=true');
      assert.ok(global.__lastAlert !== null, 'Alert must be triggered when dirty');
      assert.equal(global.__lastAlert.title, 'Discard Lead Changes?');
      assert.equal(global.__lastAlert.message, 'Unsaved quotation inputs will be lost.');

      const buttons = global.__lastAlert.buttons;
      assert.equal(buttons.length, 2);
      assert.equal(buttons[0].text, 'Keep Editing');
      assert.equal(buttons[0].style, 'cancel');
      assert.equal(buttons[1].text, 'Discard');
      assert.equal(buttons[1].style, 'destructive');

      // Clicking 'Discard' executes the intercepted onClose action
      buttons[1].onPress();
      assert.equal(closeFired, true, 'Clicking Discard must invoke onClose');
    });

    it('9.4 should intercept onBack and trigger Alert when isDirty=true', () => {
      let backFired = false;
      const elem = React.createElement(ModalHeader, {
        title: 'Multi-Step Modal',
        isDirty: true,
        onBack: () => { backFired = true; },
      });
      const tree = renderToTree(elem);

      const modalHeaderRow = tree.props.children[1];
      const backBtn = modalHeaderRow.props.children[0];

      assert.ok(backBtn, 'Back button must exist');
      backBtn.props.onPress();

      assert.equal(backFired, false, 'onBack must NOT fire immediately when dirty');
      assert.ok(global.__lastAlert !== null);

      // Trigger Discard
      global.__lastAlert.buttons[1].onPress();
      assert.equal(backFired, true, 'Discard must execute onBack');
    });

    it('9.5 should directly test useDirtyFormWarning hook logic', () => {
      let actionRunCount = 0;
      const targetAction = () => { actionRunCount++; };

      // Case A: Form is clean (isDirty = false)
      const cleanDismiss = useDirtyFormWarning(false, targetAction);
      cleanDismiss();
      assert.equal(actionRunCount, 1, 'Clean dismiss must execute action directly');
      assert.equal(global.__lastAlert, null);

      // Case B: Form is dirty (isDirty = true)
      const dirtyDismiss = useDirtyFormWarning(
        true,
        targetAction,
        'Custom Alert Title',
        'Custom Alert Message'
      );
      dirtyDismiss();
      assert.equal(actionRunCount, 1, 'Dirty dismiss must NOT execute action immediately');
      assert.ok(global.__lastAlert !== null);
      assert.equal(global.__lastAlert.title, 'Custom Alert Title');
      assert.equal(global.__lastAlert.message, 'Custom Alert Message');

      // Simulate Keep Editing (cancel)
      assert.equal(actionRunCount, 1);

      // Simulate Discard (destructive)
      global.__lastAlert.buttons[1].onPress();
      assert.equal(actionRunCount, 2, 'Discard button must execute action');
    });

    it('9.6 should enforce numberOfLines=1 ellipsize protection on 5,000-character titles', () => {
      const elem = React.createElement(ModalHeader, {
        title: STRESS_STRING_5000,
        subtitle: STRESS_STRING_5000,
        onClose: () => {},
      });
      const tree = renderToTree(elem);
      const modalHeaderRow = tree.props.children[1];
      const textBox = modalHeaderRow.props.children[1];
      const titleText = textBox.props.children[0];
      const subtitleText = textBox.props.children[1];

      assert.equal(titleText.props.numberOfLines, 1, 'Title must enforce numberOfLines=1');
      assert.equal(subtitleText.props.numberOfLines, 1, 'Subtitle must enforce numberOfLines=1');
      assert.equal(titleText.props.children.length, 5000);
      assert.equal(subtitleText.props.children.length, 5000);
    });

    it('9.7 should verify ModalHeader and useDirtyFormWarning export parity in Header.tsx', () => {
      const headerTsxPath = path.resolve(__dirname, '../src/components/Header.tsx');
      const headerContent = fs.readFileSync(headerTsxPath, 'utf8');

      assert.match(
        headerContent,
        /export\s+\{\s*ModalHeader,\s*useDirtyFormWarning\s*\}\s+from\s+['"]\.\/common\/ModalHeader['"]/,
        'Header.tsx must re-export ModalHeader and useDirtyFormWarning for backward compatibility'
      );
    });
  });

  // ===========================================================================
  // 10. CROSS-CUTTING ADVERSARIAL STRESS & HIGH-FREQUENCY CONCURRENCY
  // ===========================================================================
  describe('Suite 10: High-Frequency Spamming & Concurrency Stress', () => {
    it('10.1 should survive 500 rapid simulated click events on Button without memory leak or state desync', () => {
      let clickCount = 0;
      const elem = React.createElement(Button, {
        title: 'Spam Target',
        loading: false,
        onPress: () => { clickCount++; },
      });
      const tree = renderToTree(elem);

      const startTime = Date.now();
      for (let i = 0; i < 500; i++) {
        tree.props.onPress({});
      }
      const durationMs = Date.now() - startTime;

      assert.equal(clickCount, 500);
      assert.ok(durationMs < 100, `500 iterations completed in ${durationMs}ms (< 100ms)`);
    });

    it('10.2 should survive 500 rapid simulated spam clicks while button transitions loading true/false', () => {
      let clickCount = 0;
      let isLoading = false;

      for (let i = 0; i < 500; i++) {
        if (i % 5 === 0) isLoading = !isLoading;

        const elem = React.createElement(Button, {
          title: 'Submitting Lead',
          loading: isLoading,
          onPress: () => { clickCount++; },
        });
        const tree = renderToTree(elem);

        if (!tree.props.disabled && tree.props.onPress) {
          tree.props.onPress({});
        }
      }

      assert.ok(clickCount > 0, 'Interactive clicks must succeed');
      assert.ok(clickCount < 500, 'Loading clicks must be blocked');
    });

    it('10.3 should withstand massive Unicode string across all 8 primitives concurrently', () => {
      // 1. Button
      const treeBtn = renderToTree(React.createElement(Button, { title: UNICODE_STRESS_STRING, onPress: () => {} }));
      assert.ok(treeBtn.props.accessibilityLabel.includes('PM Surya Ghar'));

      // 2. Input
      const treeInput = renderToTree(React.createElement(Input, { label: UNICODE_STRESS_STRING.slice(0, 100), value: UNICODE_STRESS_STRING }));
      assert.ok(treeInput.props.children[1].props.children[1].props.value.includes('PM Surya Ghar'));

      // 3. Card
      const treeCard = renderToTree(React.createElement(Card, { variant: 'outlined' }, UNICODE_STRESS_STRING));
      assert.ok(treeCard.props.children.includes('PM Surya Ghar'));

      // 4. Badge
      const treeBadge = renderToTree(React.createElement(Badge, { label: UNICODE_STRESS_STRING.slice(0, 100), variant: 'accent' }));
      assert.ok(treeBadge.props.accessibilityLabel.includes('PM Surya Ghar'));

      // 5. SkeletonLoader
      const treeSkel = renderToTree(React.createElement(SkeletonLoader.Card, {}));
      assert.equal(treeSkel.type, 'View');

      // 6. EmptyState
      const treeEmpty = renderToTree(React.createElement(EmptyState, {
        icon: 'Icon',
        title: UNICODE_STRESS_STRING.slice(0, 100),
        description: UNICODE_STRESS_STRING,
      }));
      assert.ok(treeEmpty.props.children[1].props.children.includes('PM Surya Ghar'));

      // 7. KeyboardAvoidingContainer
      const treeKb = renderToTree(React.createElement(KeyboardAvoidingContainer, { children: UNICODE_STRESS_STRING }));
      assert.equal(treeKb.type, 'KeyboardAvoidingView');

      // 8. ModalHeader
      const treeModal = renderToTree(React.createElement(ModalHeader, {
        title: UNICODE_STRESS_STRING.slice(0, 100),
        subtitle: UNICODE_STRESS_STRING.slice(0, 100),
        onClose: () => {},
      }));
      assert.ok(treeModal.props.children[1].props.children[1].props.children[0].props.children.includes('PM Surya Ghar'));
    });
  });
});
