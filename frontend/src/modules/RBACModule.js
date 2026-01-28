/**
 * Role-Based Access Control (RBAC) Module
 * Manages user roles and permissions for file access
 */

// Role definitions with hierarchical permissions
export const Roles = {
    OWNER: 'owner',
    ADMIN: 'admin',
    COLLABORATOR: 'collaborator',
    VIEWER: 'viewer'
};

// Permission matrix
export const Permissions = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    SHARE: 'share',
    MANAGE: 'manage',
    REVOKE: 'revoke'
};

// Role-Permission mapping
const RolePermissions = {
    [Roles.OWNER]: [
        Permissions.READ,
        Permissions.WRITE,
        Permissions.DELETE,
        Permissions.SHARE,
        Permissions.MANAGE,
        Permissions.REVOKE
    ],
    [Roles.ADMIN]: [
        Permissions.READ,
        Permissions.WRITE,
        Permissions.DELETE,
        Permissions.SHARE,
        Permissions.MANAGE
    ],
    [Roles.COLLABORATOR]: [
        Permissions.READ,
        Permissions.WRITE,
        Permissions.SHARE
    ],
    [Roles.VIEWER]: [
        Permissions.READ
    ]
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
    const rolePerms = RolePermissions[userRole];
    return rolePerms ? rolePerms.includes(permission) : false;
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
    return RolePermissions[role] || [];
};

// Check if user can perform action on resource
export const canPerformAction = (user, resource, action) => {
    // Owner always has full access
    if (resource.ownerId === user.id) {
        return true;
    }

    // Check shared permissions
    const sharedAccess = resource.sharedWith?.find(s => s.userId === user.id);
    if (!sharedAccess) {
        return false;
    }

    return hasPermission(sharedAccess.role, action);
};

// Get user's effective role for a resource
export const getEffectiveRole = (user, resource) => {
    if (resource.ownerId === user.id) {
        return Roles.OWNER;
    }

    const sharedAccess = resource.sharedWith?.find(s => s.userId === user.id);
    return sharedAccess?.role || null;
};

// Validate role assignment (prevent privilege escalation)
export const canAssignRole = (assignerRole, targetRole) => {
    const roleHierarchy = {
        [Roles.OWNER]: 4,
        [Roles.ADMIN]: 3,
        [Roles.COLLABORATOR]: 2,
        [Roles.VIEWER]: 1
    };

    return roleHierarchy[assignerRole] > roleHierarchy[targetRole];
};

// Create access control entry
export const createAccessEntry = (userId, role, grantedBy, expiresAt = null) => {
    return {
        userId,
        role,
        grantedBy,
        grantedAt: new Date().toISOString(),
        expiresAt,
        isActive: true
    };
};

// Audit action for compliance
export const auditAccess = (userId, action, resourceId, result) => {
    return {
        timestamp: new Date().toISOString(),
        userId,
        action,
        resourceId,
        result,
        metadata: {
            ip: null, // Set by server
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        }
    };
};

export default {
    Roles,
    Permissions,
    hasPermission,
    getRolePermissions,
    canPerformAction,
    getEffectiveRole,
    canAssignRole,
    createAccessEntry,
    auditAccess
};
