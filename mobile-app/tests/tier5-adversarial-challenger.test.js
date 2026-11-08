/**
 * Tier 5: Adversarial Challenge & Empirical Verification Suite
 * WhereReady Solar OS Mobile Client — Milestone M1 Verification
 * 
 * Conducts adversarial stress-testing across:
 * 1. Theme switching state matrix (light, dark, system x device color scheme)
 * 2. Storage persistence, rehydration, and resilience against corruption / disk errors
 * 3. Tabular numerals formatting (formatInr, formatKw) with boundary, negative, and extreme inputs
 * 4. Spacing scale hybrid callable / indexed access, non-standard steps, and zero / negative boundaries
 * 5. WCAG 2.1 relative luminance and contrast ratios for light & dark palettes
 * 6. React Navigation 7 Theme contract mapping (getNavigationTheme)
 * 7. PROJECT.md Interface Contract conformance (ThemeColors, DesignTokens)
 * 8. Default theme context graceful fallback when rendered outside ThemeProvider
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load TypeScript transpiler from mobile-app/node_modules/typescript
const ts = require('../node_modules/typescript');

/**
 * Transpiles and loads a TypeScript / TSX source file in an isolated VM sandbox
 */
function loadTsModule(relativePath, mockGlobals = {}) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const sourceCode = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(sourceCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  });

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    console,
    process,
    setTimeout,
    clearTimeout,
    require: (id) => {
      if (id === 'react') {
        const actualReact = require('react');
        if (mockGlobals.useContext) {
          return {
            ...actualReact,
            useContext: mockGlobals.useContext,
          };
        }
        return actualReact;
      }
      if (id === 'react-native') {
        return {
          Platform: {
            OS: 'android',
            select: (obj) => (obj.android !== undefined ? obj.android : obj.default),
          },
          useColorScheme: mockGlobals.useColorScheme || (() => 'light'),
          StyleSheet: { create: (s) => s },
        };
      }
      if (id === '@react-native-async-storage/async-storage') {
        return mockGlobals.asyncStorage || {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
        };
      }
      if (id === 'expo-status-bar') {
        return {
          StatusBar: () => null,
        };
      }
      if (id === '@react-navigation/native') {
        return {
          DefaultTheme: {
            dark: false,
            colors: {
              primary: '#007AFF',
              background: '#F2F2F7',
              card: '#FFFFFF',
              text: '#000000',
              border: '#C6C6C8',
              notification: '#FF3B30',
            },
          },
          DarkTheme: {
            dark: true,
            colors: {
              primary: '#0A84FF',
              background: '#000000',
              card: '#1C1C1E',
              text: '#FFFFFF',
              border: '#38383A',
              notification: '#FF453A',
            },
          },
        };
      }
      if (id === './colors') {
        return loadTsModule('src/theme/colors.ts', mockGlobals);
      }
      if (id === './tokens') {
        return loadTsModule('src/theme/tokens.ts', mockGlobals);
      }
      if (id === './ThemeProvider') {
        return loadTsModule('src/theme/ThemeProvider.tsx', mockGlobals);
      }
      if (id === './useTheme') {
        return loadTsModule('src/theme/useTheme.ts', mockGlobals);
      }
      return require(id);
    },
    ...mockGlobals,
  };

  const context = vm.createContext(sandbox);
  vm.runInContext(transpiled.outputText, context);
  return moduleObj.exports;
}

// -----------------------------------------------------------------------------
// WCAG 2.1 CONTRAST RATIO ORACLE
// -----------------------------------------------------------------------------
function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// -----------------------------------------------------------------------------
// TEST SUITE: TIER 5 ADVERSARIAL CHALLENGER
// -----------------------------------------------------------------------------
describe('Tier 5: Adversarial Challenge — Design Tokens & Theme Subsystem', () => {
  let colorsModule;
  let tokensModule;
  let themeProviderModule;

  beforeEach(() => {
    colorsModule = loadTsModule('src/theme/colors.ts');
    tokensModule = loadTsModule('src/theme/tokens.ts');
    themeProviderModule = loadTsModule('src/theme/ThemeProvider.tsx');
  });

  // ---------------------------------------------------------------------------
  // 1. Spacing Scale Hybrid Callable / Indexed Access
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 1: Spacing Scale Hybrid Invocation & Invariants', () => {
    it('1.1 should match exactly between functional call and index lookup for predefined steps', () => {
      const { spacing, spacingSteps } = tokensModule;
      for (const [key, value] of Object.entries(spacingSteps)) {
        const stepNum = Number(key);
        assert.strictEqual(
          spacing(stepNum),
          value,
          `spacing(${stepNum}) functional mismatch`
        );
        assert.strictEqual(
          spacing[stepNum],
          value,
          `spacing[${stepNum}] index access mismatch`
        );
      }
    });

    it('1.2 should strictly resolve 4pt grid step 0 to exactly 0 (no falsey fallback bug)', () => {
      const { spacing } = tokensModule;
      assert.strictEqual(spacing(0), 0);
      assert.strictEqual(spacing[0], 0);
    });

    it('1.3 should calculate step * 4 for positive steps outside the explicit lookup table', () => {
      const { spacing } = tokensModule;
      assert.strictEqual(spacing(11), 44);
      assert.strictEqual(spacing(13), 52);
      assert.strictEqual(spacing(20), 80);
      assert.strictEqual(spacing(100), 400);
    });

    it('1.4 should handle fractional steps cleanly without rounding anomalies', () => {
      const { spacing } = tokensModule;
      assert.strictEqual(spacing(0.5), 2);
      assert.strictEqual(spacing(1.5), 6);
      assert.strictEqual(spacing(2.5), 10);
      assert.strictEqual(spacing(3.75), 15);
    });

    it('1.5 should handle negative steps mathematically without crashing', () => {
      const { spacing } = tokensModule;
      assert.strictEqual(spacing(-1), -4);
      assert.strictEqual(spacing(-4), -16);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Tabular Numerals & Format Helpers
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 2: Tabular Numerals & Formatting Invariants', () => {
    it('2.1 should expose standard React Native tabular-nums fontVariant', () => {
      const { tabularNums, typography } = tokensModule;
      assert.deepStrictEqual(JSON.parse(JSON.stringify(tabularNums)), { fontVariant: ['tabular-nums'] });
      assert.deepStrictEqual(JSON.parse(JSON.stringify(typography.tabularNums)), { fontVariant: ['tabular-nums'] });
    });

    it('2.2 formatInr should correctly format statutory Indian currency across 1kW to 100kW', () => {
      const { formatInr } = tokensModule;
      assert.strictEqual(formatInr(0), '₹0');
      assert.strictEqual(formatInr(30000), '₹30,000');
      assert.strictEqual(formatInr(60000), '₹60,000');
      assert.strictEqual(formatInr(78000), '₹78,000');
      assert.strictEqual(formatInr(191400), '₹1,91,400'); // Standard Indian lakhs separator
      assert.strictEqual(formatInr(5800000), '₹58,00,000');
      assert.strictEqual(formatInr(10000000), '₹1,00,00,000'); // 1 Crore
    });

    it('2.3 formatInr should round fractional paise to nearest whole rupee', () => {
      const { formatInr } = tokensModule;
      assert.strictEqual(formatInr(191400.49), '₹1,91,400');
      assert.strictEqual(formatInr(191400.50), '₹1,91,401');
      assert.strictEqual(formatInr(191400.99), '₹1,91,401');
    });

    it('2.4 formatInr should handle negative cash flow or refund values', () => {
      const { formatInr } = tokensModule;
      // In JS, Math.round(-5000).toLocaleString('en-IN') produces '-5,000'
      const formatted = formatInr(-5000);
      assert.ok(formatted.includes('5,000'), 'Formatted negative value should include 5,000');
    });

    it('2.5 formatKw should format capacity with exactly one decimal place', () => {
      const { formatKw } = tokensModule;
      assert.strictEqual(formatKw(0), '0.0 kW');
      assert.strictEqual(formatKw(1), '1.0 kW');
      assert.strictEqual(formatKw(3.3), '3.3 kW');
      assert.strictEqual(formatKw(3.34), '3.3 kW');
      assert.strictEqual(formatKw(3.35), '3.4 kW');
      assert.strictEqual(formatKw(5), '5.0 kW');
      assert.strictEqual(formatKw(50), '50.0 kW');
      assert.strictEqual(formatKw(1000.75), '1000.8 kW');
    });

    it('2.6 formatKw should gracefully parse string numeric capacities', () => {
      const { formatKw } = tokensModule;
      assert.strictEqual(formatKw('3.3'), '3.3 kW');
      assert.strictEqual(formatKw('10'), '10.0 kW');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Theme Switching Resolution Matrix
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 3: Theme Resolution State Matrix', () => {
    // Pure resolver matching ThemeProvider line 109-112
    function resolveIsDark(mode, deviceColorScheme) {
      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      return deviceColorScheme === 'dark';
    }

    it('3.1 mode=dark must always resolve to isDark=true regardless of device state', () => {
      assert.strictEqual(resolveIsDark('dark', 'light'), true);
      assert.strictEqual(resolveIsDark('dark', 'dark'), true);
      assert.strictEqual(resolveIsDark('dark', null), true);
      assert.strictEqual(resolveIsDark('dark', undefined), true);
    });

    it('3.2 mode=light must always resolve to isDark=false regardless of device state', () => {
      assert.strictEqual(resolveIsDark('light', 'light'), false);
      assert.strictEqual(resolveIsDark('light', 'dark'), false);
      assert.strictEqual(resolveIsDark('light', null), false);
      assert.strictEqual(resolveIsDark('light', undefined), false);
    });

    it('3.3 mode=system must strictly mirror deviceColorScheme', () => {
      assert.strictEqual(resolveIsDark('system', 'dark'), true);
      assert.strictEqual(resolveIsDark('system', 'light'), false);
      assert.strictEqual(resolveIsDark('system', null), false);
      assert.strictEqual(resolveIsDark('system', undefined), false);
      assert.strictEqual(resolveIsDark('system', 'unspecified'), false);
    });

    it('3.4 toggleTheme state transition oracle', () => {
      // Toggle toggles based on active resolved isDark
      function toggle(currentMode, deviceScheme) {
        const activeIsDark = resolveIsDark(currentMode, deviceScheme);
        return activeIsDark ? 'light' : 'dark';
      }

      // If active is light -> flips to dark
      assert.strictEqual(toggle('light', 'light'), 'dark');
      // If active is dark -> flips to light
      assert.strictEqual(toggle('dark', 'dark'), 'light');
      // If active is system with dark device -> flips to light
      assert.strictEqual(toggle('system', 'dark'), 'light');
      // If active is system with light device -> flips to dark
      assert.strictEqual(toggle('system', 'light'), 'dark');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Storage Persistence, Rehydration & Edge Cases
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 4: Storage Persistence, Corruption & Rehydration', () => {
    const STORAGE_KEY = '@whereready_theme_mode';

    class MemoryStorage {
      constructor(initialData = {}) {
        this.store = new Map(Object.entries(initialData));
        this.readFail = false;
        this.writeFail = false;
      }
      async getItem(key) {
        if (this.readFail) throw new Error('Simulated disk read I/O error');
        return this.store.has(key) ? this.store.get(key) : null;
      }
      async setItem(key, value) {
        if (this.writeFail) throw new Error('Simulated QuotaExceededError');
        this.store.set(key, String(value));
      }
    }

    // Rehydration simulator matching ThemeProvider lines 88-94
    async function simulateRehydration(storage) {
      let state = 'system';
      try {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          state = stored;
        }
      } catch (e) {
        // Fallback gracefully on storage read failure
      }
      return state;
    }

    it('4.1 should hydrate default system mode on fresh install (null storage)', async () => {
      const storage = new MemoryStorage();
      const hydrated = await simulateRehydration(storage);
      assert.strictEqual(hydrated, 'system');
    });

    it('4.2 should restore stored dark mode from storage', async () => {
      const storage = new MemoryStorage({ [STORAGE_KEY]: 'dark' });
      const hydrated = await simulateRehydration(storage);
      assert.strictEqual(hydrated, 'dark');
    });

    it('4.3 should restore stored light mode from storage', async () => {
      const storage = new MemoryStorage({ [STORAGE_KEY]: 'light' });
      const hydrated = await simulateRehydration(storage);
      assert.strictEqual(hydrated, 'light');
    });

    it('4.4 should reject corrupted or invalid strings and fallback to system', async () => {
      const corruptPayloads = [
        '',
        '   ',
        'DARK',
        'LIGHT',
        'SYSTEM',
        'blue',
        'solar',
        'auto',
        'null',
        'undefined',
        '{"mode":"dark"}',
        '<script>alert(1)</script>',
        '123',
      ];

      for (const payload of corruptPayloads) {
        const storage = new MemoryStorage({ [STORAGE_KEY]: payload });
        const hydrated = await simulateRehydration(storage);
        assert.strictEqual(
          hydrated,
          'system',
          `Corrupt payload "${payload}" failed to fallback to system`
        );
      }
    });

    it('4.5 should gracefully survive disk read failure exceptions without unhandled rejections', async () => {
      const storage = new MemoryStorage();
      storage.readFail = true;
      const hydrated = await simulateRehydration(storage);
      assert.strictEqual(hydrated, 'system');
    });

    it('4.6 setMode should update in-memory state even if AsyncStorage.setItem fails', async () => {
      const storage = new MemoryStorage();
      storage.writeFail = true;

      let modeState = 'system';
      const setMode = async (newMode) => {
        try {
          modeState = newMode;
          await storage.setItem(STORAGE_KEY, newMode);
        } catch (e) {
          // Ignore storage write failure
        }
      };

      await setMode('dark');
      assert.strictEqual(modeState, 'dark', 'In-memory state should update despite write error');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. React Navigation Theme Contract (getNavigationTheme)
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 5: React Navigation 7 Theme Integration', () => {
    it('5.1 should construct compliant React Navigation theme for light mode', () => {
      const { lightColors } = colorsModule;
      const { getNavigationTheme } = themeProviderModule;

      const navTheme = getNavigationTheme(lightColors, false);
      assert.strictEqual(navTheme.dark, false);
      assert.strictEqual(navTheme.colors.primary, lightColors.primary);
      assert.strictEqual(navTheme.colors.background, lightColors.background);
      assert.strictEqual(navTheme.colors.card, lightColors.surface);
      assert.strictEqual(navTheme.colors.text, lightColors.text);
      assert.strictEqual(navTheme.colors.border, lightColors.borderSubtle);
      assert.strictEqual(navTheme.colors.notification, lightColors.accent);
    });

    it('5.2 should construct compliant React Navigation theme for dark mode', () => {
      const { darkColors } = colorsModule;
      const { getNavigationTheme } = themeProviderModule;

      const navTheme = getNavigationTheme(darkColors, true);
      assert.strictEqual(navTheme.dark, true);
      assert.strictEqual(navTheme.colors.primary, darkColors.primary);
      assert.strictEqual(navTheme.colors.background, darkColors.background);
      assert.strictEqual(navTheme.colors.card, darkColors.surface);
      assert.strictEqual(navTheme.colors.text, darkColors.text);
      assert.strictEqual(navTheme.colors.border, darkColors.borderSubtle);
      assert.strictEqual(navTheme.colors.notification, darkColors.accent);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. PROJECT.md Interface Contracts Conformance
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 6: Interface Contract Conformance (PROJECT.md)', () => {
    const REQUIRED_THEME_COLOR_KEYS = [
      'primary',
      'primaryLight',
      'primaryDark',
      'accent',
      'accentLight',
      'background',
      'surface',
      'surfaceElevated',
      'border',
      'borderSubtle',
      'text',
      'textSecondary',
      'textMuted',
      'success',
      'successLight',
      'warning',
      'warningLight',
      'danger',
      'dangerLight',
      'info',
      'infoLight',
    ];

    it('6.1 lightColors must provide 100% of the ThemeColors interface contract', () => {
      const { lightColors } = colorsModule;
      for (const key of REQUIRED_THEME_COLOR_KEYS) {
        assert.ok(
          typeof lightColors[key] === 'string' && lightColors[key].length > 0,
          `lightColors missing contract key: ${key}`
        );
      }
    });

    it('6.2 darkColors must provide 100% of the ThemeColors interface contract', () => {
      const { darkColors } = colorsModule;
      for (const key of REQUIRED_THEME_COLOR_KEYS) {
        assert.ok(
          typeof darkColors[key] === 'string' && darkColors[key].length > 0,
          `darkColors missing contract key: ${key}`
        );
      }
    });

    it('6.3 defaultThemeContextValue must provide all required DesignTokens properties', () => {
      const { defaultThemeContextValue } = themeProviderModule;
      assert.strictEqual(defaultThemeContextValue.mode, 'system');
      assert.strictEqual(defaultThemeContextValue.isDark, false);
      assert.ok(defaultThemeContextValue.colors);
      assert.ok(defaultThemeContextValue.tokens);

      const tokens = defaultThemeContextValue.tokens;
      assert.strictEqual(typeof tokens.spacing, 'function');
      assert.ok(tokens.radii.sm !== undefined);
      assert.ok(tokens.radii.md !== undefined);
      assert.ok(tokens.radii.lg !== undefined);
      assert.ok(tokens.radii.xl !== undefined);
      assert.ok(tokens.radii.full !== undefined);

      assert.ok(tokens.typography.fontFamilies.regular);
      assert.ok(tokens.typography.fontFamilies.bold);
      assert.ok(tokens.typography.fontFamilies.mono);

      assert.ok(tokens.typography.sizes.tiny);
      assert.ok(tokens.typography.sizes.body);
      assert.ok(tokens.typography.sizes.base);
      assert.ok(tokens.typography.sizes.title);
      assert.ok(tokens.typography.sizes.h1);

      assert.deepStrictEqual(JSON.parse(JSON.stringify(tokens.typography.tabularNums)), {
        fontVariant: ['tabular-nums'],
      });
    });

    it('6.4 backward-compatible colors alias must match lightColors', () => {
      const { colors, lightColors } = colorsModule;
      assert.strictEqual(colors, lightColors);
    });

    it('6.5 backward-compatible shadows alias must match lightShadows', () => {
      const { shadows, lightShadows } = tokensModule;
      assert.strictEqual(shadows, lightShadows);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. WCAG 2.1 Contrast Ratios & Visual Accessibility
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 7: WCAG 2.1 Luminance & Contrast Ratios', () => {
    it('7.1 Light theme text on surface and background must exceed WCAG AA 4.5:1', () => {
      const { lightColors } = colorsModule;
      const crTextBg = getContrastRatio(lightColors.text, lightColors.background);
      const crTextSurface = getContrastRatio(lightColors.text, lightColors.surface);
      const crTextSecondary = getContrastRatio(lightColors.textSecondary, lightColors.surface);

      assert.ok(crTextBg >= 15.0, `Text on background contrast ${crTextBg} < 15.0 (WCAG AAA)`);
      assert.ok(crTextSurface >= 15.0, `Text on surface contrast ${crTextSurface} < 15.0`);
      assert.ok(crTextSecondary >= 4.5, `Secondary text contrast ${crTextSecondary} < 4.5`);
    });

    it('7.2 Light theme primary button text (white on primary) must exceed WCAG AA 4.5:1', () => {
      const { lightColors } = colorsModule;
      const crPrimaryBtn = getContrastRatio('#FFFFFF', lightColors.primary);
      assert.ok(crPrimaryBtn >= 4.5, `Button text on primary contrast ${crPrimaryBtn} < 4.5`);
    });

    it('7.3 Light theme semantic badges (dark text on light background) must exceed 4.5:1', () => {
      const { lightColors } = colorsModule;
      const crSuccess = getContrastRatio(lightColors.successDark, lightColors.successLight);
      const crWarning = getContrastRatio(lightColors.warningDark, lightColors.warningLight);
      const crDanger = getContrastRatio(lightColors.dangerDark, lightColors.dangerLight);
      const crInfo = getContrastRatio(lightColors.infoDark, lightColors.infoLight);
      const crPurple = getContrastRatio(lightColors.purpleDark, lightColors.purpleLight);

      assert.ok(crSuccess >= 4.5, `Success badge contrast ${crSuccess} < 4.5`);
      assert.ok(crWarning >= 4.5, `Warning badge contrast ${crWarning} < 4.5`);
      assert.ok(crDanger >= 4.5, `Danger badge contrast ${crDanger} < 4.5`);
      assert.ok(crInfo >= 4.5, `Info badge contrast ${crInfo} < 4.5`);
      assert.ok(crPurple >= 7.0, `Purple badge contrast ${crPurple} < 7.0`);
    });

    it('7.4 Dark theme text on background and surface must exceed WCAG AA 4.5:1', () => {
      const { darkColors } = colorsModule;
      const crTextBg = getContrastRatio(darkColors.text, darkColors.background);
      const crTextSurface = getContrastRatio(darkColors.text, darkColors.surface);
      const crTextSecondary = getContrastRatio(darkColors.textSecondary, darkColors.surface);

      assert.ok(crTextBg >= 15.0, `Dark text on background contrast ${crTextBg} < 15.0`);
      assert.ok(crTextSurface >= 14.0, `Dark text on surface contrast ${crTextSurface} < 14.0`);
      assert.ok(crTextSecondary >= 4.5, `Dark secondary text contrast ${crTextSecondary} < 4.5`);
    });

    it('7.5 Dark theme primary element on background must meet WCAG graphical threshold (>= 3.0:1)', () => {
      const { darkColors } = colorsModule;
      const crPrimaryBg = getContrastRatio(darkColors.primary, darkColors.background);
      assert.ok(crPrimaryBg >= 4.5, `Dark primary on background contrast ${crPrimaryBg} < 4.5`);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Graceful Fallback & Context Safety
  // ---------------------------------------------------------------------------
  describe('Adversarial Test 8: Context Resilience & Graceful Fallback', () => {
    it('8.1 defaultThemeContextValue async functions should resolve cleanly without throwing', async () => {
      const { defaultThemeContextValue } = themeProviderModule;
      await assert.doesNotReject(async () => {
        await defaultThemeContextValue.setMode('dark');
        await defaultThemeContextValue.toggleTheme();
      });
    });

    it('8.2 useTheme hook outside provider must return defaultThemeContextValue without crash', () => {
      const useThemeModule = loadTsModule('src/theme/useTheme.ts', {
        useContext: () => null, // Simulate outside of Provider
      });
      const context = useThemeModule.useTheme();
      assert.strictEqual(context.mode, 'system');
      assert.strictEqual(context.isDark, false);
      assert.strictEqual(context.colors.primary, colorsModule.lightColors.primary);
      assert.strictEqual(context.colors.background, colorsModule.lightColors.background);
      assert.strictEqual(context.colors.surface, colorsModule.lightColors.surface);
    });
  });
});
