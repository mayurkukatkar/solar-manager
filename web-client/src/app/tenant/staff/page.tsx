"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  User,
  Check,
  Eye,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  Briefcase,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  Layers,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  SlidersHorizontal,
  Grid,
  List,
  ArrowUpDown,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  GitBranch,
  ShieldCheck,
  UserX,
  ShieldOff
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ManagerRef {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
}

interface UserRef {
  id: string;
  email: string;
  role: "TENANT_ADMIN" | "TENANT_SUB_ADMIN";
  mustChangePassword: boolean;
  permissions?: any;
}

interface ProjectAssignment {
  id: string;
  role: string;
  status: string;
  assignedAt: string;
  notes?: string;
  project: {
    id: string;
    name: string;
    projectNumber?: string;
    currentStage?: string;
    status?: string;
    capacity?: number;
    city?: string;
  };
}

interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  department: string;
  designation: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE" | "PROBATION" | "SUSPENDED";
  joiningDate?: string | null;
  workLocation?: string | null;
  skills: string[];
  team?: string | null;
  notes?: string | null;
  managerId?: string | null;
  manager?: ManagerRef | null;
  userId?: string | null;
  user?: UserRef | null;
  projectAssignments?: ProjectAssignment[];
  _count?: {
    directReports: number;
    projectAssignments: number;
  };
  directReports?: Array<{
    id: string;
    name: string;
    employeeId: string;
    designation: string;
    status: string;
    department: string;
  }>;
  createdAt: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "TENANT_ADMIN" | "TENANT_SUB_ADMIN";
  department: string;
  staffProfile?: {
    id: string;
    employeeId: string;
    department: string;
    designation: string;
    status: string;
  } | null;
  permissions?: any;
  mfaEnabled: boolean;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActive: string;
}

interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  designations: string[];
  _count?: {
    staff: number;
  };
}

interface Metrics {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  inactiveStaff: number;
  probationStaff: number;
  withAccount: number;
  withoutAccount: number;
  activeProjectAssignments: number;
  unassignedStaff: number;
  totalTeams: number;
  teams: string[];
  departmentDistribution: Array<{
    name: string;
    code?: string;
    color: string;
    count: number;
  }>;
  employmentTypes: Record<string, number>;
}

const COMMON_SOLAR_SKILLS = [
  "Rooftop Solar Mounting",
  "HT/LT Electrical License",
  "Site Feasibility Survey",
  "Inverter Commissioning",
  "Shadow Analysis (Helioscope)",
  "ACDB/DCDB Wiring",
  "Safety at Heights (Level 2)",
  "Three Phase Grid Interconnection",
  "DISCOM Net Metering Liaison",
  "Thermal Imaging & Hotspots",
  "Drone Photogrammetry",
  "AutoCAD Solar Layouts"
];

const AVAILABLE_MODULES = [
  { key: "leads", label: "Leads Management" },
  { key: "crm", label: "CRM Pipeline" },
  { key: "surveys", label: "Site Surveys" },
  { key: "quotations", label: "Quotations & Proposals" },
  { key: "projects", label: "Projects & DISCOM Docs" },
  { key: "tasks", label: "Tasks & Milestones" },
  { key: "installation", label: "Installation & Execution" },
  { key: "inventory", label: "Inventory & Dispatch" },
  { key: "procurement", label: "Procurement & Vendors" },
  { key: "finance", label: "Finance & Invoicing" },
  { key: "subsidy", label: "PM Surya Ghar Subsidy" },
  { key: "loans", label: "Solar Loans" },
  { key: "documents", label: "Documents & KYC" },
  { key: "service", label: "Service Tickets & AMC" },
  { key: "communication", label: "Customer Communication" },
  { key: "reports", label: "Reports & Analytics" },
  { key: "staff", label: "Staff & Workforce" }
];

export default function StaffPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "directory" | "permissions" | "departments" | "assignments" | "hierarchy">("directory");

  // Core data states
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filtering & Pagination for Staff Directory
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Users & RBAC Permissions state
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [editingUserPerms, setEditingUserPerms] = useState<UserAccount | null>(null);
  const [userPermsForm, setUserPermsForm] = useState<{ role: "TENANT_ADMIN" | "TENANT_SUB_ADMIN"; modules: string[] }>({
    role: "TENANT_SUB_ADMIN",
    modules: ["leads", "crm", "projects", "surveys", "quotations"]
  });

  const [inviteUserForm, setInviteUserForm] = useState({
    staffId: "",
    name: "",
    email: "",
    role: "TENANT_SUB_ADMIN" as "TENANT_ADMIN" | "TENANT_SUB_ADMIN",
    department: "Field Engineering",
    permissions: {
      modules: ["leads", "crm", "projects", "surveys", "quotations"]
    }
  });

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<StaffMember | null>(null);
  const [profileTab, setProfileTab] = useState<"details" | "activity">("details");
  const [staffActivity, setStaffActivity] = useState<any | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [profileAuditLogs, setProfileAuditLogs] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{ staff: StaffMember } | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    staff: StaffMember;
    reassignTo: string;
    force: boolean;
  } | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState<{
    staff: StaffMember;
    reason: string;
  } | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ user: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states for Add/Edit Staff
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    phone: "",
    emergencyContact: "",
    department: "Project Execution & Installation",
    designation: "Solar Technician",
    employmentType: "FULL_TIME" as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN",
    status: "ACTIVE" as "ACTIVE" | "ON_LEAVE" | "INACTIVE" | "PROBATION" | "SUSPENDED",
    joiningDate: new Date().toISOString().split("T")[0],
    workLocation: "Field Deployment Sites",
    skills: [] as string[],
    team: "Alpha Crew (Industrial)",
    managerId: "",
    notes: "",
    createSystemAccount: false,
    systemRole: "TENANT_SUB_ADMIN" as "TENANT_ADMIN" | "TENANT_SUB_ADMIN",
    permissions: ["projects", "surveys"] as string[]
  });

  // Assign project form state
  const [assignForm, setAssignForm] = useState({
    projectId: "",
    role: "SITE_ENGINEER",
    notes: ""
  });

  // Department creation form state
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    description: "",
    color: "blue",
    designationsInput: ""
  });

  // Auto clear feedback message
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // URL Tab Parameter Detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam === "permissions") {
        setActiveTab("permissions");
      } else if (tabParam === "overview") {
        setActiveTab("overview");
      } else if (tabParam === "departments") {
        setActiveTab("departments");
      } else if (tabParam === "assignments") {
        setActiveTab("assignments");
      } else if (tabParam === "hierarchy") {
        setActiveTab("hierarchy");
      }
    }
  }, []);

  // Fetch Overview Metrics
  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${API}/api/tenant/staff/overview`, { withCredentials: true });
      setMetrics(res.data.metrics || null);
    } catch (err) {
      console.error("Failed to fetch staff overview:", err);
    }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/tenant/departments`, { withCredentials: true });
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  // Fetch Projects for Assignment
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/tenant/projects`, { withCredentials: true });
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  // Fetch Users & RBAC
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await axios.get(`${API}/api/tenant/users`, { withCredentials: true });
      setUsersList(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch tenant users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Staff Directory (paginated & filtered)
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc"
      };

      if (search.trim()) params.search = search.trim();
      if (filterDept !== "ALL") params.department = filterDept;
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (filterType !== "ALL") params.employmentType = filterType;
      if (filterAccount === "WITH_ACCOUNT") params.hasAccount = "true";
      if (filterAccount === "FIELD_ONLY") params.hasAccount = "false";

      const res = await axios.get(`${API}/api/tenant/staff`, { params, withCredentials: true });
      setStaffList(res.data.staff || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch staff directory:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStaff();
    fetchOverview();
    fetchDepartments();
    fetchProjects();
    fetchUsers();
  }, [page, pageSize, filterDept, filterStatus, filterType, filterAccount]);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchStaff();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Open Detailed Profile
  const handleOpenProfile = async (staffId: string) => {
    try {
      setProfileLoading(true);
      setProfileTab("details");
      const res = await axios.get(`${API}/api/tenant/staff/${staffId}`, { withCredentials: true });
      setSelectedStaffProfile(res.data.member || null);
      setProfileAuditLogs(res.data.auditLogs || []);
      fetchStaffActivity(staffId);
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to load staff profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch full employee activity and audit timeline
  const fetchStaffActivity = async (staffId: string) => {
    try {
      setActivityLoading(true);
      const res = await axios.get(`${API}/api/tenant/staff/${staffId}/activity`, { withCredentials: true });
      setStaffActivity(res.data);
    } catch (err: any) {
      console.warn("Failed to load employee activity:", err.message);
    } finally {
      setActivityLoading(false);
    }
  };

  // Auto-generate safe Employee ID
  const handleAutoGenerateId = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({ ...prev, employeeId: `WR-EMP-${randomSuffix}` }));
  };

  // Toggle skills in form
  const handleToggleSkill = (skill: string) => {
    setFormData(prev => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill]
      };
    });
  };

  // Toggle module permissions in staff form
  const handleToggleModule = (modKey: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(modKey);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter(m => m !== modKey) : [...prev.permissions, modKey]
      };
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      name: "",
      employeeId: "",
      email: "",
      phone: "",
      emergencyContact: "",
      department: departments[0]?.name || "Project Execution & Installation",
      designation: departments[0]?.designations?.[0] || "Solar Technician",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      joiningDate: new Date().toISOString().split("T")[0],
      workLocation: "Field Deployment Sites",
      skills: ["Rooftop Solar Mounting", "HT/LT Electrical License"],
      team: "Alpha Crew (Industrial)",
      managerId: staffList.find(s => s.designation.includes("Director") || s.designation.includes("Manager"))?.id || "",
      notes: "",
      createSystemAccount: false,
      systemRole: "TENANT_SUB_ADMIN",
      permissions: ["projects", "surveys"]
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      employeeId: staff.employeeId,
      email: staff.email || "",
      phone: staff.phone || "",
      emergencyContact: staff.emergencyContact || "",
      department: staff.department,
      designation: staff.designation,
      employmentType: staff.employmentType,
      status: staff.status,
      joiningDate: staff.joiningDate ? staff.joiningDate.split("T")[0] : "",
      workLocation: staff.workLocation || "",
      skills: staff.skills || [],
      team: staff.team || "",
      managerId: staff.managerId || "",
      notes: staff.notes || "",
      createSystemAccount: false,
      systemRole: staff.user?.role || "TENANT_SUB_ADMIN",
      permissions: staff.user?.permissions?.modules || ["projects", "surveys"]
    });
    setShowAddModal(true);
  };

  // Submit Add or Edit Staff
  const handleSubmitStaffForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedbackMsg({ type: "error", text: "Staff member name is required" });
      return;
    }

    try {
      setActionLoading(true);

      if (editingStaff) {
        // Edit existing
        const res = await axios.patch(
          `${API}/api/tenant/staff/${editingStaff.id}`,
          {
            name: formData.name,
            employeeId: formData.employeeId,
            department: formData.department,
            designation: formData.designation,
            email: formData.email || null,
            phone: formData.phone || null,
            emergencyContact: formData.emergencyContact || null,
            employmentType: formData.employmentType,
            status: formData.status,
            joiningDate: formData.joiningDate || null,
            workLocation: formData.workLocation || null,
            skills: formData.skills,
            team: formData.team || null,
            managerId: formData.managerId || null,
            notes: formData.notes || null
          },
          { withCredentials: true }
        );

        setFeedbackMsg({ type: "success", text: "Staff record updated successfully" });
        setShowAddModal(false);
        fetchStaff();
        fetchOverview();
        fetchUsers();
        if (selectedStaffProfile?.id === editingStaff.id) {
          handleOpenProfile(editingStaff.id);
        }
      } else {
        // Create new
        const res = await axios.post(
          `${API}/api/tenant/staff`,
          {
            name: formData.name,
            employeeId: formData.employeeId || undefined,
            department: formData.department,
            designation: formData.designation,
            email: formData.email || null,
            phone: formData.phone || null,
            emergencyContact: formData.emergencyContact || null,
            employmentType: formData.employmentType,
            status: formData.status,
            joiningDate: formData.joiningDate || null,
            workLocation: formData.workLocation || null,
            skills: formData.skills,
            team: formData.team || null,
            managerId: formData.managerId || null,
            notes: formData.notes || null,
            createSystemAccount: formData.createSystemAccount,
            systemRole: formData.systemRole,
            permissions: formData.permissions
          },
          { withCredentials: true }
        );

        setShowAddModal(false);
        setFeedbackMsg({ type: "success", text: "Staff member created successfully" });

        if (res.data?.tempPassword) {
          setTempPasswordModal({
            user: formData.email,
            pass: res.data.tempPassword
          });
        }

        fetchStaff();
        fetchOverview();
        fetchUsers();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Operation failed" });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Staff Status (Active / On Leave / Inactive / Suspended)
  const handleQuickStatusChange = async (staffId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `${API}/api/tenant/staff/${staffId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      setFeedbackMsg({ type: "success", text: `Staff status updated to ${newStatus}` });
      fetchStaff();
      fetchOverview();
      if (selectedStaffProfile?.id === staffId) {
        handleOpenProfile(staffId);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to update status" });
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend employee access immediately
  const handleSuspendStaff = async (staff: StaffMember, reason?: string) => {
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API}/api/tenant/staff/${staff.id}/suspend`,
        { reason: reason || "Administrative suspension" },
        { withCredentials: true }
      );
      setFeedbackMsg({ type: "success", text: res.data?.message || `Employee ${staff.name} suspended.` });
      setShowSuspendModal(null);
      fetchStaff();
      fetchOverview();
      fetchUsers();
      if (selectedStaffProfile?.id === staff.id) {
        handleOpenProfile(staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to suspend employee" });
    } finally {
      setActionLoading(false);
    }
  };

  // Reactivate employee access
  const handleReactivateStaff = async (staff: StaffMember) => {
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API}/api/tenant/staff/${staff.id}/reactivate`,
        {},
        { withCredentials: true }
      );
      setFeedbackMsg({ type: "success", text: res.data?.message || `Employee ${staff.name} reactivated.` });
      fetchStaff();
      fetchOverview();
      fetchUsers();
      if (selectedStaffProfile?.id === staff.id) {
        handleOpenProfile(staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to reactivate employee" });
    } finally {
      setActionLoading(false);
    }
  };

  // Resend login credentials directly to employee's email
  const handleResendCredentials = async (staff: StaffMember) => {
    if (!staff.email) {
      setFeedbackMsg({ type: "error", text: "Please update this staff member with a work email before sending login credentials." });
      return;
    }
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API}/api/tenant/staff/${staff.id}/resend-credentials`,
        {},
        { withCredentials: true }
      );
      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: staff.email,
          pass: res.data.tempPassword
        });
      }
      setFeedbackMsg({ type: "success", text: res.data?.message || `Login credentials dispatched to ${staff.email}` });
      fetchStaff();
      fetchOverview();
      fetchUsers();
      if (selectedStaffProfile?.id === staff.id) {
        handleOpenProfile(staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to send credentials" });
    } finally {
      setActionLoading(false);
    }
  };

  // Create or Reset System Password (with email dispatch)
  const handleAccountCredentials = async (staff: StaffMember) => {
    if (!staff.email) {
      alert("Please update this staff member with a work email before provisioning a login account.");
      return;
    }

    const actionText = staff.userId ? "Reset password and email new temporary credentials" : "Provision system login and email credentials";
    if (!confirm(`${actionText} to ${staff.name} (${staff.email})?`)) return;

    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API}/api/tenant/staff/${staff.id}/account`,
        { role: "TENANT_SUB_ADMIN", permissions: ["projects", "surveys", "crm"] },
        { withCredentials: true }
      );

      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: staff.email,
          pass: res.data.tempPassword
        });
      }
      setFeedbackMsg({ type: "success", text: res.data?.message || "Account updated and credentials emailed." });
      fetchStaff();
      fetchOverview();
      fetchUsers();
      if (selectedStaffProfile?.id === staff.id) {
        handleOpenProfile(staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to manage account" });
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke Login Access
  const handleRevokeAccount = async (staff: StaffMember) => {
    if (!confirm(`Revoke login access for ${staff.name}? Their staff record and project assignments will remain preserved.`)) return;

    try {
      setActionLoading(true);
      await axios.delete(`${API}/api/tenant/staff/${staff.id}/account`, { withCredentials: true });
      setFeedbackMsg({ type: "success", text: "Login access revoked. Employment record preserved." });
      fetchStaff();
      fetchOverview();
      fetchUsers();
      if (selectedStaffProfile?.id === staff.id) {
        handleOpenProfile(staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to revoke access" });
    } finally {
      setActionLoading(false);
    }
  };

  // Open safe Delete & Reassignment Modal
  const handleDeleteStaff = (staff: StaffMember) => {
    setShowDeleteModal({
      staff,
      reassignTo: "",
      force: false
    });
  };

  // Execute Deletion with Reassignment or Force
  const handleExecuteDeleteStaff = async (staffId: string, reassignTo?: string, force?: boolean) => {
    try {
      setActionLoading(true);
      const res = await axios.delete(
        `${API}/api/tenant/staff/${staffId}`,
        {
          data: { reassignTo: reassignTo || undefined, force: !!force },
          withCredentials: true
        }
      );
      setFeedbackMsg({ type: "success", text: res.data?.message || "Staff member removed successfully." });
      setShowDeleteModal(null);
      if (selectedStaffProfile?.id === staffId) {
        setSelectedStaffProfile(null);
      }
      fetchStaff();
      fetchOverview();
      fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to remove staff" });
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Staff to Project
  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal?.staff || !assignForm.projectId) {
      alert("Please select a project");
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${API}/api/tenant/staff/${showAssignModal.staff.id}/assign-project`,
        assignForm,
        { withCredentials: true }
      );

      setFeedbackMsg({ type: "success", text: `Assigned ${showAssignModal.staff.name} to project successfully` });
      setShowAssignModal(null);
      setAssignForm({ projectId: "", role: "SITE_ENGINEER", notes: "" });
      fetchStaff();
      fetchOverview();
      if (selectedStaffProfile?.id === showAssignModal.staff.id) {
        handleOpenProfile(showAssignModal.staff.id);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to assign project" });
    } finally {
      setActionLoading(false);
    }
  };

  // Unassign Staff from Project
  const handleUnassignProject = async (staffId: string, projectId: string) => {
    if (!confirm("Remove this project assignment?")) return;

    try {
      setActionLoading(true);
      await axios.delete(`${API}/api/tenant/staff/${staffId}/assign-project/${projectId}`, { withCredentials: true });
      setFeedbackMsg({ type: "success", text: "Project assignment removed" });
      fetchStaff();
      fetchOverview();
      if (selectedStaffProfile?.id === staffId) {
        handleOpenProfile(staffId);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to unassign project" });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    try {
      setActionLoading(true);
      const designations = deptForm.designationsInput
        ? deptForm.designationsInput.split(",").map(d => d.trim()).filter(Boolean)
        : [];

      await axios.post(
        `${API}/api/tenant/departments`,
        {
          name: deptForm.name.trim(),
          code: deptForm.code.trim().toUpperCase() || undefined,
          description: deptForm.description.trim() || undefined,
          color: deptForm.color,
          designations
        },
        { withCredentials: true }
      );

      setFeedbackMsg({ type: "success", text: "Department saved successfully" });
      setShowDeptModal(false);
      setDeptForm({ name: "", code: "", description: "", color: "blue", designationsInput: "" });
      fetchDepartments();
      fetchOverview();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to save department" });
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // USERS & RBAC PERMISSIONS ACTIONS
  // ----------------------------------------------------------------------
  const handleOpenEditUserPerms = (user: UserAccount) => {
    setEditingUserPerms(user);
    const existingModules = Array.isArray(user.permissions?.modules)
      ? user.permissions.modules
      : (Array.isArray(user.permissions) ? user.permissions : ["leads", "crm", "projects", "surveys", "quotations"]);

    setUserPermsForm({
      role: user.role,
      modules: existingModules
    });
  };

  const handleToggleEditUserModule = (modKey: string) => {
    setUserPermsForm(prev => ({
      ...prev,
      modules: prev.modules.includes(modKey)
        ? prev.modules.filter(m => m !== modKey)
        : [...prev.modules, modKey]
    }));
  };

  const handleSaveUserPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserPerms) return;

    try {
      setActionLoading(true);
      await axios.patch(
        `${API}/api/tenant/users/${editingUserPerms.id}/role`,
        {
          role: userPermsForm.role,
          permissions: { modules: userPermsForm.modules }
        },
        { withCredentials: true }
      );

      setFeedbackMsg({ type: "success", text: `Permissions updated for ${editingUserPerms.name}` });
      setEditingUserPerms(null);
      fetchUsers();
      fetchStaff();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to update permissions" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetUserPasswordAction = async (userId: string, email: string) => {
    if (!confirm(`Reset credentials for ${email}? A new temporary password will be generated.`)) return;

    try {
      setActionLoading(true);
      const res = await axios.post(`${API}/api/tenant/users/${userId}/reset-password`, {}, { withCredentials: true });
      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: email,
          pass: res.data.tempPassword
        });
      }
      setFeedbackMsg({ type: "success", text: "Password reset successfully" });
      fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to reset password" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserAccountAction = async (userId: string, name: string) => {
    if (!confirm(`Revoke application login account for ${name}? Their employment profile and project assignments remain preserved.`)) return;

    try {
      setActionLoading(true);
      await axios.delete(`${API}/api/tenant/users/${userId}`, { withCredentials: true });
      setFeedbackMsg({ type: "success", text: `User account removed for ${name}. Staff profile preserved.` });
      fetchUsers();
      fetchStaff();
      fetchOverview();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to remove user account" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserForm.name.trim() || !inviteUserForm.email.trim()) {
      alert("Name and email are required");
      return;
    }

    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API}/api/tenant/users/invite`,
        inviteUserForm,
        { withCredentials: true }
      );

      setShowInviteUserModal(false);
      setFeedbackMsg({ type: "success", text: `User account invited successfully for ${inviteUserForm.email}` });

      if (res.data?.tempPassword) {
        setTempPasswordModal({
          user: inviteUserForm.email,
          pass: res.data.tempPassword
        });
      }

      setInviteUserForm({
        staffId: "",
        name: "",
        email: "",
        role: "TENANT_SUB_ADMIN",
        department: "Field Engineering",
        permissions: { modules: ["leads", "crm", "projects", "surveys", "quotations"] }
      });

      fetchUsers();
      fetchStaff();
      fetchOverview();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.response?.data?.error || "Failed to invite user" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectStaffForInvite = (staffId: string) => {
    if (!staffId) {
      setInviteUserForm(prev => ({ ...prev, staffId: "", name: "", email: "" }));
      return;
    }
    const s = staffList.find(item => item.id === staffId);
    if (s) {
      setInviteUserForm(prev => ({
        ...prev,
        staffId: s.id,
        name: s.name,
        email: s.email || "",
        department: s.department
      }));
    }
  };

  // Export Staff Directory to CSV
  const handleExportCSV = () => {
    if (staffList.length === 0) {
      alert("No staff records to export");
      return;
    }

    const headers = [
      "Employee ID",
      "Full Name",
      "Department",
      "Designation",
      "Status",
      "Employment Type",
      "Work Email",
      "Phone",
      "Reporting Manager",
      "Team",
      "System Access Role",
      "Active Project Assignments",
      "Joining Date"
    ];

    const rows = staffList.map(s => [
      `"${s.employeeId}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${s.designation}"`,
      `"${s.status}"`,
      `"${s.employmentType}"`,
      `"${s.email || "N/A"}"`,
      `"${s.phone || "N/A"}"`,
      `"${s.manager?.name || "None"}"`,
      `"${s.team || "N/A"}"`,
      `"${s.user ? s.user.role : "No System Access"}"`,
      `"${s.projectAssignments ? s.projectAssignments.length : 0}"`,
      `"${s.joiningDate ? s.joiningDate.split("T")[0] : "N/A"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solar_staff_directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy temporary credentials
  const copyPassword = () => {
    if (!tempPasswordModal?.pass) return;
    navigator.clipboard?.writeText(tempPasswordModal.pass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status color pill helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</span>;
      case "ON_LEAVE":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60"><Clock size={12} className="text-amber-500" /> On Leave</span>;
      case "PROBATION":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60"><Sparkles size={12} className="text-purple-500" /> Probation</span>;
      case "SUSPENDED":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80"><ShieldAlert size={12} className="text-rose-600" /> Suspended</span>;
      case "INACTIVE":
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"><UserX size={12} /> Inactive</span>;
    }
  };

  // Department color helper
  const getDeptColorClass = (deptName: string) => {
    if (deptName.includes("Eng") || deptName.includes("Survey")) return "text-emerald-700 bg-emerald-50 border-emerald-200/80";
    if (deptName.includes("Install") || deptName.includes("Execution")) return "text-blue-700 bg-blue-50 border-blue-200/80";
    if (deptName.includes("Sales") || deptName.includes("CRM")) return "text-amber-700 bg-amber-50 border-amber-200/80";
    if (deptName.includes("Warehouse") || deptName.includes("Logistics")) return "text-indigo-700 bg-indigo-50 border-indigo-200/80";
    if (deptName.includes("AMC") || deptName.includes("Support")) return "text-rose-700 bg-rose-50 border-rose-200/80";
    if (deptName.includes("DISCOM") || deptName.includes("Regul")) return "text-purple-700 bg-purple-50 border-purple-200/80";
    return "text-slate-700 bg-slate-100 border-slate-200";
  };

  // Filtered Users for RBAC tab
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (userRoleFilter !== "ALL" && u.role !== userRoleFilter) return false;
      if (userSearch) {
        return (
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
        );
      }
      return true;
    });
  }, [usersList, userRoleFilter, userSearch]);

  const adminUsersCount = usersList.filter(u => u.role === "TENANT_ADMIN").length;
  const subAdminUsersCount = usersList.filter(u => u.role === "TENANT_SUB_ADMIN").length;

  // Reset all active filters
  const resetFilters = () => {
    setSearch("");
    setFilterDept("ALL");
    setFilterStatus("ALL");
    setFilterType("ALL");
    setFilterAccount("ALL");
    setPage(1);
  };

  const hasActiveFilters = search || filterDept !== "ALL" || filterStatus !== "ALL" || filterType !== "ALL" || filterAccount !== "ALL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* TOAST / FEEDBACK NOTIFICATION */}
      {feedbackMsg && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          feedbackMsg.type === "success"
            ? "bg-emerald-50/95 text-emerald-800 border-emerald-300"
            : "bg-rose-50/95 text-rose-800 border-rose-300"
        }`}>
          {feedbackMsg.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <p className="text-sm font-semibold">{feedbackMsg.text}</p>
          <button onClick={() => setFeedbackMsg(null)} className="ml-2 text-slate-400 hover:text-slate-600"><X size={15} /></button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Workforce Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Unified workforce directory, field technician assignments, organizational hierarchy, and RBAC permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => { fetchStaff(); fetchOverview(); fetchUsers(); }}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading || usersLoading ? "animate-spin text-blue-600" : ""} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            title="Export CSV"
          >
            <Download size={15} className="text-slate-500" /> Export CSV
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "directory"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Users size={15} /> Staff Directory ({totalCount})
        </button>

        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "permissions"
              ? "bg-white text-purple-900 shadow-sm border border-purple-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Shield size={15} className="text-purple-600" /> Users & RBAC Permissions ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "overview"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers size={15} /> Workforce Overview
        </button>

        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "departments"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Building2 size={15} /> Departments & Teams ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "assignments"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Briefcase size={15} /> Project Assignments ({metrics?.activeProjectAssignments || 0})
        </button>

        <button
          onClick={() => setActiveTab("hierarchy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "hierarchy"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <GitBranch size={15} /> Reporting Structure
        </button>
      </div>

      {/* TAB: USERS & RBAC PERMISSIONS */}
      {activeTab === "permissions" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* PERMISSIONS KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{usersList.length}</p>
              <p className="text-xs text-slate-400 mt-1">Authorized system logins</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Admins</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{adminUsersCount}</p>
              <p className="text-xs text-slate-400 mt-1">Global enterprise privileges</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Admins</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{subAdminUsersCount}</p>
              <p className="text-xs text-slate-400 mt-1">Granular module-level control</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked to Staff</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{usersList.filter(u => u.staffProfile).length}</p>
              <p className="text-xs text-slate-400 mt-1">Workforce identity linked</p>
            </div>
          </div>

          {/* ACTION & SEARCH BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {["ALL", "TENANT_ADMIN", "TENANT_SUB_ADMIN"].map((rf) => (
                  <button
                    key={rf}
                    onClick={() => setUserRoleFilter(rf)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      userRoleFilter === rf
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {rf === "TENANT_ADMIN" ? "Admins" : rf === "TENANT_SUB_ADMIN" ? "Sub-Admins" : "All Accounts"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-900 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setShowInviteUserModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <UserPlus size={15} /> Invite User
                </button>
              </div>
            </div>

            {/* USERS LIST */}
            <div className="divide-y divide-slate-100">
              {usersLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
                  <p className="text-xs font-bold text-slate-500">Loading user accounts...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium">
                  No user accounts found matching your query.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.role === "TENANT_ADMIN"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}>
                          {user.role === "TENANT_ADMIN" ? "TENANT ADMIN" : "SUB-ADMIN"}
                        </span>
                        {user.staffProfile ? (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {user.staffProfile.employeeId} • {user.staffProfile.department}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                            {user.department}
                          </span>
                        )}
                        {user.status === "INVITED" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Password Setup
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-mono">{user.email}</p>

                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Module Access:</span>
                        {user.role === "TENANT_ADMIN" ? (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck size={13} /> Full Global Access to All Modules
                          </span>
                        ) : user.permissions?.modules?.length ? (
                          user.permissions.modules.map((m: string) => (
                            <span key={m} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No module permissions assigned</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {user.role !== "TENANT_ADMIN" && (
                        <button
                          onClick={() => handleOpenEditUserPerms(user)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                          title="Configure Module Access"
                        >
                          <Shield size={13} className="text-purple-600" /> Permissions
                        </button>
                      )}

                      <button
                        onClick={() => handleResetUserPasswordAction(user.id, user.email)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Generate New Temporary Password"
                      >
                        <Key size={13} className="text-amber-500" /> Reset Password
                      </button>

                      <button
                        onClick={() => handleDeleteUserAccountAction(user.id, user.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Revoke User Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: WORKFORCE OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => { setActiveTab("directory"); resetFilters(); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Workforce</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{metrics?.totalStaff || 0}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>{metrics?.activeStaff || 0} active</span>
                <span>{metrics?.onLeaveStaff || 0} on leave</span>
              </div>
            </div>

            <div 
              onClick={() => { setActiveTab("directory"); setFilterStatus("ACTIVE"); }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active On Duty</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600">{metrics?.activeStaff || 0}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Operational rate</span>
                <span className="font-bold text-emerald-700">
                  {metrics?.totalStaff ? Math.round(((metrics.activeStaff) / metrics.totalStaff) * 100) : 0}%
                </span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("permissions")}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-purple-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Authorized</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-purple-700">{metrics?.withAccount || 0}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>{metrics?.withoutAccount || 0} field staff without login</span>
                <span className="font-bold text-purple-600">RBAC</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("assignments")}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Deployments</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-600">{metrics?.activeProjectAssignments || 0}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>{metrics?.unassignedStaff || 0} staff available</span>
                <span className="font-bold text-slate-700">Active EPC</span>
              </div>
            </div>
          </div>

          {/* DEPARTMENT BREAKDOWN GRID */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Workforce Distribution by Department</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any department to filter the staff directory</p>
              </div>
              <button
                onClick={() => setShowDeptModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Department
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics?.departmentDistribution?.map(d => {
                const total = metrics.totalStaff || 1;
                const percentage = Math.round((d.count / total) * 100);
                return (
                  <div
                    key={d.name}
                    onClick={() => {
                      setFilterDept(d.name);
                      setActiveTab("directory");
                    }}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getDeptColorClass(d.name)}`}>
                        {d.code || "DEPT"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{d.count} staff</span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm">{d.name}</h4>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-slate-800 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{percentage}% of workforce</span>
                      <span className="text-blue-600 font-semibold flex items-center gap-1">View list <ChevronRight size={12} /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, Employee ID, designation, phone, or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Table View"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                    title="Grid Cards View"
                  >
                    <Grid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Filter size={12} /> Filters:
              </span>

              {/* Department Filter */}
              <select
                value={filterDept}
                onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 focus:border-slate-900 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 focus:border-slate-900 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="PROBATION">Probation</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {/* Employment Type */}
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 focus:border-slate-900 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="PART_TIME">Part-time</option>
                <option value="INTERN">Intern</option>
              </select>

              {/* Account Filter */}
              <select
                value={filterAccount}
                onChange={e => { setFilterAccount(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 focus:border-slate-900 cursor-pointer"
              >
                <option value="ALL">All Access Roles</option>
                <option value="WITH_ACCOUNT">With System Login</option>
                <option value="FIELD_ONLY">Field Personnel Only</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <X size={13} /> Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* STAFF CONTENT: TABLE OR GRID */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
                <p className="text-xs font-bold text-slate-500">Loading workforce directory...</p>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users size={24} />
                </div>
                <h4 className="text-base font-bold text-slate-800">No staff members found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {hasActiveFilters ? "Try clearing your active filters to see all staff members." : "Add your first solar engineer, technician, or sales executive."}
                </p>
                {hasActiveFilters ? (
                  <button onClick={resetFilters} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">
                    Clear Filters
                  </button>
                ) : (
                  <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl">
                    + Add Staff Member
                  </button>
                )}
              </div>
            ) : viewMode === "table" ? (
              /* DENSE OPERATIONAL TABLE */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Employee ID & Dept</th>
                      <th className="py-3 px-4">Designation & Team</th>
                      <th className="py-3 px-4">Reporting Manager</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">System Access</th>
                      <th className="py-3 px-4">Active Projects</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {staffList.map(member => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenProfile(member.id)}
                      >
                        {/* Member Identity */}
                        <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => handleOpenProfile(member.id)}
                                className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors text-left"
                              >
                                {member.name}
                              </button>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                {member.phone && <span>{member.phone}</span>}
                                {member.phone && member.email && <span>•</span>}
                                {member.email && <span className="truncate max-w-[150px]">{member.email}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ID & Department */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                              {member.employeeId}
                            </span>
                            <div>
                              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColorClass(member.department)}`}>
                                {member.department}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Team */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-slate-800">{member.designation}</p>
                            <p className="text-[11px] text-slate-400">{member.team || "General Pool"}</p>
                          </div>
                        </td>

                        {/* Reporting Manager */}
                        <td className="py-3.5 px-4">
                          {member.manager ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-medium text-slate-800">{member.manager.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({member.manager.employeeId})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Reports to Board</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(member.status)}
                        </td>

                        {/* System Access */}
                        <td className="py-3.5 px-4">
                          {member.user ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              member.user.role === "TENANT_ADMIN"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              <Shield size={11} /> {member.user.role === "TENANT_ADMIN" ? "Admin" : "Sub-Admin"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Field Staff (No Login)</span>
                          )}
                        </td>

                        {/* Project Assignments */}
                        <td className="py-3.5 px-4">
                          {member.projectAssignments && member.projectAssignments.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {member.projectAssignments.slice(0, 2).map(pa => (
                                <span
                                  key={pa.id}
                                  className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded"
                                  title={`${pa.project.name} (${pa.role})`}
                                >
                                  {pa.project.projectNumber || pa.project.name.slice(0, 10)}
                                </span>
                              ))}
                              {member.projectAssignments.length > 2 && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  +{member.projectAssignments.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Unassigned</span>
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenProfile(member.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Full Profile & Activity"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Edit Details"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              onClick={() => setShowAssignModal({ staff: member })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Assign Project"
                            >
                              <Briefcase size={15} />
                            </button>

                            {member.email && (
                              <button
                                onClick={() => handleResendCredentials(member)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Send Login Credentials to Email"
                              >
                                <Mail size={15} />
                              </button>
                            )}

                            {member.status === "SUSPENDED" ? (
                              <button
                                onClick={() => handleReactivateStaff(member)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Reactivate Employee Access"
                              >
                                <ShieldCheck size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowSuspendModal({ staff: member, reason: "" })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Suspend Employee Access"
                              >
                                <ShieldAlert size={15} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteStaff(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete & Reassign Employee"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {staffList.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleOpenProfile(member.id)}
                    className="p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer bg-white space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                            {member.name}
                          </h4>
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {member.employeeId}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(member.status)}
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Department:</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColorClass(member.department)}`}>
                          {member.department}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Designation:</span>
                        <span className="font-semibold text-slate-800">{member.designation}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Team:</span>
                        <span className="text-slate-700">{member.team || "General Pool"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Manager:</span>
                        <span className="text-slate-700">{member.manager?.name || "Direct Board"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Briefcase size={14} className="text-amber-500" />
                        <span>{member.projectAssignments?.length || 0} Projects</span>
                      </div>

                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenProfile(member.id)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Edit Details"
                        >
                          <Edit3 size={14} />
                        </button>
                        {member.status === "SUSPENDED" ? (
                          <button
                            onClick={() => handleReactivateStaff(member)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Reactivate Employee"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowSuspendModal({ staff: member, reason: "" })}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Suspend Employee"
                          >
                            <ShieldAlert size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStaff(member)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Delete Employee"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION BAR */}
            <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">{staffList.length}</span> of <span className="font-bold text-slate-800">{totalCount}</span> staff members
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS & TEAMS */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Departments & Job Designations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage functional operational divisions and roles across your solar enterprise.</p>
            </div>
            <button
              onClick={() => setShowDeptModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={16} /> Add Custom Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDeptColorClass(dept.name)}`}>
                      {dept.code || "DEPT"}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-2">{dept.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {dept._count?.staff || 0} Staff
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {dept.description || "Operational solar workforce department."}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Supported Designations ({dept.designations?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.designations && dept.designations.length > 0 ? (
                      dept.designations.map(des => (
                        <span key={des} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {des}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No fixed designations configured</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setFilterDept(dept.name);
                      setActiveTab("directory");
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    View Staff in {dept.name} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROJECT ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Solar EPC Project Deployments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Active field engineers, master electricians, and technicians assigned to turnkey projects.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Department & Designation</th>
                    <th className="py-3 px-4">Assigned Solar Project</th>
                    <th className="py-3 px-4">Project Stage</th>
                    <th className="py-3 px-4">Operational Role</th>
                    <th className="py-3 px-4">Assigned Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {staffList.filter(s => s.projectAssignments && s.projectAssignments.length > 0).flatMap(s => 
                    (s.projectAssignments || []).map(pa => (
                      <tr key={`${s.id}-${pa.project.id}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{s.employeeId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getDeptColorClass(s.department)}`}>
                            {s.department}
                          </span>
                          <div className="text-slate-600 mt-0.5">{s.designation}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{pa.project.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {pa.project.projectNumber ? `${pa.project.projectNumber} • ` : ""}{pa.project.capacity ? `${pa.project.capacity} kW` : ""}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px]">
                            {pa.project.currentStage || "Active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                            {pa.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {pa.assignedAt ? pa.assignedAt.split("T")[0] : "Recent"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUnassignProject(s.id, pa.project.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Unassign from project"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {staffList.filter(s => s.projectAssignments && s.projectAssignments.length > 0).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No active project assignments. Assign staff members to ongoing projects from the directory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTING HIERARCHY */}
      {activeTab === "hierarchy" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Organizational Reporting Tree</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cycle-safe supervisory relationships from leadership down to site crews.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            {/* Find roots (staff without manager) */}
            {staffList.filter(s => !s.managerId).map(root => (
              <div key={root.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {root.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{root.name}</h4>
                      <p className="text-xs text-slate-500">{root.designation} • <span className="font-mono font-bold">{root.employeeId}</span></p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Executive Root
                  </span>
                </div>

                {/* Direct Reports */}
                <div className="pl-6 border-l-2 border-slate-300 ml-5 space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Direct Reports ({staffList.filter(s => s.managerId === root.id).length}):
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staffList.filter(s => s.managerId === root.id).map(report => (
                      <div
                        key={report.id}
                        onClick={() => handleOpenProfile(report.id)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-1.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">{report.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{report.employeeId}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{report.designation}</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                          <span>{report.department}</span>
                          <span>{report._count?.directReports || 0} sub-reports</span>
                        </div>
                      </div>
                    ))}
                    {staffList.filter(s => s.managerId === root.id).length === 0 && (
                      <div className="text-xs text-slate-400 italic">No direct reports assigned yet</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT USER PERMISSIONS MODAL */}
      {editingUserPerms && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">RBAC Permissions — {editingUserPerms.name}</h3>
                <p className="text-xs text-slate-500">{editingUserPerms.email}</p>
              </div>
              <button onClick={() => setEditingUserPerms(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserPermissions} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Access Role</label>
                <select
                  value={userPermsForm.role}
                  onChange={e => setUserPermsForm({ ...userPermsForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="TENANT_SUB_ADMIN">Sub-Admin (Granular Module Access)</option>
                  <option value="TENANT_ADMIN">Tenant Admin (Full Global System Access)</option>
                </select>
              </div>

              {userPermsForm.role === "TENANT_SUB_ADMIN" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Accessible Modules ({userPermsForm.modules.length}):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUserPermsForm(prev => ({ ...prev, modules: AVAILABLE_MODULES.map(m => m.key) }))}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setUserPermsForm(prev => ({ ...prev, modules: [] }))}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* QUICK ROLE PRESETS */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setUserPermsForm(prev => ({ ...prev, modules: ["leads", "crm", "quotations"] }))}
                      className="text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg transition"
                    >
                      + Sales & CRM
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPermsForm(prev => ({ ...prev, modules: ["surveys", "projects", "tasks", "installation"] }))}
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition"
                    >
                      + Field Engineering
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPermsForm(prev => ({ ...prev, modules: ["projects", "inventory", "procurement"] }))}
                      className="text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition"
                    >
                      + Operations
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPermsForm(prev => ({ ...prev, modules: ["finance", "subsidy", "loans"] }))}
                      className="text-[10px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition"
                    >
                      + Finance
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPermsForm(prev => ({ ...prev, modules: ["service", "communication", "documents"] }))}
                      className="text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition"
                    >
                      + Support & AMC
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-56 overflow-y-auto">
                    {AVAILABLE_MODULES.map(m => {
                      const checked = userPermsForm.modules.includes(m.key);
                      return (
                        <label
                          key={m.key}
                          onClick={() => handleToggleEditUserModule(m.key)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                            checked ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-emerald-600" />
                          <span>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-medium">
                  Tenant Admins have unrestricted administrative rights across all modules, billing, settings, and team records.
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUserPerms(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE USER MODAL */}
      {showInviteUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite System User</h3>
                <p className="text-xs text-slate-500">Provision credentials and RBAC access</p>
              </div>
              <button onClick={() => setShowInviteUserModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteUserSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Option to link existing staff */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Staff Member (Optional)</label>
                <select
                  value={inviteUserForm.staffId}
                  onChange={e => handleSelectStaffForInvite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="">-- Manual Account / Standalone User --</option>
                  {staffList.filter(s => !s.userId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeId}) • {s.department}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Selecting a staff member auto-fills their details and links their profile.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={inviteUserForm.name}
                    onChange={e => setInviteUserForm({ ...inviteUserForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={inviteUserForm.email}
                    onChange={e => setInviteUserForm({ ...inviteUserForm, email: e.target.value })}
                    placeholder="ramesh@solarcompany.in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Role</label>
                  <select
                    value={inviteUserForm.role}
                    onChange={e => setInviteUserForm({ ...inviteUserForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="TENANT_SUB_ADMIN">Sub-Admin (Restricted)</option>
                    <option value="TENANT_ADMIN">Tenant Admin (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Department</label>
                  <select
                    value={inviteUserForm.department}
                    onChange={e => setInviteUserForm({ ...inviteUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {inviteUserForm.role !== "TENANT_ADMIN" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Module Access Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {AVAILABLE_MODULES.map(m => {
                      const checked = inviteUserForm.permissions.modules.includes(m.key);
                      return (
                        <label
                          key={m.key}
                          onClick={() => {
                            const cur = inviteUserForm.permissions.modules;
                            const next = cur.includes(m.key) ? cur.filter(x => x !== m.key) : [...cur, m.key];
                            setInviteUserForm(prev => ({
                              ...prev,
                              permissions: { modules: next }
                            }));
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                            checked ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-emerald-600" />
                          <span>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingStaff ? "Update workforce details and operational permissions" : "Create employee profile with optional system login access"}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitStaffForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} /> 1. Personal & Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Vikram Patil"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Work Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vikram@solarcompany.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Mobile Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98210 12345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Spouse / Parent (+91 98210 54321)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: EMPLOYMENT INFORMATION */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={13} /> 2. Employment & Reporting Structure
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">Employee ID</label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateId}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="e.g. EMP-105"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none font-mono text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Department *</label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800 bg-white"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Job Designation *</label>
                    <input
                      required
                      type="text"
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Solar Engineer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Reporting Manager</label>
                    <select
                      value={formData.managerId}
                      onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="">No Direct Manager (Reports to Board)</option>
                      {staffList
                        .filter(s => !editingStaff || s.id !== editingStaff.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.designation})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="FULL_TIME">Full-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="PROBATION">Probation</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: OPERATIONAL & FIELD DETAILS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={13} /> 3. Operational Deployment & Certifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Assigned Team / Crew</label>
                    <input
                      type="text"
                      value={formData.team}
                      onChange={e => setFormData({ ...formData, team: e.target.value })}
                      placeholder="e.g. Alpha Crew (Industrial)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Work Location / Site Hub</label>
                    <input
                      type="text"
                      value={formData.workLocation}
                      onChange={e => setFormData({ ...formData, workLocation: e.target.value })}
                      placeholder="e.g. Western Zone Field"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 outline-none text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Skills & Certifications</label>
                  <div className="flex flex-wrap gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {COMMON_SOLAR_SKILLS.map(skill => {
                      const selected = formData.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                            selected
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: SYSTEM USER ACCOUNT (ONLY ON CREATION) */}
              {!editingStaff && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Provision System Login Account</h4>
                      <p className="text-[11px] text-slate-500">Allow this staff member to sign in to WhereReady Solar OS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.createSystemAccount}
                        onChange={e => setFormData({ ...formData, createSystemAccount: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  {formData.createSystemAccount && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">System Role</label>
                        <select
                          value={formData.systemRole}
                          onChange={e => setFormData({ ...formData, systemRole: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        >
                          <option value="TENANT_SUB_ADMIN">Tenant Sub-Admin (Granular Permissions)</option>
                          <option value="TENANT_ADMIN">Tenant Administrator (Full Global Access)</option>
                        </select>
                      </div>

                      {formData.systemRole === "TENANT_SUB_ADMIN" && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                            Module Access Privileges:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_MODULES.map(m => {
                              const checked = formData.permissions.includes(m.key);
                              return (
                                <label
                                  key={m.key}
                                  onClick={() => handleToggleModule(m.key)}
                                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                                    checked ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-slate-600 border-slate-200"
                                  }`}
                                >
                                  <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-emerald-600" />
                                  <span>{m.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} /> Temporary login password will be generated upon submission.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : editingStaff ? "Save Changes" : "Create Staff Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF PROFILE DRAWER / MODAL */}
      {selectedStaffProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-extrabold text-xl backdrop-blur-sm border border-white/20">
                  {selectedStaffProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight">{selectedStaffProfile.name}</h2>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                      {selectedStaffProfile.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedStaffProfile.designation} • {selectedStaffProfile.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaffProfile(null)}
                className="text-white/60 hover:text-white p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Drawer Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 text-xs font-bold">
              <button
                onClick={() => setProfileTab("details")}
                className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                  profileTab === "details"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText size={14} /> Employment & Record
              </button>
              <button
                onClick={() => {
                  setProfileTab("activity");
                  if (selectedStaffProfile) fetchStaffActivity(selectedStaffProfile.id);
                }}
                className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                  profileTab === "activity"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock size={14} /> Employee Activity & Audit Trail
                {staffActivity?.stats?.totalEvents !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                    {staffActivity.stats.totalEvents}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {profileTab === "details" ? (
                <>
                  {/* Contact & Status Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedStaffProfile.status)}</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Phone:</span>
                      <p className="font-bold text-slate-800 mt-1">{selectedStaffProfile.phone || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Work Email:</span>
                      <p className="font-bold text-slate-800 mt-1 truncate">{selectedStaffProfile.email || "Not set"}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Joined:</span>
                      <p className="font-bold text-slate-800 mt-1">
                        {selectedStaffProfile.joiningDate ? selectedStaffProfile.joiningDate.split("T")[0] : "Recent"}
                      </p>
                    </div>
                  </div>

                  {/* Hierarchy & Location */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workforce Context</h4>
                    <div className="p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Reporting Line:</span>
                        <span className="font-bold text-slate-800">
                          {selectedStaffProfile.manager ? `${selectedStaffProfile.manager.name} (${selectedStaffProfile.manager.designation})` : "Direct Executive Level"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Assigned Team:</span>
                        <span className="font-bold text-slate-800">{selectedStaffProfile.team || "General Pool"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Operating Region:</span>
                        <span className="font-bold text-slate-800">{selectedStaffProfile.workLocation || "Field Sites"}</span>
                      </div>
                      {selectedStaffProfile.emergencyContact && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Emergency Contact:</span>
                          <span className="font-bold text-slate-800">{selectedStaffProfile.emergencyContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  {selectedStaffProfile.skills && selectedStaffProfile.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills & Certifications</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStaffProfile.skills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Project Assignments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Solar Projects ({selectedStaffProfile.projectAssignments?.length || 0})
                      </h4>
                      <button
                        onClick={() => {
                          setShowAssignModal({ staff: selectedStaffProfile });
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus size={13} /> Assign to Project
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedStaffProfile.projectAssignments && selectedStaffProfile.projectAssignments.length > 0 ? (
                        selectedStaffProfile.projectAssignments.map(pa => (
                          <div key={pa.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{pa.project.name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {pa.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Stage: {pa.project.currentStage || "Active"} • Capacity: {pa.project.capacity || 0} kW
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnassignProject(selectedStaffProfile.id, pa.project.id)}
                              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              Release
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-xl text-center">
                          Not currently assigned to any active project
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System User Account Management */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Login Account</h4>
                    <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        {selectedStaffProfile.user ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{selectedStaffProfile.user.email}</span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                {selectedStaffProfile.user.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {selectedStaffProfile.user.mustChangePassword ? "Pending password setup (temporary credentials active)" : "Active verified user account"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-slate-800 text-xs">No System Login Account</p>
                            <p className="text-[11px] text-slate-500">Operating as dedicated field staff without application sign-in</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedStaffProfile.email && (
                          <button
                            onClick={() => handleResendCredentials(selectedStaffProfile)}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-xs flex items-center gap-1"
                            title="Send Login Credentials Email"
                          >
                            <Mail size={13} /> Send Credentials
                          </button>
                        )}
                        <button
                          onClick={() => handleAccountCredentials(selectedStaffProfile)}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
                        >
                          {selectedStaffProfile.user ? "Reset Password" : "Provision Login"}
                        </button>
                        {selectedStaffProfile.user && (
                          <button
                            onClick={() => handleRevokeAccount(selectedStaffProfile)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Revoke System Access"
                          >
                            <UserX size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* LIVE EMPLOYEE ACTIVITY & AUDIT TRAIL TAB */
                <div className="space-y-4">
                  {activityLoading ? (
                    <div className="py-12 text-center space-y-2">
                      <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
                      <p className="text-xs font-bold text-slate-500">Loading live employee activity...</p>
                    </div>
                  ) : (
                    <>
                      {/* Activity Stats Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Logged Events</span>
                          <span className="text-lg font-extrabold text-slate-900">{staffActivity?.stats?.totalEvents || 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Projects</span>
                          <span className="text-lg font-extrabold text-emerald-600">{staffActivity?.stats?.activeProjects || 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Leads</span>
                          <span className="text-lg font-extrabold text-blue-600">{staffActivity?.stats?.assignedLeadsCount || 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Tasks</span>
                          <span className="text-lg font-extrabold text-purple-600">{staffActivity?.stats?.assignedTasksCount || 0}</span>
                        </div>
                      </div>

                      {/* Chronological Activity Feed */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Real-Time Activity Feed ({staffActivity?.events?.length || 0})
                          </h4>
                          <button
                            onClick={() => fetchStaffActivity(selectedStaffProfile.id)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Refresh
                          </button>
                        </div>

                        {staffActivity?.events && staffActivity.events.length > 0 ? (
                          <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-2">
                            {staffActivity.events.map((evt: any) => (
                              <div
                                key={evt.id}
                                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs space-y-1 relative"
                              >
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        evt.type === "EMPLOYEE_ACTION"
                                          ? "bg-blue-100 text-blue-800"
                                          : evt.type === "ADMIN_ACTION"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {evt.category || evt.type}
                                    </span>
                                    <span className="font-bold text-slate-800">{evt.title}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(evt.timestamp).toLocaleDateString()} {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {evt.description && (
                                  <p className="text-[11px] text-slate-600 break-words font-mono bg-white p-2 rounded-lg border border-slate-100">
                                    {evt.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                  <span>Actor: <strong className="text-slate-700">{evt.actor}</strong></span>
                                  {evt.ipAddress && <span>IP: {evt.ipAddress}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1 text-xs">
                            <Clock size={20} className="text-slate-400 mx-auto" />
                            <p className="font-bold text-slate-700">No activity events recorded yet</p>
                            <p className="text-slate-400 text-[11px]">Actions on leads, projects, site surveys, and platform logins are audited live.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Profile Footer - Tenant Admin Authority Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const s = selectedStaffProfile;
                    setSelectedStaffProfile(null);
                    handleOpenEditModal(s);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={14} /> Edit Record
                </button>

                {selectedStaffProfile.email && (
                  <button
                    onClick={() => handleResendCredentials(selectedStaffProfile)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Send Login Credentials to Email"
                  >
                    <Mail size={14} /> Send Login Email
                  </button>
                )}

                {selectedStaffProfile.status === "SUSPENDED" ? (
                  <button
                    onClick={() => handleReactivateStaff(selectedStaffProfile)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ShieldCheck size={14} /> Reactivate Access
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSuspendModal({ staff: selectedStaffProfile, reason: "" })}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ShieldAlert size={14} /> Suspend Access
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteModal({ staff: selectedStaffProfile, reassignTo: "", force: false })}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Trash2 size={14} /> Delete Employee
                </button>
              </div>

              <button
                onClick={() => setSelectedStaffProfile(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND EMPLOYEE MODAL (TENANT ADMIN AUTHORITY) */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={20} />
                <h3 className="text-base font-bold text-slate-900">Suspend Employee Access</h3>
              </div>
              <button onClick={() => setShowSuspendModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to suspend <strong className="text-slate-900">{showSuspendModal.staff.name}</strong> ({showSuspendModal.staff.employeeId})?
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-800">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle size={14} /> Immediate Security Enforcement:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                  <li>Active sessions are invalidated immediately</li>
                  <li>System login is blocked across web and mobile</li>
                  <li>Suspension notice will be dispatched to their work email</li>
                </ul>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold block">Suspension Reason (Logged in Audit Trail):</label>
                <input
                  type="text"
                  placeholder="e.g., Performance review, Contract ended, Security policy"
                  value={showSuspendModal.reason}
                  onChange={e => setShowSuspendModal({ ...showSuspendModal, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSuspendModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspendStaff(showSuspendModal.staff, showSuspendModal.reason)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE EMPLOYEE & REASSIGNMENT MODAL (TENANT ADMIN FULL CONTROL) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 size={20} />
                <h3 className="text-base font-bold text-slate-900">Delete Employee Profile</h3>
              </div>
              <button onClick={() => setShowDeleteModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                You are initiating permanent deletion for <strong className="text-slate-900">{showDeleteModal.staff.name}</strong> ({showDeleteModal.staff.employeeId}).
              </p>

              {/* Dependencies Check */}
              {((showDeleteModal.staff.projectAssignments && showDeleteModal.staff.projectAssignments.length > 0) ||
                (showDeleteModal.staff._count?.directReports && showDeleteModal.staff._count.directReports > 0)) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Active Responsibilities Detected:
                  </p>
                  <p className="text-[11px] text-amber-800">
                    This staff member has {showDeleteModal.staff.projectAssignments?.length || 0} active project assignment(s) and {showDeleteModal.staff._count?.directReports || 0} direct report(s). Select a team member to seamlessly inherit these duties:
                  </p>

                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-amber-900 block">Reassign Responsibilities To:</label>
                    <select
                      value={showDeleteModal.reassignTo}
                      onChange={e => setShowDeleteModal({ ...showDeleteModal, reassignTo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Choose Colleague to Reassign --</option>
                      {staffList
                        .filter(s => s.id !== showDeleteModal.staff.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.designation} - {s.employeeId})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={showDeleteModal.force}
                    onChange={e => setShowDeleteModal({ ...showDeleteModal, force: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] font-semibold">
                    Proceed with deletion (assignments will be released, orphaned reports unlinked)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={Boolean(
                  !showDeleteModal.force &&
                  !showDeleteModal.reassignTo &&
                  ((showDeleteModal.staff.projectAssignments && showDeleteModal.staff.projectAssignments.length > 0) ||
                    ((showDeleteModal.staff._count?.directReports ?? 0) > 0))
                )}
                onClick={() => handleExecuteDeleteStaff(showDeleteModal.staff.id, showDeleteModal.reassignTo, showDeleteModal.force)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TO PROJECT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign to Solar Project</h3>
                <p className="text-xs text-slate-500">{showAssignModal.staff.name} ({showAssignModal.staff.designation})</p>
              </div>
              <button onClick={() => setShowAssignModal(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Select Project *</label>
                <select
                  required
                  value={assignForm.projectId}
                  onChange={e => setAssignForm({ ...assignForm, projectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.projectNumber ? `(${p.projectNumber})` : ""} - {p.currentStage || "Active"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Operational Role</label>
                <select
                  value={assignForm.role}
                  onChange={e => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="PROJECT_LEAD">Project Lead / In-Charge</option>
                  <option value="SITE_ENGINEER">Site Installation Engineer</option>
                  <option value="LEAD_ELECTRICIAN">Lead Electrician / Wireman</option>
                  <option value="TECHNICIAN">Solar Panel Technician</option>
                  <option value="SAFETY_INSPECTOR">Safety & QA Inspector</option>
                  <option value="HELPER">Field Assistant / Helper</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Assignment Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={assignForm.notes}
                  onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Key responsibilities or deliverables..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Department</h3>
                <p className="text-xs text-slate-500">Configure organizational unit and job roles</p>
              </div>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Department Name *</label>
                <input
                  required
                  type="text"
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Quality Assurance & Auditing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Code</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={e => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="e.g. QA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Color Theme</label>
                  <select
                    value={deptForm.color}
                    onChange={e => setDeptForm({ ...deptForm, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                  >
                    <option value="blue">Blue</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                    <option value="rose">Rose</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Supported Designations (comma-separated)</label>
                <textarea
                  rows={2}
                  value={deptForm.designationsInput}
                  onChange={e => setDeptForm({ ...deptForm, designationsInput: e.target.value })}
                  placeholder="e.g. QA Lead, Site Auditor, Standards Inspector"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPORARY CREDENTIALS ALERT MODAL */}
      {tempPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Key size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Login Credentials Generated</h3>
            <p className="text-xs text-slate-500">
              Share these temporary credentials with <span className="font-semibold text-slate-800">{tempPasswordModal.user}</span>. They will be prompted to choose a new password upon first sign-in.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-base font-bold text-slate-900 tracking-wider">
                {tempPasswordModal.pass}
              </span>
              <button
                onClick={copyPassword}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
