import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Zap,
  LogOut,
  RefreshCw,
  Layers,
  CheckCircle2,
  Landmark,
  IndianRupee,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  Check,
  Database,
  Sun,
  Moon,
  Smartphone,
  Sparkles,
  Download,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { offlineSyncService } from '../../services/offlineSyncService';
import { SafeStorage } from '../../api/client';
import { financeApi, crmApi } from '../../api/endpoints';
import { Header } from '../../components/Header';
import { useTheme } from '../../theme';
import { hasPermission } from '../../utils/rbac';
import { GuideCharacter } from '../../components/GuideCharacter';
import { InstallerSetupGuideModal } from '../../components/InstallerSetupGuideModal';
import { AppOnboardingModal } from '../../components/AppOnboardingModal';
import { InAppProductTour } from '../../components/InAppProductTour';
import { AppUpdateModal } from '../../components/AppUpdateModal';
import { CURRENT_APP_VERSION } from '../../services/versionService';

interface FinancialStats {
  totalRevenue: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  expectedSubsidies: number;
}

interface StorageAudit {
  draftLeadsCount: number;
  customModulesCount: number;
  customInvertersCount: number;
}

export const FieldProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { colors, isDark, mode, setMode } = useTheme();

  const [syncing, setSyncing] = useState(false);
  const [financeStats, setFinanceStats] = useState<FinancialStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [storageAudit, setStorageAudit] = useState<StorageAudit>({
    draftLeadsCount: 0,
    customModulesCount: 0,
    customInvertersCount: 0,
  });
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [spotlightTourVisible, setSpotlightTourVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  useEffect(() => {
    refreshStorageCounts();
    loadFinanceStats();
  }, []);

  const refreshStorageCounts = async () => {
    try {
      const drafts = await offlineSyncService.getDraftLeads();
      const customModulesStr = await SafeStorage.getItem('@solar_custom_modules');
      const customInvertersStr = await SafeStorage.getItem('@solar_custom_inverters');

      const customModules = customModulesStr ? JSON.parse(customModulesStr) : [];
      const customInverters = customInvertersStr ? JSON.parse(customInvertersStr) : [];

      setStorageAudit({
        draftLeadsCount: drafts.length,
        customModulesCount: Array.isArray(customModules) ? customModules.length : 0,
        customInvertersCount: Array.isArray(customInverters) ? customInverters.length : 0,
      });
    } catch (err) {
      console.warn('Storage audit notice:', err);
    }
  };

  const loadFinanceStats = async () => {
    if (!hasPermission(user, 'finance.view')) return;
    setLoadingStats(true);
    try {
      const res = await financeApi.getStats();
      if (res?.stats) {
        setFinanceStats({
          totalRevenue: res.stats.totalCollected || 0,
          outstanding: res.stats.outstanding || 0,
          overdueAmount: res.stats.overdueAmount || 0,
          overdueCount: res.stats.overdueCount || 0,
          expectedSubsidies: res.stats.expectedSubsidies || 0,
        });
      }
    } catch (err) {
      console.warn('Could not load profile finance stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const draftLeads = await offlineSyncService.getDraftLeads();
      if (draftLeads.length === 0) {
        Alert.alert('All Synced', 'No pending field drafts found on this device.');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const draft of draftLeads) {
        try {
          await crmApi.createLead({
            name: draft.name,
            mobile: draft.mobile,
            email: draft.email,
            address: draft.address,
            city: draft.city,
            estimatedCap: draft.recommendedKw,
            monthlyBill: draft.monthlyBill,
            source: 'Field Offline Survey',
          });
          await offlineSyncService.removeDraftLead(draft.localId);
          successCount++;
        } catch (err) {
          console.warn('Sync failed for draft:', draft.localId, err);
          failCount++;
        }
      }

      await refreshStorageCounts();

      if (failCount === 0) {
        Alert.alert('Sync Complete', `Successfully uploaded ${successCount} field lead(s) to cloud.`);
      } else {
        Alert.alert(
          'Partial Sync Notice',
          `Uploaded ${successCount} lead(s). ${failCount} lead(s) could not be synced and remain saved locally.`
        );
      }
    } catch (err: any) {
      Alert.alert('Sync Error', err.message || 'Could not complete synchronization.');
    } finally {
      setSyncing(false);
    }
  };

  const formatLakhs = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getEffectivePermissions = (userProfile: any): { label: string; key: string }[] => {
    if (!userProfile) return [];
    const role = (userProfile.role || '').toUpperCase();
    if (['SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER'].includes(role)) {
      return [
        { key: 'all', label: 'Unrestricted Enterprise Admin (*)' },
        { key: 'crm', label: 'CRM & Lead Intake' },
        { key: 'quotes', label: 'Proposals & CFA Pricing' },
        { key: 'surveys', label: 'Site Feasibility Surveys' },
        { key: 'projects', label: 'Milestones & Net-Metering' },
        { key: 'finance', label: 'Invoicing & Collections' },
        { key: 'hardware', label: '2D Barcodes & ALMM Scans' },
        { key: 'inventory', label: 'Procurement & Warehouse' },
      ];
    }

    const perms: { label: string; key: string }[] = [];
    if (hasPermission(userProfile, 'leads.view')) perms.push({ key: 'leads', label: 'CRM Leads & Pipeline' });
    if (hasPermission(userProfile, 'quotations.view')) perms.push({ key: 'quotes', label: 'Quotation Engine' });
    if (hasPermission(userProfile, 'surveys.view')) perms.push({ key: 'surveys', label: 'Rooftop Site Surveys' });
    if (hasPermission(userProfile, 'projects.view')) perms.push({ key: 'projects', label: 'Project Execution' });
    if (hasPermission(userProfile, 'finance.view')) perms.push({ key: 'finance', label: 'Milestone Billing' });
    if (hasPermission(userProfile, 'operations.scan') || hasPermission(userProfile, 'hardware.scan')) {
      perms.push({ key: 'scan', label: '2D Barcode Scanning' });
    }
    if (hasPermission(userProfile, 'inventory.view')) perms.push({ key: 'inventory', label: 'Procurement & Stock' });

    return perms;
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of WhereReady Solar OS?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const totalContractValue = (financeStats?.totalRevenue || 0) + (financeStats?.outstanding || 0);
  const userRole = (user?.role || '').toUpperCase();
  const roleNameMap: Record<string, string> = {
    SUPER_ADMIN: 'Platform Super Admin',
    TENANT_ADMIN: 'Enterprise Owner / Admin',
    SALES_AGENT: 'Solar Sales Specialist',
    TECHNICIAN: 'Field QA & Technical Engineer',
    TENANT_SUB_ADMIN: 'Operations Manager',
  };
  const roleLabel = roleNameMap[userRole] || 'Verified Solar Partner';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        title="Enterprise Account"
        subtitle="WhereReady Solar OS • Where Growth Gets Ready."
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* VENDOR IDENTITY HERO CARD */}
        <View style={styles.profileHeroCard}>
          <View style={styles.profileHeroTop}>
            <Image
              source={require('../../../assets/app-icon.png')}
              style={styles.avatarLogo}
              resizeMode="cover"
            />
            <View style={styles.profileMeta}>
              <Text style={styles.tenantName} numberOfLines={1}>
                {(user as any)?.tenant?.name || user?.tenantName || 'WhereReady Solar Partner'}
              </Text>
              <Text style={styles.userName}>{user?.name || 'Solar Vendor Owner'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>

              <View style={styles.roleBadge}>
                <ShieldCheck size={11} color="#10B981" />
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.planBar}>
            <Text style={styles.planText}>
              Platform:{' '}
              <Text style={styles.planBold}>
                {(user as any)?.tenant?.plan || 'ENTERPRISE'} TIER
              </Text>
            </Text>
            <Text style={styles.planExpiry}>
              Status: {(user as any)?.tenant?.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* APP THEME & APPEARANCE */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          App Theme & Appearance
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Text style={[styles.appearanceSub, { color: colors.textSecondary }]}>
            Display mode: {isDark ? 'Dark Theme (OLED Calibrated)' : 'Light Theme (Clean Crisp)'}
          </Text>
          <View style={styles.themeToggleRow}>
            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: mode === 'light' ? '#0066FF' : isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: mode === 'light' ? '#0066FF' : colors.borderSubtle,
                },
              ]}
              onPress={() => setMode('light')}
              activeOpacity={0.7}
            >
              <Sun size={15} color={mode === 'light' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: mode === 'light' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: mode === 'dark' ? '#0066FF' : isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: mode === 'dark' ? '#0066FF' : colors.borderSubtle,
                },
              ]}
              onPress={() => setMode('dark')}
              activeOpacity={0.7}
            >
              <Moon size={15} color={mode === 'dark' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: mode === 'dark' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeBtn,
                {
                  backgroundColor: mode === 'system' ? '#0066FF' : isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: mode === 'system' ? '#0066FF' : colors.borderSubtle,
                },
              ]}
              onPress={() => setMode('system')}
              activeOpacity={0.7}
            >
              <Smartphone size={15} color={mode === 'system' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.themeBtnText,
                  { color: mode === 'system' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVE SECURITY PERMISSIONS */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Active Security Permissions
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.permissionsGrid}>
            {getEffectivePermissions(user).map((p) => (
              <View
                key={p.key}
                style={[
                  styles.permissionPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Check size={11} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.permissionPillText, { color: colors.text }]}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CASH FLOW & TURNOVER RADAR */}
        {hasPermission(user, 'finance.view') && (
          <>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              Business Cashflow Radar
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {loadingStats ? (
                <ActivityIndicator size="small" color="#0066FF" style={{ marginVertical: 14 }} />
              ) : (
                <>
                  <View style={styles.radarRow}>
                    <Text style={[styles.radarLabel, { color: colors.textSecondary }]}>
                      Total Order Book Value
                    </Text>
                    <Text style={[styles.radarValueTotal, { color: colors.text }]}>
                      {formatLakhs(totalContractValue)}
                    </Text>
                  </View>

                  <View style={styles.radarGrid}>
                    <View
                      style={[
                        styles.radarGridItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.radarGridLabel, { color: colors.textMuted }]}>
                        COLLECTIONS
                      </Text>
                      <Text style={styles.radarGridValGreen}>
                        {formatLakhs(financeStats?.totalRevenue || 0)}
                      </Text>
                      <Text style={[styles.radarGridSub, { color: colors.textMuted }]}>Token / Milestones</Text>
                    </View>

                    <View
                      style={[
                        styles.radarGridItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.radarGridLabel, { color: colors.textMuted }]}>
                        OUTSTANDING
                      </Text>
                      <Text style={styles.radarGridValAmber}>
                        {formatLakhs(financeStats?.outstanding || 0)}
                      </Text>
                      <Text style={[styles.radarGridSub, { color: colors.textMuted }]}>Pending Invoices</Text>
                    </View>

                    <View
                      style={[
                        styles.radarGridItem,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.radarGridLabel, { color: colors.textMuted }]}>
                        DBT SUBSIDY
                      </Text>
                      <Text style={styles.radarGridValBlue}>
                        {formatLakhs(financeStats?.expectedSubsidies || 0)}
                      </Text>
                      <Text style={[styles.radarGridSub, { color: colors.textMuted }]}>PM Surya Ghar</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.openFinanceBtn, { borderTopColor: colors.borderSubtle }]}
                    onPress={() => navigation?.navigate('Finance')}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Receipt size={14} color="#10B981" />
                      <Text style={styles.openFinanceBtnText}>
                        View Full Invoices & Milestone Ledger
                      </Text>
                    </View>
                    <ChevronRight size={14} color="#10B981" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {/* STATUTORY PORTALS SHORTCUTS */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Statutory & Utility Portals
        </Text>

        <TouchableOpacity
          style={[
            styles.portalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => Linking.openURL('https://pmsuryaghar.gov.in')}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View
              style={[
                styles.portalIconWrap,
                { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' },
              ]}
            >
              <Landmark size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.portalTitle, { color: colors.text }]}>
                PM Surya Ghar National Portal
              </Text>
              <Text style={[styles.portalSub, { color: colors.textSecondary }]}>
                pmsuryaghar.gov.in (Vendor Login & DBT)
              </Text>
            </View>
          </View>
          <ExternalLink size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.portalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => Linking.openURL('https://www.mahadiscom.in/solar_rooftop')}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View
              style={[
                styles.portalIconWrap,
                { backgroundColor: isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF' },
              ]}
            >
              <Zap size={18} color="#0066FF" />
            </View>
            <View>
              <Text style={[styles.portalTitle, { color: colors.text }]}>
                MSEDCL Net-Metering Portal
              </Text>
              <Text style={[styles.portalSub, { color: colors.textSecondary }]}>
                mahadiscom.in (Net-meter synchronization)
              </Text>
            </View>
          </View>
          <ExternalLink size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.portalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => Linking.openURL('https://almm.gov.in')}
          activeOpacity={0.8}
        >
          <View style={styles.portalLeft}>
            <View
              style={[
                styles.portalIconWrap,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
              ]}
            >
              <ShieldCheck size={18} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.portalTitle, { color: colors.text }]}>
                MNRE ALMM Portal
              </Text>
              <Text style={[styles.portalSub, { color: colors.textSecondary }]}>
                almm.gov.in (Approved Models & Manufacturers)
              </Text>
            </View>
          </View>
          <ExternalLink size={14} color={colors.textMuted} />
        </TouchableOpacity>

        {/* DEVICE RESILIENCE CARD */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Device Resilience & Local Cache
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.syncCardRow}>
            <View
              style={[
                styles.portalIconWrap,
                { backgroundColor: isDark ? 'rgba(0, 102, 255, 0.15)' : '#EFF6FF' },
              ]}
            >
              <RefreshCw size={18} color="#0066FF" />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.syncTitle, { color: colors.text }]}>
                Local Draft Queue & Offline Cache
              </Text>
              <Text style={[styles.syncSubtitle, { color: colors.textSecondary }]}>
                {storageAudit.draftLeadsCount > 0
                  ? `${storageAudit.draftLeadsCount} field draft(s) waiting for cloud sync`
                  : 'All field records synchronized to cloud'}
              </Text>
              <Text style={[styles.syncDetail, { color: colors.textMuted }]}>
                Hardware cache: {storageAudit.customModulesCount} module(s),{' '}
                {storageAudit.customInvertersCount} inverter(s)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.syncActionBtn}
              onPress={handleSyncAll}
              disabled={syncing}
              activeOpacity={0.8}
            >
              <Text style={styles.syncActionText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BRAND AMBASSADOR & FIELD ONBOARDING */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          Brand Ambassador &amp; Field Training
        </Text>
        <TouchableOpacity
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => setGuideModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.guideCardLeft}>
            <GuideCharacter
              pose="wave"
              size={56}
              speechText="Hi!"
              animated={true}
            />
            <View style={styles.guideTextGroup}>
              <View style={styles.guideBadgeRow}>
                <Text style={styles.guideBadgeText}>SOLAR GUIDE</Text>
                <Sparkles size={12} color="#F59E0B" />
              </View>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                First-Time Installer Field Guide
              </Text>
              <Text style={[styles.guideDesc, { color: colors.textSecondary }]}>
                Explore site survey tips, QA milestones, and commissioning workflow
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => setSpotlightTourVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.guideCardLeft}>
            <GuideCharacter
              pose="point-right"
              size={56}
              speechText="Buttons!"
              animated={true}
            />
            <View style={styles.guideTextGroup}>
              <View style={styles.guideBadgeRow}>
                <Text style={styles.guideBadgeText}>BUTTON-BY-BUTTON TOUR</Text>
                <Sparkles size={12} color="#2563EB" />
              </View>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                Interactive Button Walkthrough
              </Text>
              <Text style={[styles.guideDesc, { color: colors.textSecondary }]}>
                Step through every button on your screen and see exactly what it does
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={() => setOnboardingModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.guideCardLeft}>
            <GuideCharacter
              pose="celebrate"
              size={56}
              speechText="Features!"
              animated={true}
            />
            <View style={styles.guideTextGroup}>
              <View style={styles.guideBadgeRow}>
                <Text style={styles.guideBadgeText}>PRODUCT TOUR & LIFECYCLE</Text>
                <Sparkles size={12} color="#10B981" />
              </View>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                Replay App Onboarding &amp; Features
              </Text>
              <Text style={[styles.guideDesc, { color: colors.textSecondary }]}>
                Review offline-first architecture, CRM proposal flow, and DISCOM commissioning
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* IN-APP CHECK FOR UPDATES */}
        <TouchableOpacity
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              marginTop: 10,
            },
          ]}
          onPress={() => setUpdateModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.guideCardLeft}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(0,102,255,0.15)' : '#EFF6FF',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Download size={20} color="#0066FF" strokeWidth={2.4} />
            </View>
            <View style={styles.guideTextGroup}>
              <View style={styles.guideBadgeRow}>
                <Text style={styles.guideBadgeText}>INSTALLED v{CURRENT_APP_VERSION}</Text>
                <Sparkles size={11} color="#0066FF" />
              </View>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                Check for App Updates
              </Text>
              <Text style={[styles.guideDesc, { color: colors.textSecondary }]}>
                Check cloud servers for latest solar engineering features & bugfixes
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* BRAND & BUILD FOOTER */}
        <View
          style={[
            styles.brandFooterCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandFooterLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandFooterVersion}>WhereReady Solar OS • Enterprise v{CURRENT_APP_VERSION}</Text>
          <Text style={[styles.brandFooterCopy, { color: colors.textSecondary }]}>
            Enterprise Solar EPC Operating System • Engineering, Field & Compliance
          </Text>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out from Solar Vendor Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* INSTALLER SETUP GUIDE MODAL */}
      <InstallerSetupGuideModal
        visible={guideModalVisible}
        onClose={() => setGuideModalVisible(false)}
        forceShow={true}
      />

      {/* APP ONBOARDING & PRODUCT TOUR MODAL */}
      <AppOnboardingModal
        visible={onboardingModalVisible}
        onClose={() => setOnboardingModalVisible(false)}
        forceShow={true}
      />

      {/* IN-APP SPOTLIGHT PRODUCT TOUR */}
      <InAppProductTour
        visible={spotlightTourVisible}
        onClose={() => setSpotlightTourVisible(false)}
      />

      {/* IN-APP AUTO-UPDATE CHECKER & DIALOG */}
      <AppUpdateModal
        forceVisible={updateModalVisible}
        onDismiss={() => setUpdateModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  profileHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  profileHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0066FF',
  },
  profileMeta: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  userName: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  planBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  planText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  planBold: {
    color: '#0066FF',
    fontWeight: '800',
  },
  planExpiry: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  appearanceSub: {
    fontSize: 11,
    marginBottom: 10,
    fontWeight: '500',
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  permissionPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  radarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  radarValueTotal: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  radarGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  radarGridItem: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  radarGridLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  radarGridValGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  radarGridValAmber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  radarGridValBlue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0066FF',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  radarGridSub: {
    fontSize: 8,
    marginTop: 2,
    fontWeight: '500',
  },
  openFinanceBtn: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  openFinanceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  portalCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  portalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  portalSub: {
    fontSize: 10,
    marginTop: 1,
  },
  syncCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  syncSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  syncDetail: {
    fontSize: 9,
    marginTop: 2,
  },
  syncActionBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  brandFooterCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  brandFooterLogo: {
    width: 180,
    height: 42,
    marginBottom: 8,
  },
  brandFooterVersion: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.3,
  },
  brandFooterCopy: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  guideCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  guideTextGroup: {
    flex: 1,
  },
  guideBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  guideBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  guideDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
