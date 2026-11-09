import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import {
  FileText,
  MapPin,
  Landmark,
  Banknote,
  Zap,
  Receipt,
  Truck,
  ShieldCheck,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Header } from '../../components/Header';
import { ModalHeader } from '../../components/common/ModalHeader';
import { GuideCharacter } from '../../components/GuideCharacter';
import { SeamlessSolarFlowModal } from '../../components/SeamlessSolarFlowModal';
import { soundEffects } from '../../utils/audioEffects';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme';
import { hasPermission } from '../../utils/rbac';
import {
  QuotationsModule,
  SurveysModule,
  SubsidiesModule,
  FinancingModule,
  DiscomModule,
  InvoicingModule,
  ProcurementModule,
  AmcModule,
  SuperAdminModule,
} from './submodules';

interface ModuleItem {
  id: string;
  name: string;
  desc: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  tag?: string;
  permission?: string | string[];
  superAdminOnly?: boolean;
}

interface ModuleCategory {
  title: string;
  modules: ModuleItem[];
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    title: 'SALES & PROPOSALS',
    modules: [
      {
        id: 'QUOTES',
        name: 'Quotations Engine',
        desc: '60-second solar proposals, CFA calculations & BOM sizing',
        icon: FileText,
        iconColor: '#0066FF',
        bgColor: '#EFF6FF',
        tag: '60s Generator',
        permission: ['quotations.view', 'quotations.create', 'quotations', 'quotes'],
      },
      {
        id: 'SURVEYS',
        name: 'Site Surveys',
        desc: 'Rooftop measurements, shadow profile & technical feasibility',
        icon: MapPin,
        iconColor: '#6366F1',
        bgColor: '#EEF2FF',
        permission: ['surveys.view', 'surveys.create', 'surveys', 'survey'],
      },
    ],
  },
  {
    title: 'COMPLIANCE & FINANCING',
    modules: [
      {
        id: 'SUBSIDY',
        name: 'PM Surya Ghar Studio',
        desc: '7-stage national portal tracking, consumer CA & DBT release',
        icon: Landmark,
        iconColor: '#F59E0B',
        bgColor: '#FFFBEB',
        tag: '₹78k DBT',
        permission: ['subsidy', 'subsidies', 'pmsuryaghar', 'projects.view', 'surveys.view', 'quotations.view', 'projects'],
      },
      {
        id: 'FINANCING',
        name: 'Solar Loan & EMI Planner',
        desc: '7% concessional bank EMI vs electricity bill savings planner',
        icon: Banknote,
        iconColor: '#8B5CF6',
        bgColor: '#F5F3FF',
        permission: ['finance.view', 'quotations.view', 'loans', 'financing', 'finance'],
      },
    ],
  },
  {
    title: 'DISCOM & INVOICING',
    modules: [
      {
        id: 'DISCOM',
        name: 'DISCOM Net-Metering',
        desc: 'MSEDCL, Tata Power & state discom meter synchronization',
        icon: Zap,
        iconColor: '#0D9488',
        bgColor: '#F0FDFA',
        permission: ['discom', 'documents', 'projects.view', 'operations.view', 'projects'],
      },
      {
        id: 'FINANCE',
        name: 'Finance & Invoicing',
        desc: 'Milestone billing (20/60/15/5), tax invoices & payment status',
        icon: Receipt,
        iconColor: '#10B981',
        bgColor: '#ECFDF5',
        tag: 'GST 13.8%',
        permission: ['finance.view', 'finance.create_invoice', 'finance', 'invoices'],
      },
    ],
  },
  {
    title: 'OPERATIONS & AMC',
    modules: [
      {
        id: 'PROCUREMENT',
        name: 'Procurement & Stock',
        desc: 'DCR modules, grid-tie inverters, ACDB/DCDB & material dispatch',
        icon: Truck,
        iconColor: '#EC4899',
        bgColor: '#FDF2F8',
        permission: ['inventory.view', 'operations.view', 'procurement', 'inventory'],
      },
      {
        id: 'AMC',
        name: 'AMC & Support',
        desc: 'Preventive maintenance agreements & post-commissioning service',
        icon: ShieldCheck,
        iconColor: '#EF4444',
        bgColor: '#FFF1F2',
        permission: ['operations.view', 'projects.view', 'amc', 'service'],
      },
    ],
  },
  {
    title: 'PLATFORM GOVERNANCE',
    modules: [
      {
        id: 'SUPER_ADMIN',
        name: 'Super Admin Platform',
        desc: 'Multi-tenant management & platform telemetry',
        icon: Layers,
        iconColor: '#9333EA',
        bgColor: '#FAF5FF',
        superAdminOnly: true,
      },
    ],
  },
];

const normalizeModuleId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  const upper = id.toUpperCase();
  if (upper === 'INVENTORY') return 'PROCUREMENT';
  if (upper === 'QUOTATIONS' || upper === 'QUOTE') return 'QUOTES';
  if (upper === 'LOANS' || upper === 'LOAN') return 'FINANCING';
  if (upper === 'DOCS' || upper === 'DISCOM_DOCS') return 'DISCOM';
  if (upper === 'SERVICE' || upper === 'TICKETS') return 'AMC';
  if (upper === 'PM_SURYA_GHAR' || upper === 'SUBSIDIES') return 'SUBSIDY';
  return upper;
};

export const ModulesScreen: React.FC<{ route?: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [activeSubModule, setActiveSubModule] = useState<string | null>(
    normalizeModuleId(route?.params?.openQuote ? 'QUOTES' : route?.params?.screen || null)
  );
  const [seamlessFlowVisible, setSeamlessFlowVisible] = useState(false);

  useEffect(() => {
    if (route?.params?.openQuote) {
      setActiveSubModule('QUOTES');
    } else if (route?.params?.screen) {
      setActiveSubModule(normalizeModuleId(route.params.screen));
    }
  }, [route?.params]);

  // Role-based Category & Module Filtering
  const authorizedCategories = useMemo(() => {
    return MODULE_CATEGORIES.map((cat) => {
      const filteredModules = cat.modules.filter((m) => {
        if (m.superAdminOnly) {
          return user?.role === 'SUPER_ADMIN';
        }
        if (m.permission) {
          return hasPermission(user, m.permission);
        }
        return true;
      });
      return {
        ...cat,
        modules: filteredModules,
      };
    }).filter((cat) => cat.modules.length > 0);
  }, [user]);

  const activeModuleItem = useMemo(() => {
    for (const cat of MODULE_CATEGORIES) {
      const found = cat.modules.find((m) => m.id === activeSubModule);
      if (found) return found;
    }
    return null;
  }, [activeSubModule]);

  const isModuleAuthorized = useMemo(() => {
    if (!activeModuleItem) return false;
    if (activeModuleItem.superAdminOnly) {
      return user?.role === 'SUPER_ADMIN';
    }
    if (activeModuleItem.permission) {
      return hasPermission(user, activeModuleItem.permission);
    }
    return true;
  }, [activeModuleItem, user]);

  const renderActiveModule = () => {
    if (!isModuleAuthorized) {
      return (
        <View style={styles.restrictedContainer}>
          <ShieldCheck size={52} color={colors.warning} />
          <Text style={[styles.restrictedTitle, { color: colors.text }]}>
            Access Restricted
          </Text>
          <Text style={[styles.restrictedText, { color: colors.textSecondary }]}>
            Your user account role does not have security permission to access {activeModuleItem?.name || 'this module'}.
          </Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => setActiveSubModule(null)}
          >
            <Text style={styles.returnBtnText}>Return to Modules Hub</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeSubModule) {
      case 'QUOTES':
        return (
          <QuotationsModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'SURVEYS':
        return (
          <SurveysModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'SUBSIDY':
        return (
          <SubsidiesModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'FINANCING':
        return (
          <FinancingModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'DISCOM':
        return (
          <DiscomModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'FINANCE':
        return (
          <InvoicingModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'PROCUREMENT':
        return (
          <ProcurementModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'AMC':
        return (
          <AmcModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      case 'SUPER_ADMIN':
        return (
          <SuperAdminModule
            onClose={() => setActiveSubModule(null)}
            initialParams={route?.params}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* GLOBAL HEADER */}
      <Header
        title="Modules Hub"
        subtitle="Domain toolkits, compliance studios & specialized workflows"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SOL MISSION CONTROL COMPANION */}
        <View
          style={[
            styles.solCompanionCard,
            {
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
              borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE',
            },
          ]}
        >
          <GuideCharacter pose="guide" size={38} animated={false} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.solTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                Sol Mission Control
              </Text>
              <View style={styles.solPill}>
                <Sparkles size={9} color="#0066FF" />
                <Text style={styles.solPillText}>8 ENGINES READY</Text>
              </View>
            </View>
            <Text style={styles.solSub}>
              Specialized engines for PM Surya Ghar DBT subsidies, DISCOM net-metering & 7% loans.
            </Text>
          </View>
        </View>

        {/* 1-FLOW SEAMLESS JOURNEY SHORTCUT */}
        <TouchableOpacity
          style={[
            styles.seamlessFlowBanner,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
            },
          ]}
          onPress={() => {
            soundEffects.playSelect();
            setSeamlessFlowVisible(true);
          }}
          activeOpacity={0.88}
        >
          <View style={styles.seamlessBannerLeft}>
            <GuideCharacter pose="celebrate" size={36} animated={false} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.seamlessBannerTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                  ⚡ 1-Flow Solar Journey
                </Text>
                <View style={styles.seamlessXpPill}>
                  <Sparkles size={9} color="#059669" />
                  <Text style={styles.seamlessXpText}>+300 XP</Text>
                </View>
              </View>
              <Text style={styles.seamlessBannerSub}>
                Card-glide quest: Lead ➔ 60s Quote ➔ Onboarding ➔ DISCOM ➔ Token!
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#10B981" />
        </TouchableOpacity>

        {authorizedCategories.map((cat) => (
          <View key={cat.title} style={styles.categorySection}>
            <View style={styles.categoryHeaderRow}>
              <View style={styles.categoryDot} />
              <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                {cat.title}
              </Text>
            </View>

            <View style={styles.moduleGrid}>
              {cat.modules.map((m) => {
                const IconComponent = m.icon;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.moduleCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      soundEffects.playSelect();
                      setActiveSubModule(m.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isDark
                            ? `${m.iconColor}22`
                            : m.bgColor,
                        },
                      ]}
                    >
                      <IconComponent size={22} color={m.iconColor} />
                    </View>

                    <View style={styles.moduleInfoCol}>
                      <View style={styles.moduleTitleRow}>
                        <Text style={[styles.moduleName, { color: colors.text }]}>
                          {m.name}
                        </Text>
                        {m.tag && (
                          <View
                            style={[
                              styles.moduleTag,
                              {
                                backgroundColor: isDark
                                  ? `${m.iconColor}22`
                                  : m.bgColor,
                              },
                            ]}
                          >
                            <Text style={[styles.moduleTagText, { color: m.iconColor }]}>
                              {m.tag}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[styles.moduleDesc, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {m.desc}
                      </Text>
                    </View>

                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* SUBMODULE MODAL CONTAINER */}
      <Modal
        visible={!!activeSubModule}
        animationType="slide"
        onRequestClose={() => setActiveSubModule(null)}
      >
        <View style={[styles.subModalContainer, { backgroundColor: colors.background }]}>
          <ModalHeader
            title={activeModuleItem?.name || 'Solar Module'}
            subtitle={activeModuleItem?.desc || 'Enterprise workflow'}
            onClose={() => setActiveSubModule(null)}
          />
          <View style={{ flex: 1 }}>{renderActiveModule()}</View>
        </View>
      </Modal>

      {/* SEAMLESS 1-FLOW SOLAR JOURNEY MODAL */}
      <SeamlessSolarFlowModal
        visible={seamlessFlowVisible}
        onClose={() => setSeamlessFlowVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    gap: 12,
  },
  solCompanionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
  },
  solTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  solPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  solPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  solSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  seamlessFlowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  seamlessBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  seamlessBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  seamlessXpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  seamlessXpText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  seamlessBannerSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  moduleGrid: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  moduleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  moduleTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  moduleDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  subModalContainer: {
    flex: 1,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  restrictedText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  returnBtn: {
    marginTop: 20,
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
