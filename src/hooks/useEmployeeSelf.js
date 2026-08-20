/**
 * useEmployeeSelf
 *
 * Used in the App/Layout wrapper for employees.
 * Fetches the logged-in employee's own permissions so the Sidebar
 * can show only what they're allowed to see.
 *
 * Usage in your App layout:
 *
 *   const { permissions, loading } = useEmployeeSelf(employeeId);
 *   <Sidebar role="employee" permissions={permissions} ... />
 */

import { useEffect, useState } from 'react';
import { graphqlRequest } from '../api/graphql';
import { GET_EMPLOYEE_PERMISSIONS } from '../graphql/employeeQueries';

export const useEmployeeSelf = (employeeId) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!employeeId) return;

        const fetchPerms = async () => {
            setLoading(true);
            try {
                const data = await graphqlRequest(GET_EMPLOYEE_PERMISSIONS, {
                    employeeId: Number(employeeId),
                });
                setPermissions(data.employeePermissions || []);
            } catch (err) {
                //console.error('Could not fetch self permissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPerms();
    }, [employeeId]);

    /**
     * Check if employee can access a module.
     * minLevel: 'view' (any access) | 'update' (update access only)
     */
    const canAccess = (moduleKey, minLevel = 'view') => {
        const perm = permissions.find((p) => p.module === moduleKey);
        if (!perm || perm.access === 'no_access') return false;
        if (minLevel === 'update') return perm.access === 'update';
        return true; // 'view' or 'update' both satisfy minLevel='view'
    };

    return { permissions, loading, canAccess };
};
