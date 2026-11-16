import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatNaira } from '../data/platform';
import { passkeyAuth } from '../services/security';
import { 
  PERMISSION_GROUPS, 
  ALL_SUB_PERMISSION_KEYS, 
  DEFAULT_SECURITY_POLICIES,
  hasSubPermission 
} from '../services/db';
import './Admin.css';

export default function Admin() {
  const {
    user,
    login,
    dbAdmin,
    dbRefunds,
    dbConnection,
    refreshDbStatus,
    sovereignRate,
    updateSovereignBenchmark,
    calculateNTBRealYield,
    calculateCustomerAPY,
    refreshTiers,
    refreshModules,
  } = useApp();
  const navigate = useNavigate();

  // Access Permission State
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [elevatedSession, setElevatedSession] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview' | 'users' | 'tiers' | 'roles' | 'modules' | 'kyc_desk' | 'audit_queue' | 'audit_logs' | 'sovereign_rates' | 'database_vault'

  // Roles Sub-Tab: 'roles' | 'passcodes' | 'policies'
  const [rolesSubTab, setRolesSubTab] = useState('roles');

  // Sovereign Rate Desk State
  const [draftAuctionCode, setDraftAuctionCode] = useState(sovereignRate?.auctionCode || 'CBN-NTB-364D-2026-W46');
  const [draftStopRate, setDraftStopRate] = useState(sovereignRate?.stopRate || 15.80);
  const [draftFee, setDraftFee] = useState(sovereignRate?.protocolFee || 6.00);
  const [draftModel, setDraftModel] = useState(sovereignRate?.feeModel || 'REAL_YIELD_MINUS_FEE');

  // Core Data State
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [refundsList, setRefundsList] = useState([]);
  const [tiersList, setTiersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityPolicies, setSecurityPolicies] = useState(() => dbAdmin.getSecurityPolicies());
  const [timeLimitedPasscodes, setTimeLimitedPasscodes] = useState([]);

  // Toast Notifications
  const [actionSuccessToast, setActionSuccessToast] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [policyGroupFilter, setPolicyGroupFilter] = useState('all');

  // ════════════════════════════════════════════════════════════
  // MODALS STATE
  // ════════════════════════════════════════════════════════════
  // 1. Critical Action Security Confirmation Modal (Dual Auth: Master Key OR Time-Limited Passcode)
  const [securityConfirmModal, setSecurityConfirmModal] = useState({
    isOpen: false,
    title: '',
    actionType: '',
    permissionKey: '',
    requiresPassword: true,
    authMode: 'password', // 'password' | 'passcode'
    passcodeInput: '',
    passcodeError: '',
    target: '',
    exactChange: null,
    effectSummary: [],
    passwordInput: '',
    passwordError: '',
    isExecuting: false,
    onConfirm: null,
  });

  // 2. View Role in Full Modal (Android-Style Sub-Permissions Tree)
  const [viewRoleFullModal, setViewRoleFullModal] = useState({
    isOpen: false,
    role: null,
    searchQuery: '',
    filterType: 'all', // 'all' | 'read' | 'write' | 'create' | 'delete' | 'manage'
  });

  // 3. Issue Time-Limited Access Passcode Modal
  const [issuePasscodeModal, setIssuePasscodeModal] = useState({
    isOpen: false,
    issuedTo: 'Chief Compliance Officer',
    roleId: 'compliance_officer',
    durationMinutes: 60,
    purpose: 'Temporary permission delegation for role & access reconfiguration',
  });

  // 4. Add / Edit Tier Modal
  const [tierModal, setTierModal] = useState({
    isOpen: false,
    isEdit: false,
    data: {
      id: null,
      label: '',
      name: '',
      fee: 1000,
      category: 'small',
      maxPools: 5,
      color: '#00e5ff',
      disabled: false,
    }
  });

  // 5. Create / Edit Role Modal (ALL ROLES EDITABLE WITH GRANULAR SUB-PERMISSIONS)
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    isEdit: false,
    data: {
      id: '',
      name: '',
      badge: '🛡️ Custom Officer',
      color: '#38bdf8',
      description: '',
      permissions: ['users.read'],
    }
  });

  // 6. Assign Points Modal
  const [pointsModal, setPointsModal] = useState({
    isOpen: false,
    user: null,
    amount: 100,
    unit: 'NVT', // 'NVT' | 'POINTS' | 'NGN'
    reason: '',
  });

  // 7. Full User 360° Details Inspector Modal
  const [inspectUserModal, setInspectUserModal] = useState({
    isOpen: false,
    user: null,
    activeTab: 'profile', // 'profile' | 'kyc' | 'stakes' | 'balances' | 'network' | 'banks'
  });

  // 8. Rejection Reason Modal
  const [rejectModal, setRejectModal] = useState(null); // { type: 'kyc' | 'refund', id, name }
  const [rejectionReason, setRejectionReason] = useState('');

  // 9. Database Vault State
  const [showKey, setShowKey] = useState(false);
  const [dbTestResult, setDbTestResult] = useState(null);
  const [testingDb, setTestingDb] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin') || elevatedSession;

  // ════════════════════════════════════════════════════════════
  // LOAD ALL PROTOCOL DATA
  // ════════════════════════════════════════════════════════════
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [m, uList, rList] = await Promise.all([
        dbAdmin.getSystemMetrics(),
        dbAdmin.getAllUsers(),
        dbRefunds.getAllRequests(),
      ]);
      setMetrics(m);
      setUsersList(uList);
      setRefundsList(rList);
      setTiersList(dbAdmin.getTiersList());
      setRolesList(dbAdmin.getRolesList());
      setModulesList(dbAdmin.getPlatformModules());
      setAuditLogs(dbAdmin.getAuditLogs());
      setSecurityPolicies(dbAdmin.getSecurityPolicies());
      setTimeLimitedPasscodes(dbAdmin.getTimeLimitedPasscodes());
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Handle Passkey Unlock at Lock Screen
  const handlePasskeySubmit = async (e) => {
    e.preventDefault();
    const isValid = await passkeyAuth.verifyAdminPasskey(passkeyInput);
    if (isValid) {
      setElevatedSession(true);
      setPasskeyError('');
    } else {
      setPasskeyError('Invalid Administrator Security Master Key.');
    }
  };

  // Quick Sign In as Default Admin
  const handleQuickAdminLogin = async () => {
    try {
      const adminAcc = await dbAdmin.getAllUsers();
      const adminUser = adminAcc.find(u => u.email === 'admin@nodevault.io') || {
        id: 'd0000000-0000-0000-0000-000000000009',
        email: 'admin@nodevault.io',
        name: 'Compliance Officer (Admin)',
        role: 'admin',
        kycStatus: 'verified',
        region: 'NG',
      };
      login(adminUser);
      setElevatedSession(true);
    } catch (e) {
      setElevatedSession(true);
    }
  };

  // ════════════════════════════════════════════════════════════
  // TRIGGER CRITICAL SECURITY ACTION MODAL
  // Supports Dual Authorization: Admin Master Password OR Time-Limited Passcode!
  // ════════════════════════════════════════════════════════════
  const triggerSecurityAction = ({
    title,
    actionType,
    permissionKey,
    target,
    exactChange,
    effectSummary,
    onConfirm
  }) => {
    const isRequired = permissionKey ? dbAdmin.isPasswordRequired(permissionKey) : true;

    setSecurityConfirmModal({
      isOpen: true,
      title,
      actionType,
      permissionKey,
      requiresPassword: isRequired,
      authMode: 'password',
      passcodeInput: '',
      passcodeError: '',
      target,
      exactChange,
      effectSummary,
      passwordInput: '',
      passwordError: '',
      isExecuting: false,
      onConfirm,
    });
  };

  const handleExecuteSecurityAction = async (e) => {
    e.preventDefault();
    
    // Only require authorization if policy mandates it for this action
    if (securityConfirmModal.requiresPassword) {
      if (securityConfirmModal.authMode === 'passcode') {
        // Mode 2: Verify and consume Time-Limited Access Passcode
        if (!securityConfirmModal.passcodeInput) {
          setSecurityConfirmModal(prev => ({ ...prev, passcodeError: 'Time-limited access passcode is required.' }));
          return;
        }

        setSecurityConfirmModal(prev => ({ ...prev, isExecuting: true, passcodeError: '' }));
        const check = dbAdmin.verifyTimeLimitedPasscode(securityConfirmModal.passcodeInput);
        
        if (!check.valid) {
          setSecurityConfirmModal(prev => ({
            ...prev,
            isExecuting: false,
            passcodeError: `Passcode Rejected: ${check.reason}. Please enter a valid, active passcode or use Master Key.`
          }));
          return;
        }

        // Consume the passcode for this action and log audit trail
        await dbAdmin.consumeTimeLimitedPasscode(
          securityConfirmModal.passcodeInput,
          securityConfirmModal.title,
          user?.name || 'Authorized Operator',
          user?.email || 'admin@nodevault.io'
        );
      } else {
        // Mode 1: Verify Master Administrator Password / Key
        if (!securityConfirmModal.passwordInput) {
          setSecurityConfirmModal(prev => ({ ...prev, passwordError: 'Administrator password is required by policy.' }));
          return;
        }

        setSecurityConfirmModal(prev => ({ ...prev, isExecuting: true, passwordError: '' }));
        const isValid = await passkeyAuth.verifyAdminPasskey(securityConfirmModal.passwordInput);
        
        if (!isValid) {
          setSecurityConfirmModal(prev => ({
            ...prev,
            isExecuting: false,
            passwordError: 'Access Denied: Invalid Master Security Key.'
          }));
          return;
        }
      }
    } else {
      setSecurityConfirmModal(prev => ({ ...prev, isExecuting: true, passwordError: '' }));
    }

    try {
      if (securityConfirmModal.onConfirm) {
        await securityConfirmModal.onConfirm();
      }
      setSecurityConfirmModal(prev => ({ ...prev, isOpen: false }));
      setActionSuccessToast(`✅ Action "${securityConfirmModal.title}" verified and executed successfully.`);
      setTimeout(() => setActionSuccessToast(''), 6000);
      await loadAdminData();
      if (refreshTiers) refreshTiers();
      if (refreshModules) refreshModules();
    } catch (err) {
      setSecurityConfirmModal(prev => ({
        ...prev,
        isExecuting: false,
        passwordError: `Action failed: ${err.message || 'Unknown error'}`
      }));
    }
  };

  // ════════════════════════════════════════════════════════════
  // PASSWORD SECURITY POLICY TOGGLE
  // ════════════════════════════════════════════════════════════
  const handleTogglePasswordPolicy = async (permKey, currentRequirement) => {
    const nextReq = !currentRequirement;
    const updated = await dbAdmin.togglePasswordPolicy(permKey, nextReq, user?.name, user?.email);
    setSecurityPolicies(updated);
    setActionSuccessToast(`🔐 Security Policy for "${permKey}" updated: Password ${nextReq ? 'ENFORCED' : 'NOT REQUIRED'}.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
    loadAdminData();
  };

  // ════════════════════════════════════════════════════════════
  // TIME-LIMITED PASSCODES ACTIONS
  // ════════════════════════════════════════════════════════════
  const handleOpenIssuePasscode = () => {
    setIssuePasscodeModal({
      isOpen: true,
      issuedTo: 'Chief Compliance Officer',
      roleId: 'compliance_officer',
      durationMinutes: 60,
      purpose: 'Temporary permission delegation for role & access reconfiguration',
    });
  };

  const handleCreatePasscode = async (e) => {
    e.preventDefault();
    const { issuedTo, roleId, durationMinutes, purpose } = issuePasscodeModal;
    setIssuePasscodeModal(prev => ({ ...prev, isOpen: false }));

    const created = await dbAdmin.issueTimeLimitedPasscode({
      issuedTo,
      roleId,
      durationMinutes: Number(durationMinutes),
      purpose,
      adminName: user?.name || 'Super Administrator',
      adminEmail: user?.email || 'admin@nodevault.io',
    });

    setActionSuccessToast(`⏳ Time-Limited Passcode "${created.code}" issued successfully! Valid for ${durationMinutes} minutes.`);
    setTimeout(() => setActionSuccessToast(''), 6000);
    loadAdminData();
  };

  const handleRevokePasscode = async (passcode) => {
    await dbAdmin.revokeTimeLimitedPasscode(passcode.id, user?.name || 'Admin', user?.email || 'admin@nodevault.io');
    setActionSuccessToast(`🚫 Passcode "${passcode.code}" has been administratively revoked.`);
    setTimeout(() => setActionSuccessToast(''), 4000);
    loadAdminData();
  };

  // ════════════════════════════════════════════════════════════
  // 1. TIERS ACTIONS
  // ════════════════════════════════════════════════════════════
  const handleOpenAddTier = () => {
    const nextId = tiersList.length > 0 ? Math.max(...tiersList.map(t => Number(t.id) || 0)) + 1 : 1;
    setTierModal({
      isOpen: true,
      isEdit: false,
      data: {
        id: nextId,
        label: `Tier ${nextId}`,
        name: `Node ${nextId}`,
        fee: 3000000,
        category: 'premium',
        maxPools: 1,
        color: '#00e5ff',
        disabled: false,
      }
    });
  };

  const handleOpenEditTier = (tier) => {
    setTierModal({
      isOpen: true,
      isEdit: true,
      data: { ...tier }
    });
  };

  const handleSubmitTierForm = (e) => {
    e.preventDefault();
    const { isEdit, data } = tierModal;
    setTierModal(prev => ({ ...prev, isOpen: false }));

    if (isEdit) {
      triggerSecurityAction({
        title: `CONFIRM: MODIFY TIER ${data.id}`,
        actionType: 'TIER_MODIFIED',
        permissionKey: 'tiers.write',
        target: `${data.label} (${data.name})`,
        exactChange: {
          'Target Tier': `${data.label}: ${data.name}`,
          'Staking Fee': `₦${Number(data.fee).toLocaleString()} NGN`,
          'Category': data.category,
          'Status': data.disabled ? 'Disabled (Hidden)' : 'Active (Available for staking)',
          'Max Pools': data.maxPools,
        },
        effectSummary: [
          'Parameters will take effect immediately across all protocol staking endpoints.',
          'Statutory 100% principal protection floor will adjust for subsequent validator positions.',
          'Change will be broadcast and permanently committed to the System Audit Log.',
        ],
        onConfirm: async () => {
          await dbAdmin.updateTier(data.id, data, user?.name, user?.email);
        }
      });
    } else {
      triggerSecurityAction({
        title: `CONFIRM: ADD NEW PROTOCOL TIER`,
        actionType: 'TIER_CREATED',
        permissionKey: 'tiers.create',
        target: `${data.label}: ${data.name}`,
        exactChange: {
          'New Tier ID': data.id,
          'Tier Label & Name': `${data.label} (${data.name})`,
          'Entry Staking Fee': `₦${Number(data.fee).toLocaleString()} NGN`,
          'Category Classification': data.category,
          'Capacity Max Pools': data.maxPools,
        },
        effectSummary: [
          'A brand-new validator tier will be established in the Genesis Launchpad.',
          'Statutory 100% principal protection guarantee will be assigned to this tier.',
          'Validators will be able to select, stake, and bind sub-nodes to this position.',
        ],
        onConfirm: async () => {
          await dbAdmin.addTier(data, user?.name, user?.email);
        }
      });
    }
  };

  const handleDeleteTier = (tier) => {
    triggerSecurityAction({
      title: `CONFIRM: PERMANENT TIER DELETION`,
      actionType: 'TIER_DELETED',
      permissionKey: 'tiers.delete',
      target: `${tier.label}: ${tier.name}`,
      exactChange: {
        'Action': 'Permanent Registry Deletion',
        'Target Tier': `${tier.label} (${tier.name})`,
        'Entry Fee': `₦${Number(tier.fee).toLocaleString()} NGN`,
        'Category': tier.category,
      },
      effectSummary: [
        'This tier will be completely purged from the Genesis Launchpad.',
        'No new validator positions can ever be initiated on this tier definition.',
        'Existing historical node records already running on this tier will be insulated until scheduled maturity.',
        'This destructive operation is irreversible and will be logged under your administrative credentials.',
      ],
      onConfirm: async () => {
        await dbAdmin.deleteTier(tier.id, user?.name, user?.email);
      }
    });
  };

  const handleToggleTierDisabled = (tier) => {
    const nextState = !tier.disabled;
    triggerSecurityAction({
      title: `CONFIRM: ${nextState ? 'DISABLE' : 'ENABLE'} TIER ${tier.id}`,
      actionType: 'TIER_STATUS_TOGGLE',
      permissionKey: 'tiers.toggle',
      target: `${tier.label}: ${tier.name}`,
      exactChange: {
        'Tier': `${tier.label} (${tier.name})`,
        'Current State': tier.disabled ? 'Disabled' : 'Active',
        'Target State': nextState ? 'Disabled (Staking Paused)' : 'Active (Staking Enabled)',
      },
      effectSummary: [
        nextState 
          ? 'Validators will be prevented from launching new nodes on this tier.' 
          : 'Validators will immediately be able to purchase and launch nodes on this tier.',
        'Action is audited and visible across all administrative nodes.',
      ],
      onConfirm: async () => {
        await dbAdmin.updateTier(tier.id, { disabled: nextState }, user?.name, user?.email);
      }
    });
  };

  // ════════════════════════════════════════════════════════════
  // 2. ROLES & GRANULAR SUB-PERMISSIONS ACTIONS (ALL ROLES EDITABLE)
  // ════════════════════════════════════════════════════════════
  const handleOpenCreateRole = () => {
    setRoleModal({
      isOpen: true,
      isEdit: false,
      data: {
        id: '',
        name: '',
        badge: '🛡️ Custom Officer',
        color: '#38bdf8',
        description: '',
        permissions: ['users.read'],
      }
    });
  };

  const handleOpenEditRole = (role) => {
    setRoleModal({
      isOpen: true,
      isEdit: true,
      data: { ...role, permissions: [...(role.permissions || [])] }
    });
  };

  const handleSubmitRoleForm = (e) => {
    e.preventDefault();
    const { isEdit, data } = roleModal;
    setRoleModal(prev => ({ ...prev, isOpen: false }));

    const isDelegating = data.permissions.includes('roles.delegate_permissions');

    triggerSecurityAction({
      title: isEdit ? `CONFIRM: MODIFY ROLE "${data.name}"` : `CONFIRM: CREATE NEW ROLE`,
      actionType: isEdit ? 'ROLE_MODIFIED' : 'ROLE_CREATED',
      permissionKey: isDelegating ? 'roles.delegate_permissions' : (isEdit ? 'roles.write' : 'roles.create'),
      target: data.name,
      exactChange: {
        'Role Title': data.name,
        'Badge Display': data.badge,
        'Granted Sub-Permissions': `${data.permissions.length} actions (${data.permissions.join(', ') || 'None'})`,
        'Includes Permission Delegation': isDelegating ? 'YES (roles.delegate_permissions)' : 'No',
        'Description': data.description,
      },
      effectSummary: [
        'Administrative capabilities will be updated for this role definition immediately.',
        isDelegating ? '⚠️ CRITICAL: Operators with this role can edit role permissions, subject to Admin Confirmation or Time-Limited Access Passcode.' : 'Validators or operators assigned this role will immediately inherit these platform permissions.',
        'Authorizing requires Master Password or a valid Time-Limited Access Passcode.',
        'Action will be permanently written to the System Audit Log.',
      ],
      onConfirm: async () => {
        if (isEdit) {
          await dbAdmin.updateRole(data.id, data, user?.name, user?.email);
        } else {
          await dbAdmin.createRole(data, user?.name, user?.email);
        }
      }
    });
  };

  const handleDeleteRole = (role) => {
    if (role.isSystem && role.id === 'super_admin') {
      alert('Root Super Administrator role cannot be deleted.');
      return;
    }
    triggerSecurityAction({
      title: `CONFIRM: DELETE ROLE "${role.name}"`,
      actionType: 'ROLE_DELETED',
      permissionKey: 'roles.delete',
      target: role.name,
      exactChange: {
        'Role Name': role.name,
        'Role ID': role.id,
        'Active Sub-Permissions': role.permissions.join(', '),
      },
      effectSummary: [
        'The role will be purged from the access control matrix.',
        'Any users currently holding this role will revert to standard validator permissions.',
      ],
      onConfirm: async () => {
        await dbAdmin.deleteRole(role.id, user?.name, user?.email);
      }
    });
  };

  const handleAssignUserRole = (targetUser, newRole) => {
    triggerSecurityAction({
      title: `CONFIRM: ELEVATE / ALTER USER ROLE`,
      actionType: 'USER_ROLE_ASSIGNED',
      permissionKey: 'roles.assign',
      target: `${targetUser.name || targetUser.email}`,
      exactChange: {
        'Validator': `${targetUser.name || targetUser.email} (${targetUser.id})`,
        'Previous Role': targetUser.role || 'user',
        'New Role Assignment': newRole,
      },
      effectSummary: [
        `Validator account will instantly inherit permissions granted to "${newRole}".`,
        'If elevated to admin or compliance officer, user gains access to the Admin Desk.',
        'Administrative session tokens and security hashes will rebind.',
      ],
      onConfirm: async () => {
        await dbAdmin.updateUserRole(targetUser.id, newRole);
        if (inspectUserModal.isOpen && inspectUserModal.user?.id === targetUser.id) {
          setInspectUserModal(prev => ({ ...prev, user: { ...prev.user, role: newRole } }));
        }
      }
    });
  };

  // ════════════════════════════════════════════════════════════
  // 3. PLATFORM CONTROLS ACTIONS
  // ════════════════════════════════════════════════════════════
  const handleToggleModule = (moduleItem) => {
    const nextEnabled = !moduleItem.enabled;
    const nextStatus = nextEnabled ? 'active' : 'paused';

    triggerSecurityAction({
      title: `CONFIRM: ${nextEnabled ? 'ENABLE' : 'DISABLE'} MODULE: ${moduleItem.name}`,
      actionType: 'MODULE_TOGGLED',
      permissionKey: 'modules.toggle',
      target: moduleItem.name,
      exactChange: {
        'Platform Module': moduleItem.name,
        'Current State': `${moduleItem.enabled ? 'Enabled' : 'Disabled'} (${moduleItem.status})`,
        'Target State': `${nextEnabled ? 'Enabled' : 'Disabled'} (${nextStatus})`,
      },
      effectSummary: [
        nextEnabled
          ? `Module "${moduleItem.name}" will be restored to full operational capacity across the platform.`
          : `Module "${moduleItem.name}" will immediately enter maintenance mode; user requests will be held in queue.`,
        'All client instances will reflect this protocol status in real time.',
        'Recorded in the immutable System Audit Log.',
      ],
      onConfirm: async () => {
        await dbAdmin.updatePlatformModule(moduleItem.id, { enabled: nextEnabled, status: nextStatus }, user?.name, user?.email);
      }
    });
  };

  const handleChangeModuleStatus = (moduleId, newStatus) => {
    const moduleItem = modulesList.find(m => m.id === moduleId);
    if (!moduleItem) return;

    triggerSecurityAction({
      title: `CONFIRM: CHANGE OPERATING MODE: ${moduleItem.name}`,
      actionType: 'MODULE_MODE_CHANGED',
      permissionKey: 'modules.configure',
      target: moduleItem.name,
      exactChange: {
        'Module': moduleItem.name,
        'Previous Mode': moduleItem.status,
        'New Operational Mode': newStatus,
        'Enabled Flag': newStatus !== 'disabled',
      },
      effectSummary: [
        `Module behavior updated to mode "${newStatus}".`,
        newStatus === 'maintenance' ? 'A public maintenance banner will be displayed to users.' : 'Live platform execution updated.',
      ],
      onConfirm: async () => {
        await dbAdmin.updatePlatformModule(moduleId, { status: newStatus, enabled: newStatus !== 'disabled' }, user?.name, user?.email);
      }
    });
  };

  // ════════════════════════════════════════════════════════════
  // 4. POINT & BALANCE ALLOCATION ACTIONS
  // ════════════════════════════════════════════════════════════
  const handleOpenAssignPoints = (targetUser) => {
    setPointsModal({
      isOpen: true,
      user: targetUser,
      amount: 250,
      unit: 'NVT',
      reason: 'Administrative Community Allocation',
    });
  };

  const handleSubmitPointsAllocation = (e) => {
    e.preventDefault();
    const { user: targetUser, amount, unit, reason } = pointsModal;
    const num = Number(amount);
    if (isNaN(num) || num === 0) return;
    setPointsModal(prev => ({ ...prev, isOpen: false }));

    const parityNaira = unit === 'NGN' ? Math.abs(num) : Math.abs(num) * 10;

    triggerSecurityAction({
      title: `CONFIRM: ${num > 0 ? 'CREDIT' : 'DEBIT'} ${Math.abs(num)} ${unit}`,
      actionType: 'POINTS_ALLOCATION',
      permissionKey: 'users.points',
      target: `${targetUser.name || targetUser.email}`,
      exactChange: {
        'Beneficiary': `${targetUser.name || targetUser.email} (${targetUser.id})`,
        'Ledger Unit': unit,
        'Adjustment Amount': `${num > 0 ? '+' : ''}${num} ${unit}`,
        'Parity NGN Value': `₦${parityNaira.toLocaleString()} NGN (1 NVT = ₦10.00)`,
        'Compliance Memo': reason || 'Administrative Allocation',
      },
      effectSummary: [
        `Beneficiary's ${unit === 'NGN' ? 'Available Wallet' : 'Referral NVT Balance'} will immediately update by ${num > 0 ? '+' : ''}${num} ${unit}.`,
        'A formal ledger credit/debit transaction will be logged permanently in user history.',
        'Action is cryptographically audited and recorded under your administrator ID.',
      ],
      onConfirm: async () => {
        await dbAdmin.assignPointsToUser(targetUser.id, {
          amount: num,
          unit,
          reason,
          adminName: user?.name || 'Admin',
          adminEmail: user?.email || 'admin@nodevault.io'
        });
      }
    });
  };

  // ════════════════════════════════════════════════════════════
  // 5. USER INSPECTOR & ACCOUNT FREEZE
  // ════════════════════════════════════════════════════════════
  const handleInspectUser = async (targetUser) => {
    setInspectUserModal({
      isOpen: true,
      user: targetUser,
      activeTab: 'profile',
    });
  };

  const handleToggleFreezeUser = (targetUser) => {
    const nextState = !targetUser.isFrozen;
    triggerSecurityAction({
      title: `CONFIRM: ${nextState ? 'FREEZE' : 'UNFREEZE'} VALIDATOR ACCOUNT`,
      actionType: 'USER_FREEZE_TOGGLE',
      permissionKey: 'users.freeze',
      target: `${targetUser.name || targetUser.email}`,
      exactChange: {
        'Target Validator': `${targetUser.name || targetUser.email} (${targetUser.id})`,
        'Current State': targetUser.isFrozen ? 'Frozen / Suspended' : 'Active',
        'New State': nextState ? 'Frozen / Suspended' : 'Active',
      },
      effectSummary: [
        nextState
          ? 'Validator will be blocked from staking nodes, submitting withdrawal requests, and claiming referral yields.'
          : 'Validator restrictions lifted; full operational privileges restored.',
        'High-security administrative action recorded in System Audit Log.',
      ],
      onConfirm: async () => {
        await dbAdmin.toggleUserFreeze(targetUser.id, user?.name, user?.email);
        if (inspectUserModal.isOpen && inspectUserModal.user?.id === targetUser.id) {
          setInspectUserModal(prev => ({ ...prev, user: { ...prev.user, isFrozen: nextState } }));
        }
      }
    });
  };

  // ════════════════════════════════════════════════════════════
  // 6. KYC & AUDIT QUEUE ACTIONS
  // ════════════════════════════════════════════════════════════
  const handleApproveKYC = (userId) => {
    const targetUser = usersList.find(u => u.id === userId);
    triggerSecurityAction({
      title: `CONFIRM: APPROVE KYC IDENTITY VERIFICATION`,
      actionType: 'KYC_APPROVED',
      permissionKey: 'kyc.approve',
      target: targetUser?.name || userId,
      exactChange: {
        'Validator': `${targetUser?.name || targetUser?.email || userId}`,
        'Verification Status': 'Verified ✓ (Tier 1 Government NIN/Passport Cleared)',
      },
      effectSummary: [
        'Validator staking capacity will unlock to highest limits.',
        'Automated NIBSS/NIP commercial bank payouts will be unlocked for this validator.',
      ],
      onConfirm: async () => {
        await dbAdmin.updateKycStatus(userId, 'verified');
      }
    });
  };

  const handleOpenRejectKYC = (u) => {
    setRejectModal({ type: 'kyc', id: u.id, name: u.name || u.email });
    setRejectionReason('ID document unclear or expired. Please upload a valid government NIN or passport.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    if (rejectModal.type === 'kyc') {
      await dbAdmin.updateKycStatus(rejectModal.id, 'rejected', rejectionReason);
    } else if (rejectModal.type === 'refund') {
      await dbRefunds.updateStatus(rejectModal.id, 'rejected', rejectionReason);
    }
    setRejectModal(null);
    setRejectionReason('');
    await loadAdminData();
  };

  const handleClearAudit = async (refundId) => {
    const req = refundsList.find(r => r.id === refundId);
    triggerSecurityAction({
      title: `CONFIRM: CLEAR HIGH-VALUE WITHDRAWAL AUDIT`,
      actionType: 'REFUND_AUDIT_CLEARED',
      permissionKey: 'payouts.clear_audit',
      target: `Claim ${refundId}`,
      exactChange: {
        'Beneficiary': req?.userName || 'Validator',
        'Net Payout Amount': `₦${Number(req?.netPayout || 0).toLocaleString()} NGN`,
        'Settlement Route': 'Automated NIBSS NIP Commercial Settlement',
      },
      effectSummary: [
        'Multi-signature compliance and AML fraud screening cleared.',
        'Transaction queued for direct commercial bank disbursement.',
      ],
      onConfirm: async () => {
        await dbRefunds.updateStatus(refundId, 'cleared', 'Multi-signature compliance audit passed and cleared for disbursement.');
      }
    });
  };

  const handleDisburseRefund = async (refundId) => {
    const req = refundsList.find(r => r.id === refundId);
    triggerSecurityAction({
      title: `CONFIRM: EXECUTE NIP BANK DISBURSEMENT`,
      actionType: 'REFUND_DISBURSED',
      permissionKey: 'payouts.disburse',
      target: `Claim ${refundId}`,
      exactChange: {
        'Beneficiary Name': req?.userName || 'Validator',
        'Bank Account': `${req?.bankName || 'Access Bank'} · ${req?.accountNumber || '0123456789'}`,
        'Total Disbursed': `₦${Number(req?.netPayout || 0).toLocaleString()} NGN`,
      },
      effectSummary: [
        'Funds will be transferred from NodeVault Custody Escrow to beneficiary account.',
        'Principal position will be settled and archived in commercial clearing registry.',
      ],
      onConfirm: async () => {
        await dbRefunds.updateStatus(refundId, 'disbursed', 'Disbursement transferred to beneficiary bank account via NIP gateway.');
      }
    });
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    const res = await dbConnection.testConnection();
    setDbTestResult(res);
    setTestingDb(false);
    refreshDbStatus();
  };

  // Export Audit Logs as JSON
  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nodevault_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.name?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.phone?.includes(q)) ||
      (u.referralCode?.toLowerCase().includes(q)) ||
      (u.tierName?.toLowerCase().includes(q));

    if (userRoleFilter === 'admin') return matchesSearch && (u.role === 'admin' || u.email?.includes('admin'));
    if (userRoleFilter === 'kyc_pending') return matchesSearch && u.kycStatus === 'pending';
    if (userRoleFilter === 'kyc_verified') return matchesSearch && u.kycStatus === 'verified';
    if (userRoleFilter === 'frozen') return matchesSearch && Boolean(u.isFrozen);
    return matchesSearch;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesCategory = auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
    const q = auditSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      log.action?.toLowerCase().includes(q) ||
      log.target?.toLowerCase().includes(q) ||
      log.adminName?.toLowerCase().includes(q) ||
      log.adminEmail?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Filtered Policies for Password Matrix
  const filteredPolicyGroups = PERMISSION_GROUPS.filter(g => {
    if (policyGroupFilter !== 'all' && g.groupId !== policyGroupFilter) return false;
    if (!policySearchQuery) return true;
    const q = policySearchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.permissions.some(p => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  });

  const creds = dbConnection.getConfig();

  // ════════════════════════════════════════════════════════════
  // 1. ACCESS GATE SCREEN (If unauthorized session)
  // ════════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="container admin-auth-screen">
          <div className="admin-auth-card">
            <div className="admin-auth-icon">🛡️</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
              NodeVault Super Admin
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Restricted Area. Multi-signature treasury, compliance audit clearance, granular permissions, and database infrastructure require administrator access.
            </p>

            <form onSubmit={handlePasskeySubmit} style={{ marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                  Master Security Key
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter Master Security Key (e.g. admin123)..."
                  value={passkeyInput}
                  onChange={e => setPasskeyInput(e.target.value)}
                  style={{ marginTop: '0.35rem', borderColor: passkeyError ? '#ef4444' : undefined }}
                />
                {passkeyError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                    {passkeyError}
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Authenticate Access →
              </button>
            </form>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-full btn-sm"
                onClick={handleQuickAdminLogin}
                style={{ color: '#facc15', borderColor: 'rgba(250,204,21,0.3)' }}
              >
                Sign In as Chief Compliance Officer
              </button>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/dashboard" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                ← Return to User Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // 2. AUTHENTICATED SUPER ADMIN DESK
  // ════════════════════════════════════════════════════════════
  return (
    <div className="admin-page">
      <div className="container">

        {/* Global Action Toast */}
        {actionSuccessToast && (
          <div style={{
            background: 'rgba(0, 255, 148, 0.15)',
            border: '1px solid #00ff94',
            borderRadius: 12,
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            color: '#00ff94',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(0, 255, 148, 0.2)'
          }}>
            <span>{actionSuccessToast}</span>
            <button
              onClick={() => setActionSuccessToast('')}
              style={{ background: 'transparent', border: 'none', color: '#00ff94', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-title-row">
            <div className="admin-badge-icon">🛡️</div>
            <div>
              <h1 className="admin-title">Protocol Administration</h1>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Compliance Desk • Multi-Sig Treasury • Fully Editable Permissions • Time-Limited Access Passcodes
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadAdminData} disabled={loading}>
              {loading ? 'Refreshing...' : '↻ Refresh Data'}
            </button>
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              User Dashboard
            </Link>
          </div>
        </div>

        {/* 10 Navigation Tabs */}
        <div className="admin-nav-tabs" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>⚡ Overview</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span>👥 Validators ({usersList.length})</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiers')}
          >
            <span>🏷️ Tiers ({tiersList.length})</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <span>🛡️ Roles & Permissions</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <span>⚙️ Platform Controls</span>
            <span className="admin-tab-pill" style={{ background: '#00ff94', color: '#000' }}>
              6/6
            </span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'kyc_desk' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc_desk')}
          >
            <span>🪪 KYC Desk</span>
            {metrics?.pendingKycs > 0 && (
              <span className="admin-tab-pill" style={{ background: '#facc15', color: '#000' }}>
                {metrics.pendingKycs}
              </span>
            )}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'audit_queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit_queue')}
          >
            <span>⚖️ Withdrawal Audit</span>
            {metrics?.pendingAudits > 0 && (
              <span className="admin-tab-pill" style={{ background: '#ef4444', color: '#fff' }}>
                {metrics.pendingAudits}
              </span>
            )}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'audit_logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit_logs')}
          >
            <span>📜 Audit Logs</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'sovereign_rates' ? 'active' : ''}`}
            onClick={() => setActiveTab('sovereign_rates')}
          >
            <span>📈 Sovereign Yields</span>
            <span className="admin-tab-pill" style={{ background: 'var(--accent-green)', color: '#000' }}>
              {sovereignRate?.customerAPY || '12.7'}%
            </span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'database_vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('database_vault')}
          >
            <span>🗄️ Database Vault</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════
            TAB 1: EXECUTIVE OVERVIEW & ACTION TRACKER
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Registered Validators</div>
                <div className="admin-kpi-val" style={{ color: 'var(--accent-cyan)' }}>
                  {metrics?.totalUsers || usersList.length}
                </div>
                <div className="admin-kpi-sub">Across Nigeria Genesis Launchpad</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Total Staked Capital</div>
                <div className="admin-kpi-val" style={{ color: 'var(--accent-green)' }}>
                  {formatNaira(metrics?.totalStaked || 0)}
                </div>
                <div className="admin-kpi-sub">100% Principal Protection Floor</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Cumulative Yields Paid</div>
                <div className="admin-kpi-val" style={{ color: '#00ff94' }}>
                  {formatNaira(metrics?.totalYieldPaid || 0)}
                </div>
                <div className="admin-kpi-sub">Daily Compounded APY Distributions</div>
              </div>

              <div className="admin-kpi-card highlight">
                <div className="admin-kpi-label">Pending KYC Verifications</div>
                <div className="admin-kpi-val" style={{ color: '#facc15' }}>
                  {metrics?.pendingKycs || 0}
                </div>
                <div className="admin-kpi-sub">NIN / BVN Submissions Awaiting Audit</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Active Time Passcodes</div>
                <div className="admin-kpi-val" style={{ color: 'var(--accent-cyan)' }}>
                  {timeLimitedPasscodes.filter(p => p.status === 'active').length}
                </div>
                <div className="admin-kpi-sub">Delegated Temporary Access Codes</div>
              </div>

              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Password Policy Rules</div>
                <div className="admin-kpi-val" style={{ color: '#f87171' }}>
                  {Object.values(securityPolicies).filter(Boolean).length} / {ALL_SUB_PERMISSION_KEYS.length}
                </div>
                <div className="admin-kpi-sub">Actions Requiring Master Password</div>
              </div>
            </div>

            {/* General Action Tracker / Recent Audit Feed */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3 className="admin-card-title">📡 Live System Action Tracker</h3>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Real-time telemetry of administrator operations, policy modifications and security dispatches
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('audit_logs')}>
                  View Full Audit Log Desk →
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin Operator</th>
                      <th>Category</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                      <th>Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 6).map(log => (
                      <tr key={log.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td>
                          <strong>{log.adminName}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.adminEmail}</div>
                        </td>
                        <td>
                          <span className="audit-pill" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)' }}>
                            {log.category}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                          {log.action}
                        </td>
                        <td style={{ color: 'var(--accent-cyan)' }}>{log.target}</td>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: 300 }}>{log.details}</td>
                        <td>
                          <span className={`audit-impact ${log.impact.toLowerCase()}`}>
                            {log.impact}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Control Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: 14, padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--accent-cyan)' }}>🛡️ Roles & Delegated Passcodes</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  All 32 permissions are editable across all roles. Issue time-limited access passcodes for temporary delegation.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTab('roles'); setRolesSubTab('roles'); }}>
                    Roles ({rolesList.length})
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('roles'); setRolesSubTab('passcodes'); }}>
                    ⏳ Passcodes ({timeLimitedPasscodes.filter(p => p.status === 'active').length})
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.2)', borderRadius: 14, padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#facc15' }}>⚙️ Platform Controls</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Feature switches for KYC Verification, Payouts, Claims, Dividends, Network, and Mining.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('modules')}>
                  Configure 6 Core Switches →
                </button>
              </div>

              <div style={{ background: 'rgba(0, 255, 148, 0.05)', border: '1px solid rgba(0, 255, 148, 0.2)', borderRadius: 14, padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#00ff94' }}>📈 Sovereign APY Rate</h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  CBN 364D Treasury Bill stop rate benchmark currently generating {sovereignRate?.customerAPY || '12.7'}% net APY.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('sovereign_rates')}>
                  Open Yield Desk →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 2: VALIDATORS & USER MANAGEMENT
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">👥 Registered Validators & Accounts</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Inspect complete 360° validator records, allocate NVT points, assign administrative roles, or toggle freezes
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="🔍 Search name, email, phone, code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: 260, fontSize: '0.82rem' }}
                />
                <select
                  className="input"
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="admin">Administrators Only</option>
                  <option value="kyc_verified">KYC Verified</option>
                  <option value="kyc_pending">KYC Pending</option>
                  <option value="frozen">Frozen Accounts</option>
                </select>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Validator Profile</th>
                    <th>Role & Status</th>
                    <th>Staked Tier & Capital</th>
                    <th>Balances (NGN / NVT)</th>
                    <th>KYC Clearance</th>
                    <th>Account Health</th>
                    <th>Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ background: u.isFrozen ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid rgba(0, 229, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            fontSize: '0.85rem'
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div>
                            <strong>{u.name || 'Unnamed Validator'}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{u.email}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Code: {u.referralCode || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: u.role === 'admin' ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.06)',
                          color: u.role === 'admin' ? '#facc15' : '#94a3b8'
                        }}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#fff' }}>{u.tierName || 'Micro Node'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>
                          {formatNaira(u.entryFee || 1000)}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{u.subNodes || 0} sub-nodes</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                          ₦{Number(u.walletBalance || 0).toLocaleString()} NGN
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                          {(Number(u.referralBalance) || Number(u.points) || 0).toFixed(2)} NVT
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.kycStatus === 'verified' ? 'badge-green' : u.kycStatus === 'rejected' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.72rem' }}>
                          {u.kycStatus ? u.kycStatus.toUpperCase() : 'PENDING'}
                        </span>
                      </td>
                      <td>
                        {u.isFrozen ? (
                          <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                            ❄️ FROZEN
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#00ff94', fontWeight: 700 }}>
                            ✓ Active
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => handleInspectUser(u)}
                            title="Inspect full 360° record"
                          >
                            🔍 Inspect
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: '#00ff94', borderColor: 'rgba(0, 255, 148, 0.3)' }}
                            onClick={() => handleOpenAssignPoints(u)}
                            title="Assign Points / NVT"
                          >
                            ⚡ Points
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: u.isFrozen ? '#00ff94' : '#f87171' }}
                            onClick={() => handleToggleFreezeUser(u)}
                            title={u.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                          >
                            {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 3: TIERS MANAGEMENT (Add, Edit, Delete, Toggle)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'tiers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🏷️ Protocol Tier Definitions</h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Manage the 15 validator tiers, configure entry staking fees, statutory 100% principal return floors, and launch capacity
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddTier}>
                + Add New Protocol Tier
              </button>
            </div>

            <div className="tiers-admin-grid">
              {tiersList.map(tier => (
                <div key={tier.id} className="tier-admin-card" style={{ borderColor: tier.disabled ? 'rgba(239, 68, 68, 0.3)' : undefined }}>
                  <div className="tier-admin-top">
                    <span className="tier-badge-pill" style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}>
                      {tier.label}
                    </span>
                    <span className="badge" style={{ background: tier.disabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 255, 148, 0.15)', color: tier.disabled ? '#ef4444' : '#00ff94', fontSize: '0.7rem' }}>
                      {tier.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#fff' }}>{tier.name}</h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                    Category: <strong>{tier.category}</strong> • Max Pools: <strong>{tier.maxPools}</strong>
                  </div>

                  <div className="tier-fee-val" style={{ color: tier.color }}>
                    ₦{Number(tier.fee).toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>NGN</span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.5 }}>
                    <div>🛡️ <strong>100% Floor:</strong> ₦{Number(tier.fee).toLocaleString()}</div>
                    <div>🏛️ <strong>Protocol Margin:</strong> ₦{(tier.fee * 0.2284).toLocaleString()}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem' }}
                      onClick={() => handleOpenEditTier(tier)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', color: tier.disabled ? '#00ff94' : '#facc15' }}
                      onClick={() => handleToggleTierDisabled(tier)}
                    >
                      {tier.disabled ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => handleDeleteTier(tier)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 4: ROLES & PERMISSIONS & TIME-LIMITED ACCESS PASSCODES
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'roles' && (
          <div>
            {/* Sub-navigation bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  className={`admin-tab-btn ${rolesSubTab === 'roles' ? 'active' : ''}`}
                  onClick={() => setRolesSubTab('roles')}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  🛡️ Role Configurations ({rolesList.length})
                </button>
                <button
                  className={`admin-tab-btn ${rolesSubTab === 'passcodes' ? 'active' : ''}`}
                  onClick={() => setRolesSubTab('passcodes')}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  ⏳ Time-Limited Passcodes ({timeLimitedPasscodes.filter(p => p.status === 'active').length} Active)
                </button>
                <button
                  className={`admin-tab-btn ${rolesSubTab === 'policies' ? 'active' : ''}`}
                  onClick={() => setRolesSubTab('policies')}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  🔑 Action Password Rules ({Object.values(securityPolicies).filter(Boolean).length}/{ALL_SUB_PERMISSION_KEYS.length} Enforced)
                </button>
              </div>

              {rolesSubTab === 'roles' && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenCreateRole}>
                  + Create Custom Role
                </button>
              )}

              {rolesSubTab === 'passcodes' && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenIssuePasscode}>
                  + Issue Time-Limited Passcode
                </button>
              )}
            </div>

            {/* Sub-view 1: Role Definitions (ALL ROLES EDITABLE) */}
            {rolesSubTab === 'roles' && (
              <div className="roles-grid">
                {rolesList.map(role => {
                  const grantedCount = ALL_SUB_PERMISSION_KEYS.filter(k => hasSubPermission(role, k)).length;
                  const canDelegate = hasSubPermission(role, 'roles.delegate_permissions');

                  return (
                    <div key={role.id} className="role-card">
                      <div className="role-card-header">
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{role.name}</h4>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            ID: <code style={{ color: 'var(--accent-cyan)' }}>{role.id}</code>
                            {role.isSystem && <span style={{ marginLeft: 6, color: '#facc15', fontWeight: 700 }}>• SYSTEM (EDITABLE)</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 8, background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}44`, fontWeight: 700 }}>
                          {role.badge}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, minHeight: '2.5rem' }}>
                        {role.description}
                      </p>

                      {/* Delegation power banner */}
                      {canDelegate && (
                        <div style={{
                          background: 'rgba(250, 204, 21, 0.08)',
                          border: '1px solid rgba(250, 204, 21, 0.25)',
                          borderRadius: 8,
                          padding: '0.45rem 0.65rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.72rem',
                          color: '#facc15',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span>⚡</span>
                          <span><strong>Permission Delegation Power:</strong> Can edit role permissions with Admin Confirmation or Time-Limited Passcode.</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                          Sub-Permissions:
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {grantedCount} / {ALL_SUB_PERMISSION_KEYS.length} Granted
                        </span>
                      </div>

                      {/* Android-style summary badge bar */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.65rem 0 1rem' }}>
                        <span className="perm-type-badge read">READ</span>
                        <span className="perm-type-badge write">WRITE</span>
                        <span className="perm-type-badge create">CREATE</span>
                        <span className="perm-type-badge delete">DELETE</span>
                        <span className="perm-type-badge manage">MANAGE</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.75rem' }}
                          onClick={() => setViewRoleFullModal({ isOpen: true, role, searchQuery: '', filterType: 'all' })}
                        >
                          👁️ View in Full ({grantedCount})
                        </button>

                        {/* ALL ROLES ARE EDITABLE BY ADMIN */}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}
                          onClick={() => handleOpenEditRole(role)}
                        >
                          ✏️ Edit Permissions
                        </button>

                        {!role.isSystem && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', color: '#ef4444' }}
                            onClick={() => handleDeleteRole(role)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-view 2: Time-Limited Access Passcodes Desk */}
            {rolesSubTab === 'passcodes' && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3 className="admin-card-title">⏳ Time-Limited Access Passcodes Desk</h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Issue ephemeral, time-expiring authorization tokens to grant temporary permission-editing power. Every issue and consumption is recorded in the Audit Log.
                    </div>
                  </div>

                  <button className="btn btn-primary btn-sm" onClick={handleOpenIssuePasscode}>
                    + Issue New Passcode
                  </button>
                </div>

                <div className="passcodes-grid">
                  {timeLimitedPasscodes.map(p => {
                    const isStillActive = p.status === 'active' && new Date(p.expiresAt).getTime() > Date.now();
                    const remainingMs = Math.max(0, new Date(p.expiresAt).getTime() - Date.now());
                    const remainingMins = Math.floor(remainingMs / 60000);
                    const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

                    return (
                      <div key={p.id} className={`passcode-card ${isStillActive ? 'active' : 'expired'}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span className={`passcode-status-pill ${isStillActive ? 'active' : p.status}`}>
                            {isStillActive ? 'ACTIVE TOKEN' : p.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {p.durationMinutes}m Window
                          </span>
                        </div>

                        <div style={{ marginBottom: '0.85rem' }}>
                          <span className="passcode-code-badge">
                            {p.code}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginLeft: '0.5rem', padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}
                            onClick={() => {
                              navigator.clipboard.writeText(p.code);
                              setActionSuccessToast(`📋 Passcode "${p.code}" copied to clipboard!`);
                              setTimeout(() => setActionSuccessToast(''), 3000);
                            }}
                          >
                            📋 Copy
                          </button>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          <div><strong>Issued To:</strong> {p.issuedTo} (Role: <code style={{ color: 'var(--accent-cyan)' }}>{p.roleId}</code>)</div>
                          <div><strong>Purpose:</strong> {p.purpose}</div>
                          <div><strong>Issued By:</strong> {p.issuedBy}</div>
                        </div>

                        {/* Live Timer or State */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 8,
                          fontSize: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <span style={{ color: '#94a3b8' }}>Time Remaining:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isStillActive ? '#00ff94' : '#ef4444' }}>
                            {isStillActive ? `${remainingMins}m ${remainingSecs}s` : 'Expired / Closed'}
                          </span>
                        </div>

                        {isStillActive && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.72rem' }}
                              onClick={() => handleRevokePasscode(p)}
                            >
                              🚫 Revoke Passcode
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-view 3: Action Password Rules Matrix */}
            {rolesSubTab === 'policies' && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3 className="admin-card-title">🔑 Action Password Verification Policies</h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Configure whether each specific sub-permission requires Administrator Master Password entry or allows instant execution
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="🔍 Search permission, key, or category..."
                      value={policySearchQuery}
                      onChange={e => setPolicySearchQuery(e.target.value)}
                      style={{ width: 220, fontSize: '0.8rem' }}
                    />
                    <select
                      className="input"
                      value={policyGroupFilter}
                      onChange={e => setPolicyGroupFilter(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <option value="all">All 9 Domains</option>
                      {PERMISSION_GROUPS.map(g => (
                        <option key={g.groupId} value={g.groupId}>{g.icon} {g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredPolicyGroups.map(group => (
                  <div key={group.groupId} className="perm-group-card">
                    <div className="perm-group-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{group.icon}</span>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{group.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{group.description}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {group.permissions.length} Sub-Permissions
                      </span>
                    </div>

                    <div>
                      {group.permissions.map(perm => {
                        const isEnforced = Boolean(securityPolicies[perm.key]);
                        return (
                          <div key={perm.key} className="perm-item-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                              <span className={`perm-type-badge ${perm.type}`}>
                                {perm.type}
                              </span>
                              <div>
                                <div style={{ fontWeight: 700, color: '#fff' }}>{perm.label}</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  <code style={{ color: 'var(--accent-cyan)' }}>{perm.key}</code> • {perm.desc}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <button
                                className={`password-policy-btn ${isEnforced ? 'required' : 'fast'}`}
                                onClick={() => handleTogglePasswordPolicy(perm.key, isEnforced)}
                                title="Click to toggle whether this action requires master password"
                              >
                                {isEnforced ? '🔑 Master Password Required' : '⚡ Fast Execution (No Password)'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 5: PLATFORM CONTROLS (KYC, PAYOUTS, CLAIMS, MINING, ETC.)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'modules' && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>⚙️ Platform Control Switches & Feature Flags</h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Toggle core platform modules, initiate maintenance lockdowns, or isolate financial subsystems. All modifications obey password policies.
              </div>
            </div>

            <div className="module-grid">
              {modulesList.map(mod => {
                const getIcon = (id) => {
                  switch (id) {
                    case 'kyc_verification': return '🪪';
                    case 'payouts_bank': return '🏦';
                    case 'capital_refund': return '🛡️';
                    case 'dividends_payout': return '💰';
                    case 'subnode_network': return '🌐';
                    case 'node_mining': return '⛏️';
                    default: return '⚡';
                  }
                };

                return (
                  <div key={mod.id} className={`module-card ${!mod.enabled ? 'disabled' : ''}`}>
                    <div className="module-header">
                      <div className="module-title-box">
                        <span className="module-icon">{getIcon(mod.id)}</span>
                        <h4 className="module-name">{mod.name}</h4>
                      </div>
                      <span className={`module-badge ${mod.status}`}>
                        {mod.status}
                      </span>
                    </div>

                    <p className="module-desc">{mod.description}</p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                      <select
                        className="input"
                        value={mod.status}
                        onChange={(e) => handleChangeModuleStatus(mod.id, e.target.value)}
                        style={{ fontSize: '0.78rem', flex: 1 }}
                      >
                        <option value="active">✓ Live / Active</option>
                        <option value="maintenance">⚠️ Maintenance Mode</option>
                        <option value="paused">🚫 Paused / Disabled</option>
                      </select>

                      <button
                        className="btn btn-sm"
                        style={{
                          background: mod.enabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 148, 0.2)',
                          color: mod.enabled ? '#ef4444' : '#00ff94',
                          border: `1px solid ${mod.enabled ? '#ef4444' : '#00ff94'}`,
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                        onClick={() => handleToggleModule(mod)}
                      >
                        {mod.enabled ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>

                    <div className="module-footer">
                      <span>Updated by: {mod.updatedBy || 'Super Admin'}</span>
                      <span>{new Date(mod.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 6: KYC REVIEW DESK
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'kyc_desk' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">🪪 KYC Identity Verification Desk</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Review and verify uploaded Nigerian NIN, International Passports, and Driver's Licenses
                </div>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Validator</th>
                    <th>Document Type</th>
                    <th>Document ID / Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name || 'Unnamed Validator'}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{u.email}</div>
                      </td>
                      <td>National Identity Number (NIN)</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>28491048291</td>
                      <td>
                        <span className={`badge ${u.kycStatus === 'verified' ? 'badge-green' : u.kycStatus === 'rejected' ? 'badge-red' : 'badge-amber'}`}>
                          {u.kycStatus ? u.kycStatus.toUpperCase() : 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#00ff94', borderColor: 'rgba(0,255,148,0.3)' }}
                            onClick={() => handleApproveKYC(u.id)}
                            disabled={u.kycStatus === 'verified'}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                            onClick={() => handleOpenRejectKYC(u)}
                            disabled={u.kycStatus === 'rejected'}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 7: WITHDRAWAL & AUDIT QUEUE
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit_queue' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">⚖️ High-Value Withdrawal & Refund Audit</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Statutory multi-signature compliance clearance for capital claims &gt; ₦2,500,000 NGN
                </div>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Validator</th>
                    <th>Claim Amount</th>
                    <th>Audit Status</th>
                    <th>Bank Details</th>
                    <th>Clearance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {refundsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No pending withdrawal audits in queue.
                      </td>
                    </tr>
                  ) : (
                    refundsList.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                          {req.id}
                        </td>
                        <td>
                          <strong>{req.userName || 'Validator'}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{req.tierName || 'Node'}</div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent-green)' }}>
                            ₦{Number(req.netPayout || req.stakedAmount || 0).toLocaleString()} NGN
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${req.status === 'disbursed' ? 'badge-green' : req.status === 'cleared' ? 'badge-cyan' : 'badge-amber'}`}>
                            {req.status ? req.status.toUpperCase() : 'PENDING AUDIT'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem' }}>
                          <div>{req.bankName || 'Access Bank'}</div>
                          <div style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{req.accountNumber || '0123456789'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {req.status !== 'cleared' && req.status !== 'disbursed' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: 'var(--accent-cyan)' }}
                                onClick={() => handleClearAudit(req.id)}
                              >
                                ✓ Clear Audit
                              </button>
                            )}
                            {req.status === 'cleared' && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ background: '#00ff94', color: '#000', fontWeight: 700 }}
                                onClick={() => handleDisburseRefund(req.id)}
                              >
                                💸 Disburse NIP
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 8: SYSTEM AUDIT LOGS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit_logs' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">📜 Immutable System Audit Logs</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Tamper-proof record of all administrator actions, balance allocations, module toggles, and security policy modifications
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="🔍 Search action, admin, target..."
                  value={auditSearchQuery}
                  onChange={e => setAuditSearchQuery(e.target.value)}
                  style={{ width: 220, fontSize: '0.8rem' }}
                />
                <select
                  className="input"
                  value={auditCategoryFilter}
                  onChange={e => setAuditCategoryFilter(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <option value="all">All Categories</option>
                  <option value="TIER">Tiers</option>
                  <option value="ROLE">Roles</option>
                  <option value="MODULE">Modules</option>
                  <option value="POINTS">Points & Balances</option>
                  <option value="USER">Users</option>
                  <option value="KYC">KYC</option>
                  <option value="PAYOUT">Payouts</option>
                  <option value="SOVEREIGN_RATE">Sovereign Rate</option>
                  <option value="SECURITY">Security & Passcodes</option>
                </select>
                <button className="btn btn-secondary btn-sm" onClick={handleExportAuditLogs}>
                  📥 Export JSON
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Log ID & Time</th>
                    <th>Admin Operator</th>
                    <th>Category</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Exact Details & Change</th>
                    <th>Impact Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                          {log.id}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <strong>{log.adminName}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.adminEmail}</div>
                      </td>
                      <td>
                        <span className="audit-pill" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                        {log.action}
                      </td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{log.target}</td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1', maxWidth: 350, lineHeight: 1.45 }}>
                        {log.details}
                      </td>
                      <td>
                        <span className={`audit-impact ${log.impact.toLowerCase()}`}>
                          {log.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 9: SOVEREIGN YIELD DESK
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'sovereign_rates' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">📈 Sovereign Yield Benchmark Desk</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  CBN & Debt Management Office (DMO) 364-Day Nigerian Treasury Bills rate engine
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Auction Reference Code
                </label>
                <input
                  type="text"
                  className="input"
                  value={draftAuctionCode}
                  onChange={(e) => setDraftAuctionCode(e.target.value)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  CBN 364-Day Stop Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={draftStopRate}
                  onChange={(e) => setDraftStopRate(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Protocol Management Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={draftFee}
                  onChange={(e) => setDraftFee(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Fee Deduction Methodology
                </label>
                <select
                  className="input"
                  value={draftModel}
                  onChange={(e) => setDraftModel(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="REAL_YIELD_MINUS_FEE">Option A: Fee off Real Yield (Recommended)</option>
                  <option value="DISCOUNT_SPREAD">Option B: Fee off Discount Rate</option>
                </select>
              </div>
            </div>

            {/* Calculations Preview */}
            {(() => {
              const previewRealYield = calculateNTBRealYield(draftStopRate, 364);
              const previewCustomerAPY = calculateCustomerAPY(draftStopRate, draftFee, draftModel, 364);

              return (
                <div style={{ background: 'rgba(2, 6, 23, 0.75)', border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: 12, padding: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Input Stop Rate:</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                        {Number(draftStopRate).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Gross Investment Yield:</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {previewRealYield.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Protocol Net Fee:</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>
                        -{Number(draftFee).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Resulting Customer APY:</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-green)' }}>
                        {previewCustomerAPY.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      triggerSecurityAction({
                        title: `CONFIRM: BROADCAST SOVEREIGN YIELD BENCHMARK`,
                        actionType: 'SOVEREIGN_RATE_DEPLOYED',
                        permissionKey: 'rates.broadcast',
                        target: draftAuctionCode,
                        exactChange: {
                          'Auction Code': draftAuctionCode,
                          'CBN Stop Rate': `${Number(draftStopRate).toFixed(2)}%`,
                          'Gross Real Yield': `${previewRealYield.toFixed(2)}%`,
                          'Customer Net APY': `${previewCustomerAPY.toFixed(2)}%`,
                          'Protocol Fee': `${Number(draftFee).toFixed(2)}%`,
                        },
                        effectSummary: [
                          `Platform-wide customer APY will adjust to ${previewCustomerAPY.toFixed(2)}%.`,
                          'Daily dividend yields for all active node tiers will compute based on this rate.',
                          'Broadcasted to all connected validators in real time.',
                        ],
                        onConfirm: async () => {
                          updateSovereignBenchmark({
                            stopRate: draftStopRate,
                            protocolFee: draftFee,
                            model: draftModel,
                            auctionCode: draftAuctionCode,
                            approvedBy: user?.email || 'Chief Compliance Officer',
                          });
                          dbAdmin.logAdminAction({
                            category: 'SOVEREIGN_RATE',
                            action: 'RATE_DEPLOYED',
                            target: draftAuctionCode,
                            details: `Broadcast new sovereign benchmark stop rate ${draftStopRate}% -> Customer APY ${previewCustomerAPY.toFixed(2)}%.`,
                            impact: 'HIGH',
                            adminName: user?.name || 'Chief Compliance Officer',
                            adminEmail: user?.email || 'admin@nodevault.io'
                          });
                        }
                      });
                    }}
                  >
                    🚀 Authorize & Broadcast {previewCustomerAPY.toFixed(2)}% APY
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 10: DATABASE VAULT
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'database_vault' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3 className="admin-card-title">🗄️ Supabase PostgreSQL Cloud Sync</h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Enterprise multi-region cloud database connection and zero-latency local fallback
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Host URL:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                    {creds.url || 'Not Configured'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Connection Status:</div>
                  <div style={{ color: '#00ff94', fontWeight: 700 }}>
                    ✓ Online (Active Cloud Gateway)
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={handleTestDatabase} disabled={testingDb}>
              {testingDb ? 'Pinging Cloud Cluster...' : '⚡ Test Connection'}
            </button>

            {dbTestResult && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 8, background: dbTestResult.success ? 'rgba(0,255,148,0.1)' : 'rgba(239,68,68,0.1)', color: dbTestResult.success ? '#00ff94' : '#ef4444', fontSize: '0.85rem' }}>
                {dbTestResult.message || (dbTestResult.success ? 'Connected successfully to Supabase cluster.' : 'Connection test failed.')}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 1: HIGH-SECURITY ACTION CONFIRMATION (DUAL AUTH: MASTER KEY OR PASSCODE)
        ════════════════════════════════════════════════════════════ */}
        {securityConfirmModal.isOpen && (
          <div className="admin-modal-overlay" onClick={() => setSecurityConfirmModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card confirm-modal" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setSecurityConfirmModal(prev => ({ ...prev, isOpen: false }))}>✕</button>

              <div className="confirm-security-header">
                <div className="confirm-security-icon">
                  {securityConfirmModal.requiresPassword ? '🛡️' : '⚡'}
                </div>
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: securityConfirmModal.requiresPassword ? '#ef4444' : '#00ff94',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 800
                  }}>
                    {securityConfirmModal.requiresPassword ? 'High-Security Action Clearance' : 'Fast Authorization Mode'}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                    {securityConfirmModal.title}
                  </h3>
                </div>
              </div>

              {/* Exact Change Made */}
              <div className="confirm-change-box">
                <div className="confirm-change-title">
                  📝 Exact Change Being Applied:
                </div>
                {securityConfirmModal.exactChange && typeof securityConfirmModal.exactChange === 'object' ? (
                  <div>
                    {Object.entries(securityConfirmModal.exactChange).map(([k, v]) => (
                      <div key={k} className="confirm-change-row">
                        <span style={{ color: '#94a3b8' }}>{k}:</span>
                        <strong style={{ color: '#fff', textAlign: 'right' }}>{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                    {String(securityConfirmModal.exactChange)}
                  </div>
                )}
              </div>

              {/* Exact Effect & Consequences */}
              <div className="confirm-effect-box">
                <div className="confirm-effect-title">
                  💥 Exact Effect & System Consequences:
                </div>
                <ul className="confirm-effect-list">
                  {securityConfirmModal.effectSummary.map((eff, i) => (
                    <li key={i}>{eff}</li>
                  ))}
                </ul>
              </div>

              {/* Authorization Form: Dual Mode (Password OR Time-Limited Passcode) */}
              <form onSubmit={handleExecuteSecurityAction}>
                {securityConfirmModal.requiresPassword ? (
                  <div className="confirm-password-wrap">
                    {/* Dual Mode Selector */}
                    <div className="auth-mode-selector">
                      <button
                        type="button"
                        className={`auth-mode-btn ${securityConfirmModal.authMode === 'password' ? 'active' : ''}`}
                        onClick={() => setSecurityConfirmModal(prev => ({ ...prev, authMode: 'password' }))}
                      >
                        🔑 Master Administrator Password
                      </button>
                      <button
                        type="button"
                        className={`auth-mode-btn ${securityConfirmModal.authMode === 'passcode' ? 'active' : ''}`}
                        onClick={() => setSecurityConfirmModal(prev => ({ ...prev, authMode: 'passcode' }))}
                      >
                        ⏳ Time-Limited Access Passcode
                      </button>
                    </div>

                    {securityConfirmModal.authMode === 'password' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#facc15', fontWeight: 700, marginBottom: '0.4rem' }}>
                          Enter Administrator Security Master Key:
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder="Enter Master Password (e.g. admin123)..."
                          value={securityConfirmModal.passwordInput}
                          onChange={e => setSecurityConfirmModal(prev => ({ ...prev, passwordInput: e.target.value }))}
                          autoFocus
                          style={{ width: '100%', borderColor: securityConfirmModal.passwordError ? '#ef4444' : undefined }}
                        />
                        {securityConfirmModal.passwordError && (
                          <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>
                            ⚠️ {securityConfirmModal.passwordError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.4rem' }}>
                          Enter Active Time-Limited Passcode (e.g. NV-AUTH-8842):
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. NV-AUTH-8842"
                          value={securityConfirmModal.passcodeInput}
                          onChange={e => setSecurityConfirmModal(prev => ({ ...prev, passcodeInput: e.target.value.toUpperCase() }))}
                          autoFocus
                          style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '1px', borderColor: securityConfirmModal.passcodeError ? '#ef4444' : undefined }}
                        />
                        {securityConfirmModal.passcodeError && (
                          <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>
                            ⚠️ {securityConfirmModal.passcodeError}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                          Need a temporary passcode? An admin can issue one in <strong>Roles & Permissions ➔ Time-Limited Passcodes</strong>.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(0, 255, 148, 0.08)',
                    border: '1px solid rgba(0, 255, 148, 0.25)',
                    borderRadius: 10,
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.82rem',
                    color: '#00ff94',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>⚡</span>
                    <span><strong>Fast Execution Policy Active:</strong> This specific action does not require password challenge. You can change this anytime under Roles & Permissions → Action Password Rules.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={() => setSecurityConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  >
                    Cancel & Abort
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={securityConfirmModal.isExecuting}
                    style={{
                      background: securityConfirmModal.requiresPassword ? '#ef4444' : '#00ff94',
                      color: securityConfirmModal.requiresPassword ? '#fff' : '#000',
                      fontWeight: 800
                    }}
                  >
                    {securityConfirmModal.isExecuting 
                      ? 'Verifying...' 
                      : securityConfirmModal.requiresPassword 
                        ? 'Authorize & Execute Action →' 
                        : 'Confirm & Execute Action →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 2: VIEW ROLE IN FULL & SUB-PERMISSIONS BREAKDOWN
        ════════════════════════════════════════════════════════════ */}
        {viewRoleFullModal.isOpen && viewRoleFullModal.role && (
          <div className="admin-modal-overlay" onClick={() => setViewRoleFullModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card large" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setViewRoleFullModal(prev => ({ ...prev, isOpen: false }))}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      Full Sub-Permissions Inspector
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                      {viewRoleFullModal.role.name}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 8, background: `${viewRoleFullModal.role.color}22`, color: viewRoleFullModal.role.color, border: `1px solid ${viewRoleFullModal.role.color}44`, fontWeight: 700 }}>
                    {viewRoleFullModal.role.badge}
                  </span>
                  
                  {/* ALL ROLES ARE EDITABLE */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const r = viewRoleFullModal.role;
                      setViewRoleFullModal(prev => ({ ...prev, isOpen: false }));
                      handleOpenEditRole(r);
                    }}
                  >
                    ✏️ Edit Sub-Permissions
                  </button>
                </div>
              </div>

              {/* Filters within Inspector */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="🔍 Search sub-permission or description..."
                  value={viewRoleFullModal.searchQuery}
                  onChange={e => setViewRoleFullModal(prev => ({ ...prev, searchQuery: e.target.value }))}
                  style={{ flex: 1, minWidth: 200, fontSize: '0.8rem' }}
                />

                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {['all', 'read', 'write', 'create', 'delete', 'manage'].map(type => (
                    <button
                      key={type}
                      className={`btn btn-sm ${viewRoleFullModal.filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', textTransform: 'uppercase' }}
                      onClick={() => setViewRoleFullModal(prev => ({ ...prev, filterType: type }))}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Android-style grouped sub-permissions */}
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {PERMISSION_GROUPS.map(group => {
                  const filteredPerms = group.permissions.filter(p => {
                    const matchesType = viewRoleFullModal.filterType === 'all' || p.type === viewRoleFullModal.filterType;
                    const q = viewRoleFullModal.searchQuery.toLowerCase();
                    const matchesSearch = !q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
                    return matchesType && matchesSearch;
                  });

                  if (filteredPerms.length === 0) return null;

                  const grantedInGroup = group.permissions.filter(p => hasSubPermission(viewRoleFullModal.role, p.key)).length;

                  return (
                    <div key={group.groupId} className="perm-group-card">
                      <div className="perm-group-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{group.icon}</span>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{group.name}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{group.description}</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontWeight: 700,
                          background: grantedInGroup > 0 ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: grantedInGroup > 0 ? '#00ff94' : '#64748b'
                        }}>
                          {grantedInGroup} / {group.permissions.length} Granted
                        </span>
                      </div>

                      <div>
                        {filteredPerms.map(perm => {
                          const isGranted = hasSubPermission(viewRoleFullModal.role, perm.key);
                          const isPwRequired = Boolean(securityPolicies[perm.key]);

                          return (
                            <div key={perm.key} className="perm-item-row" style={{ opacity: isGranted ? 1 : 0.45 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                                <span style={{
                                  fontSize: '0.9rem',
                                  color: isGranted ? '#00ff94' : '#ef4444',
                                  fontWeight: 800
                                }}>
                                  {isGranted ? '✓' : '✕'}
                                </span>

                                <span className={`perm-type-badge ${perm.type}`}>
                                  {perm.type}
                                </span>

                                <div>
                                  <div style={{ fontWeight: 700, color: '#fff' }}>{perm.label}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                    <code style={{ color: 'var(--accent-cyan)' }}>{perm.key}</code> • {perm.desc}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  className={`password-policy-btn ${isPwRequired ? 'required' : 'fast'}`}
                                  onClick={() => handleTogglePasswordPolicy(perm.key, isPwRequired)}
                                  title="Toggle whether this action requires master password"
                                >
                                  {isPwRequired ? '🔑 Password Required' : '⚡ No Password'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewRoleFullModal(prev => ({ ...prev, isOpen: false }))}>
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 3: ISSUE TIME-LIMITED PASSCODE MODAL
        ════════════════════════════════════════════════════════════ */}
        {issuePasscodeModal.isOpen && (
          <div className="admin-modal-overlay" onClick={() => setIssuePasscodeModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setIssuePasscodeModal(prev => ({ ...prev, isOpen: false }))}>✕</button>
              <h3 style={{ margin: '0 0 0.5rem' }}>⏳ Issue Time-Limited Access Passcode</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Generates a secure, expiring token that authorizes temporary permission modification or privilege delegation.
              </p>

              <form onSubmit={handleCreatePasscode}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Designated Operator / Recipient Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={issuePasscodeModal.issuedTo}
                    onChange={e => setIssuePasscodeModal(prev => ({ ...prev, issuedTo: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Target Administrative Role
                  </label>
                  <select
                    className="input"
                    value={issuePasscodeModal.roleId}
                    onChange={e => setIssuePasscodeModal(prev => ({ ...prev, roleId: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Validity Window (Lifespan)
                  </label>
                  <select
                    className="input"
                    value={issuePasscodeModal.durationMinutes}
                    onChange={e => setIssuePasscodeModal(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 60 }))}
                    style={{ width: '100%' }}
                  >
                    <option value={15}>15 Minutes (High-Security Brief Action)</option>
                    <option value={60}>1 Hour (Standard Maintenance Window)</option>
                    <option value={240}>4 Hours (Extended Operational Shift)</option>
                    <option value={1440}>24 Hours (Full Day Access)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Purpose Memo (Required for Audit Trail)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="e.g. Authorized permission elevation for scheduled regulatory compliance review..."
                    value={issuePasscodeModal.purpose}
                    onChange={e => setIssuePasscodeModal(prev => ({ ...prev, purpose: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setIssuePasscodeModal(prev => ({ ...prev, isOpen: false }))}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-full">
                    Generate Passcode & Broadcast →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 4: ADD / EDIT TIER MODAL
        ════════════════════════════════════════════════════════════ */}
        {tierModal.isOpen && (
          <div className="admin-modal-overlay" onClick={() => setTierModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setTierModal(prev => ({ ...prev, isOpen: false }))}>✕</button>
              <h3 style={{ margin: '0 0 1rem' }}>
                {tierModal.isEdit ? `Edit ${tierModal.data.label}` : 'Add New Protocol Node Tier'}
              </h3>

              <form onSubmit={handleSubmitTierForm}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tier Label</label>
                    <input
                      type="text"
                      className="input"
                      value={tierModal.data.label}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, label: e.target.value } }))}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tier Name</label>
                    <input
                      type="text"
                      className="input"
                      value={tierModal.data.name}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Staking Fee (₦ NGN)</label>
                    <input
                      type="number"
                      className="input"
                      value={tierModal.data.fee}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, fee: parseFloat(e.target.value) || 0 } }))}
                      required
                      min="100"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Category</label>
                    <select
                      className="input"
                      value={tierModal.data.category}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, category: e.target.value } }))}
                      style={{ width: '100%' }}
                    >
                      <option value="small">Small Node (Tiers 1-5)</option>
                      <option value="mid">Mid Node (Tiers 6-8)</option>
                      <option value="premium">Premium Node (Tiers 9-14)</option>
                      <option value="elite">Elite Cap (Tier 15+)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Max Pools</label>
                    <input
                      type="number"
                      className="input"
                      value={tierModal.data.maxPools}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, maxPools: parseInt(e.target.value) || 1 } }))}
                      min="1"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Badge Color</label>
                    <input
                      type="color"
                      className="input"
                      value={tierModal.data.color}
                      onChange={e => setTierModal(prev => ({ ...prev, data: { ...prev.data, color: e.target.value } }))}
                      style={{ width: '100%', height: 38, padding: 2 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setTierModal(prev => ({ ...prev, isOpen: false }))}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-full">
                    Proceed to Authorization →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 5: CREATE / EDIT ROLE MODAL (ALL ROLES EDITABLE)
        ════════════════════════════════════════════════════════════ */}
        {roleModal.isOpen && (
          <div className="admin-modal-overlay" onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card large" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}>✕</button>
              <h3 style={{ margin: '0 0 1rem' }}>
                {roleModal.isEdit ? `Edit Role: ${roleModal.data.name}` : 'Create Custom Administrative Role'}
              </h3>

              <form onSubmit={handleSubmitRoleForm}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Role Title</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Regional Compliance Analyst"
                      value={roleModal.data.name}
                      onChange={e => setRoleModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Badge Display</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 🛡️ Regional"
                      value={roleModal.data.badge}
                      onChange={e => setRoleModal(prev => ({ ...prev, data: { ...prev.data, badge: e.target.value } }))}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Summary of responsibilities..."
                      value={roleModal.data.description}
                      onChange={e => setRoleModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Sub-Permissions Selector Accordion */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Configure Sub-Permissions ({roleModal.data.permissions.length} selected):
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        onClick={() => setRoleModal(prev => ({ ...prev, data: { ...prev.data, permissions: [...ALL_SUB_PERMISSION_KEYS] } }))}
                      >
                        Select All ({ALL_SUB_PERMISSION_KEYS.length})
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        onClick={() => setRoleModal(prev => ({ ...prev, data: { ...prev.data, permissions: [] } }))}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: 4 }}>
                    {PERMISSION_GROUPS.map(group => {
                      const allInGroup = group.permissions.map(p => p.key);
                      const isGroupFull = allInGroup.every(k => roleModal.data.permissions.includes(k));

                      return (
                        <div key={group.groupId} className="perm-group-card" style={{ marginBottom: '0.75rem' }}>
                          <div className="perm-group-header" style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{group.icon}</span>
                              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{group.name}</strong>
                            </div>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                              onClick={() => {
                                const current = new Set(roleModal.data.permissions);
                                if (isGroupFull) {
                                  allInGroup.forEach(k => current.delete(k));
                                } else {
                                  allInGroup.forEach(k => current.add(k));
                                }
                                setRoleModal(prev => ({ ...prev, data: { ...prev.data, permissions: Array.from(current) } }));
                              }}
                            >
                              {isGroupFull ? 'Deselect Group' : 'Select Group'}
                            </button>
                          </div>

                          <div>
                            {group.permissions.map(perm => {
                              const isChecked = roleModal.data.permissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className="perm-item-row"
                                  style={{ cursor: 'pointer', padding: '0.55rem 0.75rem' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const current = new Set(roleModal.data.permissions);
                                        if (e.target.checked) current.add(perm.key);
                                        else current.delete(perm.key);
                                        setRoleModal(prev => ({ ...prev, data: { ...prev.data, permissions: Array.from(current) } }));
                                      }}
                                    />
                                    <span className={`perm-type-badge ${perm.type}`}>
                                      {perm.type}
                                    </span>
                                    <div>
                                      <strong style={{ color: '#fff', fontSize: '0.82rem' }}>{perm.label}</strong>
                                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 6 }}>
                                        <code>{perm.key}</code>
                                      </span>
                                    </div>
                                  </div>

                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    {perm.desc}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setRoleModal(prev => ({ ...prev, isOpen: false }))}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-full">
                    Proceed to Dual Authorization →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 6: ASSIGN POINTS / NVT BALANCE MODAL
        ════════════════════════════════════════════════════════════ */}
        {pointsModal.isOpen && (
          <div className="admin-modal-overlay" onClick={() => setPointsModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setPointsModal(prev => ({ ...prev, isOpen: false }))}>✕</button>
              <h3 style={{ margin: '0 0 0.5rem' }}>⚡ Allocate Points & Balances</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Recipient: <strong>{pointsModal.user?.name || pointsModal.user?.email}</strong>
              </p>

              <form onSubmit={handleSubmitPointsAllocation}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Asset / Ledger Type</label>
                  <select
                    className="input"
                    value={pointsModal.unit}
                    onChange={e => setPointsModal(prev => ({ ...prev, unit: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="NVT">NVT Tokens (1 NVT = ₦10.00 NGN)</option>
                    <option value="POINTS">Validator Points (1 pt = 1 NVT)</option>
                    <option value="NGN">Naira Wallet Balance (₦ NGN)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Amount (Use negative to deduct)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={pointsModal.amount}
                    onChange={e => setPointsModal(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#00ff94' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Equivalent Parity Value: ₦{(Math.abs(Number(pointsModal.amount) || 0) * (pointsModal.unit === 'NGN' ? 1 : 10)).toLocaleString()} NGN
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                    Compliance Reason & Memo (Required for Audit)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Specify justification: e.g. Early validator goodwill, testnet bug bounty, settlement adjustment..."
                    value={pointsModal.reason}
                    onChange={e => setPointsModal(prev => ({ ...prev, reason: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setPointsModal(prev => ({ ...prev, isOpen: false }))}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-full">
                    Proceed to Authorization →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 7: FULL USER 360° INSPECTOR MODAL
        ════════════════════════════════════════════════════════════ */}
        {inspectUserModal.isOpen && inspectUserModal.user && (
          <div className="admin-modal-overlay" onClick={() => setInspectUserModal(prev => ({ ...prev, isOpen: false }))}>
            <div className="admin-modal-card large" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setInspectUserModal(prev => ({ ...prev, isOpen: false }))}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)'
                }}>
                  {inspectUserModal.user.name ? inspectUserModal.user.name.charAt(0).toUpperCase() : 'V'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{inspectUserModal.user.name || 'Validator'}</h3>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {inspectUserModal.user.email} • ID: <code style={{ color: 'var(--accent-cyan)' }}>{inspectUserModal.user.id}</code>
                  </div>
                </div>
              </div>

              {/* Inspector Sub-tabs */}
              <div className="inspector-tabs">
                <button
                  className={`inspector-tab-btn ${inspectUserModal.activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, activeTab: 'profile' }))}
                >
                  👤 Profile & Identity
                </button>
                <button
                  className={`inspector-tab-btn ${inspectUserModal.activeTab === 'stakes' ? 'active' : ''}`}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, activeTab: 'stakes' }))}
                >
                  ⚡ Stakes & Nodes
                </button>
                <button
                  className={`inspector-tab-btn ${inspectUserModal.activeTab === 'balances' ? 'active' : ''}`}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, activeTab: 'balances' }))}
                >
                  💰 Financial Ledgers
                </button>
                <button
                  className={`inspector-tab-btn ${inspectUserModal.activeTab === 'network' ? 'active' : ''}`}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, activeTab: 'network' }))}
                >
                  🌐 Affiliate & Tree
                </button>
                <button
                  className={`inspector-tab-btn ${inspectUserModal.activeTab === 'kyc' ? 'active' : ''}`}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, activeTab: 'kyc' }))}
                >
                  🪪 KYC Document
                </button>
              </div>

              {/* Tab 1: Profile */}
              {inspectUserModal.activeTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Full Name:</span>
                    <div><strong>{inspectUserModal.user.name || 'N/A'}</strong></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Phone Number:</span>
                    <div><strong>{inspectUserModal.user.phone || 'N/A'}</strong></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Region Jurisdiction:</span>
                    <div><strong>{inspectUserModal.user.region === 'US' ? 'United States ($USD)' : 'Nigeria (₦NGN)'}</strong></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Administrative Role:</span>
                    <div><strong style={{ color: '#facc15' }}>{inspectUserModal.user.role || 'user'}</strong></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Registration Date:</span>
                    <div><strong>{inspectUserModal.user.joinDate || '2026-09-01'}</strong></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Account Lock State:</span>
                    <div>
                      {inspectUserModal.user.isFrozen ? (
                        <strong style={{ color: '#ef4444' }}>❄️ Suspended / Frozen</strong>
                      ) : (
                        <strong style={{ color: '#00ff94' }}>✓ Active & Good Standing</strong>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Stakes */}
              {inspectUserModal.activeTab === 'stakes' && (
                <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Active Tier:</span>
                      <div><strong style={{ color: 'var(--accent-cyan)' }}>{inspectUserModal.user.tierName || 'Micro Node'}</strong></div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Staked Capital:</span>
                      <div><strong style={{ color: '#00ff94' }}>{formatNaira(inspectUserModal.user.entryFee || 1000)}</strong></div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Bound Sub-Nodes:</span>
                      <div><strong>{inspectUserModal.user.subNodes || 0} active nodes</strong></div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 229, 255, 0.04)', padding: '0.75rem', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem' }}>
                    🛡️ <strong>Statutory Settlement:</strong> Principal is protected under 100% NIBSS clearing floor upon scheduled 364-day maturity.
                  </div>
                </div>
              )}

              {/* Tab 3: Balances */}
              {inspectUserModal.activeTab === 'balances' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Available NGN Wallet:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      ₦{Number(inspectUserModal.user.walletBalance || 0).toLocaleString()} NGN
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Referral NVT Balance:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {(Number(inspectUserModal.user.referralBalance) || 0).toFixed(2)} NVT
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Cumulative Yields Distributed:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00ff94' }}>
                      ₦{Number(inspectUserModal.user.cumulativeGifts || 0).toLocaleString()} NGN
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                    <span style={{ color: '#94a3b8' }}>Mined NVT:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#facc15' }}>
                      {(Number(inspectUserModal.user.minedNvt) || 0).toFixed(4)} NVT
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Network */}
              {inspectUserModal.activeTab === 'network' && (
                <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Affiliate Reward Track:</span>
                      <div>
                        <strong style={{ color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                          {inspectUserModal.user.affiliateTrack || 'Mainline (1 NVT/yr)'}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#00ff94', marginLeft: 6 }}>🔒 Locked</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Referral Sponsor Code:</span>
                      <div><strong style={{ color: '#fff' }}>{inspectUserModal.user.referralCode}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: KYC */}
              {inspectUserModal.activeTab === 'kyc' && (
                <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Status:</span>
                      <div>
                        <strong style={{ color: inspectUserModal.user.kycStatus === 'verified' ? '#00ff94' : '#facc15' }}>
                          {inspectUserModal.user.kycStatus ? inspectUserModal.user.kycStatus.toUpperCase() : 'PENDING'}
                        </strong>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8 }}>
                      <span style={{ color: '#94a3b8' }}>Document Type:</span>
                      <div><strong>National Identity Management Commission (NIN)</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons inside inspector */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#00ff94', borderColor: 'rgba(0, 255, 148, 0.3)' }}
                  onClick={() => {
                    handleOpenAssignPoints(inspectUserModal.user);
                  }}
                >
                  ⚡ Assign Points / Balance
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const newRole = inspectUserModal.user.role === 'admin' ? 'user' : 'admin';
                    handleAssignUserRole(inspectUserModal.user, newRole);
                  }}
                >
                  {inspectUserModal.user.role === 'admin' ? 'Revoke Admin' : 'Make Administrator'}
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: inspectUserModal.user.isFrozen ? '#00ff94' : '#ef4444' }}
                  onClick={() => handleToggleFreezeUser(inspectUserModal.user)}
                >
                  {inspectUserModal.user.isFrozen ? 'Unfreeze Validator' : 'Freeze Account'}
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setInspectUserModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MODAL 8: REJECTION REASON MODAL
        ════════════════════════════════════════════════════════════ */}
        {rejectModal && (
          <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <button className="admin-modal-close" onClick={() => setRejectModal(null)}>✕</button>
              <h3 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>
                {rejectModal.type === 'kyc' ? 'Reject Identity Verification' : 'Reject Capital Disbursement'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Please specify the compliance reason for rejecting {rejectModal.name}. This note will be dispatched to the validator.
              </p>

              <textarea
                className="input"
                rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Specify regulatory or technical reason..."
                style={{ width: '100%', marginBottom: '1.25rem' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary btn-full" onClick={() => setRejectModal(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-full" onClick={handleConfirmReject} style={{ background: '#ef4444' }}>
                  Confirm Rejection →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
