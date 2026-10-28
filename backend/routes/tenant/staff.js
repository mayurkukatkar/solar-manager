const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../../db');
const { requireTenantAuth, logAudit } = require('../../middleware/auth');

// Helper: generate next Employee ID for tenant
async function generateEmployeeId(tenantId) {
  const count = await prisma.staff.count({ where: { tenantId } });
  const nextNum = (count + 1).toString().padStart(3, '0');
  const candidate = `EMP-${nextNum}`;
  const existing = await prisma.staff.findFirst({
    where: { tenantId, employeeId: candidate }
  });
  if (!existing) return candidate;
  return `EMP-${Date.now().toString().slice(-4)}`;
}

// Helper: detect manager cycle (A -> B -> A or longer loop)
async function wouldCreateCycle(tenantId, staffId, candidateManagerId) {
  if (!candidateManagerId) return false;
  if (staffId === candidateManagerId) return true;

  let currentId = candidateManagerId;
  const visited = new Set([staffId]);

  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);

    const m = await prisma.staff.findFirst({
      where: { id: currentId, tenantId },
      select: { managerId: true }
    });
    if (!m || !m.managerId) break;
    currentId = m.managerId;
  }
  return false;
}

// ----------------------------------------------------
// 1. STAFF OPERATIONAL OVERVIEW & METRICS
// ----------------------------------------------------
router.get('/api/tenant/staff/overview', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [
      totalStaff,
      activeStaff,
      onLeaveStaff,
      inactiveStaff,
      probationStaff,
      withAccount,
      departments,
      allStaff,
      assignmentsCount
    ] = await Promise.all([
      prisma.staff.count({ where: { tenantId } }),
      prisma.staff.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.staff.count({ where: { tenantId, status: 'ON_LEAVE' } }),
      prisma.staff.count({ where: { tenantId, status: 'INACTIVE' } }),
      prisma.staff.count({ where: { tenantId, status: 'PROBATION' } }),
      prisma.staff.count({ where: { tenantId, userId: { not: null } } }),
      prisma.department.findMany({
        where: { tenantId },
        include: { _count: { select: { staff: true } } }
      }),
      prisma.staff.findMany({
        where: { tenantId },
        select: {
          id: true,
          department: true,
          employmentType: true,
          team: true,
          _count: { select: { projectAssignments: true } }
        }
      }),
      prisma.projectStaffAssignment.count({ where: { tenantId, status: 'ACTIVE' } })
    ]);

    // Department counts
    const departmentMap = {};
    departments.forEach(d => {
      departmentMap[d.name] = {
        name: d.name,
        code: d.code,
        color: d.color || 'blue',
        count: d._count.staff
      };
    });

    // Count unlisted departments if any staff has custom department string
    allStaff.forEach(s => {
      if (s.department && !departmentMap[s.department]) {
        departmentMap[s.department] = {
          name: s.department,
          code: 'GEN',
          color: 'slate',
          count: 1
        };
      }
    });

    // Employment type distribution
    const employmentTypes = {
      FULL_TIME: 0,
      PART_TIME: 0,
      CONTRACT: 0,
      INTERN: 0
    };
    allStaff.forEach(s => {
      if (employmentTypes[s.employmentType] !== undefined) {
        employmentTypes[s.employmentType]++;
      } else {
        employmentTypes[s.employmentType] = 1;
      }
    });

    // Teams list
    const teamSet = new Set();
    allStaff.forEach(s => {
      if (s.team) teamSet.add(s.team);
    });

    // Unassigned staff count (active staff with 0 active project assignments)
    const unassignedCount = allStaff.filter(s => s._count.projectAssignments === 0).length;

    res.json({
      metrics: {
        totalStaff,
        activeStaff,
        onLeaveStaff,
        inactiveStaff,
        probationStaff,
        withAccount,
        withoutAccount: totalStaff - withAccount,
        activeProjectAssignments: assignmentsCount,
        unassignedStaff: unassignedCount,
        totalTeams: teamSet.size,
        teams: Array.from(teamSet),
        departmentDistribution: Object.values(departmentMap),
        employmentTypes
      }
    });
  } catch (error) {
    console.error('Error fetching staff overview:', error);
    res.status(500).json({ error: 'Failed to fetch workforce overview' });
  }
});

// ----------------------------------------------------
// 2. STAFF DIRECTORY (FILTERED, PAGINATED, SEARCHABLE)
// ----------------------------------------------------
router.get('/api/tenant/staff', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      search,
      department,
      designation,
      status,
      employmentType,
      team,
      hasAccount,
      unassignedOnly,
      managerId,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = { tenantId };

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { employeeId: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { team: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Filters
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (designation && designation !== 'ALL') {
      where.designation = designation;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (employmentType && employmentType !== 'ALL') {
      where.employmentType = employmentType;
    }
    if (team && team !== 'ALL') {
      where.team = team;
    }
    if (managerId && managerId !== 'ALL') {
      where.managerId = managerId;
    }
    if (hasAccount === 'true') {
      where.userId = { not: null };
    } else if (hasAccount === 'false') {
      where.userId = null;
    }
    if (unassignedOnly === 'true') {
      where.projectAssignments = { none: {} };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * take;

    const allowedSort = ['name', 'employeeId', 'joiningDate', 'department', 'designation', 'createdAt', 'status'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, staff] = await Promise.all([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortDirection },
        include: {
          manager: {
            select: { id: true, name: true, employeeId: true, designation: true }
          },
          user: {
            select: { id: true, email: true, role: true, mustChangePassword: true, permissions: true }
          },
          projectAssignments: {
            where: { status: 'ACTIVE' },
            include: {
              project: {
                select: { id: true, name: true, projectNumber: true, currentStage: true, status: true, capacity: true }
              }
            }
          },
          _count: {
            select: {
              directReports: true,
              projectAssignments: true
            }
          }
        }
      })
    ]);

    res.json({
      staff,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching staff directory:', error);
    res.status(500).json({ error: 'Failed to fetch staff directory' });
  }
});

// ----------------------------------------------------
// 3. GET SINGLE STAFF MEMBER PROFILE
// ----------------------------------------------------
router.get('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const member = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: {
        manager: {
          select: { id: true, name: true, employeeId: true, designation: true, email: true, phone: true }
        },
        directReports: {
          select: { id: true, name: true, employeeId: true, designation: true, status: true, department: true }
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            mustChangePassword: true,
            permissions: true,
            createdAt: true,
            _count: {
              select: {
                assignedLeads: true,
                assignedTasks: true,
                assignedTickets: true,
                assignedSurveys: true,
                projectsOwned: true
              }
            }
          }
        },
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectNumber: true,
                currentStage: true,
                status: true,
                capacity: true,
                city: true,
                installationAddress: true,
                startDate: true,
                expectedCompletionDate: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Retrieve recent audit logs for this staff member
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: 'Staff',
        entityId: id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({ member, auditLogs });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member details' });
  }
});

// ----------------------------------------------------
// 4. CREATE NEW STAFF MEMBER (WITH OPTIONAL SYSTEM USER)
// ----------------------------------------------------
router.post('/api/tenant/staff', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // Enforce Tenant Admin role for staff creation
    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can create staff members' });
    }

    const {
      name,
      employeeId,
      department,
      designation,
      email,
      phone,
      emergencyContact,
      employmentType = 'FULL_TIME',
      status = 'ACTIVE',
      joiningDate,
      workLocation,
      skills = [],
      team,
      managerId,
      notes,
      createSystemAccount = false,
      systemRole = 'TENANT_SUB_ADMIN',
      permissions = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Staff name is required' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department is required' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ error: 'Job designation is required' });
    }

    // Employee ID handling
    let finalEmpId = employeeId ? employeeId.trim().toUpperCase() : await generateEmployeeId(tenantId);
    const existingEmp = await prisma.staff.findFirst({
      where: { tenantId, employeeId: finalEmpId }
    });
    if (existingEmp) {
      return res.status(409).json({ error: `Employee ID "${finalEmpId}" already exists for your organization` });
    }

    // Validate email if provided
    let cleanEmail = email ? email.trim().toLowerCase() : null;
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Validate manager if provided
    if (managerId) {
      const mgr = await prisma.staff.findFirst({
        where: { id: managerId, tenantId }
      });
      if (!mgr) {
        return res.status(400).json({ error: 'Selected reporting manager was not found in your organization' });
      }
    }

    let createdUser = null;
    let tempPassword = null;

    // Create system login account if requested
    if (createSystemAccount) {
      if (!cleanEmail) {
        return res.status(400).json({ error: 'Email address is required to create a system login account' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });
      if (existingUser) {
        return res.status(409).json({ error: `User account with email "${cleanEmail}" already exists in the system` });
      }

      tempPassword = `Solar@${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      createdUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: systemRole === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_SUB_ADMIN',
          tenantId,
          mustChangePassword: true,
          permissions: Array.isArray(permissions) ? permissions : []
        }
      });
    }

    // Create Staff record
    const newStaff = await prisma.staff.create({
      data: {
        tenantId,
        employeeId: finalEmpId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        emergencyContact: emergencyContact ? emergencyContact.trim() : null,
        department: department.trim(),
        designation: designation.trim(),
        employmentType,
        status,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        workLocation: workLocation ? workLocation.trim() : null,
        skills: Array.isArray(skills) ? skills : [],
        team: team ? team.trim() : null,
        managerId: managerId || null,
        notes: notes ? notes.trim() : null,
        userId: createdUser ? createdUser.id : null
      },
      include: {
        manager: { select: { id: true, name: true, employeeId: true, designation: true } },
        user: { select: { id: true, email: true, role: true, mustChangePassword: true } }
      }
    });

    await logAudit(req, 'CREATE', 'Staff', newStaff.id, {
      name: newStaff.name,
      employeeId: newStaff.employeeId,
      department: newStaff.department,
      designation: newStaff.designation,
      hasUserAccount: !!createdUser
    });

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: newStaff,
      tempPassword
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// ----------------------------------------------------
// 5. UPDATE STAFF DETAILS
// ----------------------------------------------------
router.patch('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can edit staff records' });
    }

    const existing = await prisma.staff.findFirst({
      where: { id, tenantId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const {
      name,
      employeeId,
      department,
      designation,
      email,
      phone,
      emergencyContact,
      employmentType,
      status,
      joiningDate,
      workLocation,
      skills,
      team,
      managerId,
      notes
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (designation !== undefined) updateData.designation = designation.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact ? emergencyContact.trim() : null;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (status !== undefined) updateData.status = status;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate ? new Date(joiningDate) : null;
    if (workLocation !== undefined) updateData.workLocation = workLocation ? workLocation.trim() : null;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (team !== undefined) updateData.team = team ? team.trim() : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    // Employee ID uniqueness check if modified
    if (employeeId && employeeId.trim() !== existing.employeeId) {
      const cleanEmpId = employeeId.trim().toUpperCase();
      const duplicateEmp = await prisma.staff.findFirst({
        where: { tenantId, employeeId: cleanEmpId, id: { not: id } }
      });
      if (duplicateEmp) {
        return res.status(409).json({ error: `Employee ID "${cleanEmpId}" is already used by another staff member` });
      }
      updateData.employeeId = cleanEmpId;
    }

    // Email check if modified
    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
      }
      updateData.email = cleanEmail;
    }

    // Manager validation and cycle prevention
    if (managerId !== undefined) {
      if (managerId) {
        if (managerId === id) {
          return res.status(400).json({ error: 'An employee cannot be assigned as their own reporting manager' });
        }
        const cycle = await wouldCreateCycle(tenantId, id, managerId);
        if (cycle) {
          return res.status(400).json({ error: 'Invalid reporting manager: this would create a circular reporting loop' });
        }
        updateData.managerId = managerId;
      } else {
        updateData.managerId = null;
      }
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        manager: { select: { id: true, name: true, employeeId: true, designation: true } },
        user: { select: { id: true, email: true, role: true, mustChangePassword: true } },
        _count: { select: { directReports: true, projectAssignments: true } }
      }
    });

    // If staff has linked User account and name was changed, sync User.name
    if (existing.userId && updateData.name) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { name: updateData.name }
      }).catch(() => null);
    }

    await logAudit(req, 'UPDATE', 'Staff', id, {
      name: updated.name,
      employeeId: updated.employeeId,
      status: updated.status,
      department: updated.department
    });

    res.json({ message: 'Staff member updated successfully', staff: updated });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// ----------------------------------------------------
// 6. UPDATE STAFF STATUS (LIFECYCLE: ACTIVE / ON_LEAVE / INACTIVE)
// ----------------------------------------------------
router.patch('/api/tenant/staff/:id/status', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can change staff status' });
    }

    const validStatuses = ['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'PROBATION'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be ACTIVE, ON_LEAVE, INACTIVE, or PROBATION' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { projectAssignments: true, directReports: true } }
      }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if user is deactivating their own staff record
    if (status === 'INACTIVE' && staff.userId && staff.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative profile' });
    }

    const warnings = [];
    if (status === 'INACTIVE') {
      if (staff._count.projectAssignments > 0) {
        warnings.push(`Staff member has ${staff._count.projectAssignments} active project assignment(s). Please reassign them.`);
      }
      if (staff._count.directReports > 0) {
        warnings.push(`Staff member has ${staff._count.directReports} direct report(s). Consider reassigning their manager.`);
      }
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: { status }
    });

    await logAudit(req, 'STATUS_CHANGE', 'Staff', id, {
      previousStatus: staff.status,
      newStatus: status
    });

    res.json({
      message: `Staff status updated to ${status}`,
      staff: updated,
      warnings
    });
  } catch (error) {
    console.error('Error changing staff status:', error);
    res.status(500).json({ error: 'Failed to update staff status' });
  }
});

// ----------------------------------------------------
// 7. CREATE / RESET USER ACCOUNT FOR EXISTING STAFF
// ----------------------------------------------------
router.post('/api/tenant/staff/:id/account', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { role = 'TENANT_SUB_ADMIN', permissions = [] } = req.body;

    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can manage user login accounts' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: { user: true }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const tempPassword = `Solar@${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // If staff already has a linked User account, reset its password
    if (staff.user) {
      await prisma.user.update({
        where: { id: staff.user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
          role: role === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_SUB_ADMIN',
          permissions: Array.isArray(permissions) ? permissions : staff.user.permissions
        }
      });

      await logAudit(req, 'RESET_PASSWORD', 'User', staff.user.id, { staffId: staff.id });

      return res.json({
        message: 'Password reset successfully',
        tempPassword,
        account: { id: staff.user.id, email: staff.user.email, role }
      });
    }

    // Staff does not have a user account yet: create one
    if (!staff.email) {
      return res.status(400).json({ error: 'Staff member must have a valid work email to create a login account' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: staff.email }
    });
    if (existingUser) {
      // Link to existing user if not already linked
      await prisma.staff.update({
        where: { id: staff.id },
        data: { userId: existingUser.id }
      });
      return res.json({
        message: 'Existing user account linked to this staff profile',
        account: existingUser
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name: staff.name,
        email: staff.email,
        password: hashedPassword,
        role: role === 'TENANT_ADMIN' ? 'TENANT_ADMIN' : 'TENANT_SUB_ADMIN',
        tenantId,
        mustChangePassword: true,
        permissions: Array.isArray(permissions) ? permissions : []
      }
    });

    await prisma.staff.update({
      where: { id: staff.id },
      data: { userId: newUser.id }
    });

    await logAudit(req, 'INVITE_USER', 'User', newUser.id, { staffId: staff.id });

    res.status(201).json({
      message: 'System login account created successfully',
      tempPassword,
      account: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: 'INVITED'
      }
    });
  } catch (error) {
    console.error('Error creating/resetting staff account:', error);
    res.status(500).json({ error: 'Failed to manage staff login account' });
  }
});

// ----------------------------------------------------
// 8. REVOKE SYSTEM LOGIN ACCOUNT (WITHOUT DELETING STAFF PROFILE)
// ----------------------------------------------------
router.delete('/api/tenant/staff/:id/account', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can revoke login accounts' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: { user: true }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (!staff.userId) {
      return res.status(400).json({ error: 'Staff member does not have an active login account' });
    }

    if (staff.userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot revoke your own active login session' });
    }

    const userId = staff.userId;

    // Unlink userId from staff profile
    await prisma.staff.update({
      where: { id },
      data: { userId: null }
    });

    // Delete the User authentication account
    await prisma.user.delete({
      where: { id: userId }
    });

    await logAudit(req, 'REVOKE_ACCESS', 'Staff', id, { revokedUserId: userId });

    res.json({ message: 'System access revoked. Staff employment profile preserved.' });
  } catch (error) {
    console.error('Error revoking staff account:', error);
    res.status(500).json({ error: 'Failed to revoke system login access' });
  }
});

// ----------------------------------------------------
// 9. DELETE / DEACTIVATE STAFF MEMBER (SAFE LIFECYCLE)
// ----------------------------------------------------
router.delete('/api/tenant/staff/:id', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    if (req.user.role !== 'TENANT_ADMIN') {
      return res.status(403).json({ error: 'Only Tenant Administrators can remove staff members' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { projectAssignments: true, directReports: true } }
      }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Prevent deleting yourself
    if (staff.userId && staff.userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot remove your own staff account' });
    }

    // If staff has active project assignments or direct reports, archive as INACTIVE rather than hard delete
    if (staff._count.projectAssignments > 0 || staff._count.directReports > 0) {
      await prisma.staff.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });

      await logAudit(req, 'DEACTIVATE', 'Staff', id, {
        reason: 'Archived due to existing project or reporting dependencies'
      });

      return res.json({
        message: 'Staff member deactivated and archived. Project and reporting history preserved.',
        action: 'ARCHIVED'
      });
    }

    // If clean, safely delete
    await prisma.staff.delete({
      where: { id }
    });

    // Also delete orphaned user account if exists
    if (staff.userId) {
      await prisma.user.delete({ where: { id: staff.userId } }).catch(() => null);
    }

    await logAudit(req, 'DELETE', 'Staff', id, { name: staff.name, employeeId: staff.employeeId });

    res.json({ message: 'Staff member removed successfully', action: 'DELETED' });
  } catch (error) {
    console.error('Error removing staff member:', error);
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});

// ----------------------------------------------------
// 10. DEPARTMENTS & DESIGNATIONS API
// ----------------------------------------------------
router.get('/api/tenant/departments', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    let depts = await prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: { select: { staff: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ departments: depts });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.post('/api/tenant/departments', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, code, description, color = 'blue', designations = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const dept = await prisma.department.upsert({
      where: { tenantId_name: { tenantId, name: name.trim() } },
      update: {
        code: code ? code.trim().toUpperCase() : undefined,
        description: description ? description.trim() : undefined,
        color,
        designations: Array.isArray(designations) ? designations : []
      },
      create: {
        tenantId,
        name: name.trim(),
        code: code ? code.trim().toUpperCase() : null,
        description: description ? description.trim() : null,
        color,
        designations: Array.isArray(designations) ? designations : []
      }
    });

    res.status(201).json({ message: 'Department saved successfully', department: dept });
  } catch (error) {
    console.error('Error saving department:', error);
    res.status(500).json({ error: 'Failed to save department' });
  }
});

// ----------------------------------------------------
// 11. PROJECT ASSIGNMENT APIS
// ----------------------------------------------------
router.get('/api/tenant/staff/projects/assignments', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const assignments = await prisma.projectStaffAssignment.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: {
        staff: {
          select: { id: true, name: true, employeeId: true, designation: true, department: true }
        },
        project: {
          select: { id: true, name: true, projectNumber: true, currentStage: true, capacity: true, city: true }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).json({ error: 'Failed to fetch project assignments' });
  }
});

router.post('/api/tenant/staff/:id/assign-project', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { projectId, role = 'SITE_ENGINEER', notes } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const staff = await prisma.staff.findFirst({
      where: { id, tenantId }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assignment = await prisma.projectStaffAssignment.upsert({
      where: { staffId_projectId: { staffId: id, projectId } },
      update: { role, status: 'ACTIVE', notes: notes ? notes.trim() : undefined },
      create: {
        tenantId,
        staffId: id,
        projectId,
        role,
        status: 'ACTIVE',
        notes: notes ? notes.trim() : null
      },
      include: {
        project: { select: { id: true, name: true, projectNumber: true, currentStage: true } }
      }
    });

    await logAudit(req, 'ASSIGN_PROJECT', 'Staff', id, {
      projectId,
      projectName: project.name,
      role
    });

    res.json({ message: 'Project assigned successfully', assignment });
  } catch (error) {
    console.error('Error assigning project to staff:', error);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

router.delete('/api/tenant/staff/:id/assign-project/:projectId', requireTenantAuth, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id, projectId } = req.params;

    const assignment = await prisma.projectStaffAssignment.findFirst({
      where: { staffId: id, projectId, tenantId }
    });
    if (!assignment) {
      return res.status(404).json({ error: 'Project assignment not found' });
    }

    await prisma.projectStaffAssignment.delete({
      where: { id: assignment.id }
    });

    await logAudit(req, 'UNASSIGN_PROJECT', 'Staff', id, { projectId });

    res.json({ message: 'Project assignment removed successfully' });
  } catch (error) {
    console.error('Error unassigning project from staff:', error);
    res.status(500).json({ error: 'Failed to remove project assignment' });
  }
});

module.exports = router;
