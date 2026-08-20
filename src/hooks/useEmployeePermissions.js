import { message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { graphqlRequest } from "../api/graphql";
import {
  CREATE_EMPLOYEE_PERMISSION,
  DELETE_EMPLOYEE_PERMISSION,
  UPDATE_EMPLOYEE_PERMISSION,
} from "../graphql/employeeMutations";
import { GET_EMPLOYEE_PERMISSIONS } from "../graphql/employeeQueries";

// Non-order modules
// Non-order modules
export const ALL_MODULES = [
  { key: "product", label: "Product Management", subModule: null },
  { key: "category", label: "Category Management", subModule: null },
  { key: "stock", label: "Stock Management", subModule: null },
  { key: "transaction", label: "Transactions", subModule: null },
  { key: "refund", label: "Refunds", subModule: null },
  { key: "delivery", label: "Delivery", subModule: null },
  { key: "customer", label: "Customer Management", subModule: null },
  { key: "employee", label: "Employee Management", subModule: null },
  { key: "enquiry", label: "Enquiries", subModule: null },
  { key: "store_settings", label: "Store Settings", subModule: null },
];

// Order module rendered as separate rows, one per sub_module
export const ORDER_SUBMODULES = [
  { key: "order", subModule: "order_dashboard", label: "Orders — Dashboard" },
  { key: "order", subModule: "system_order", label: "Orders — System" },
  { key: "order", subModule: "bulk_order", label: "Orders — Bulk" },
  { key: "order", subModule: "custom_order", label: "Orders — Custom" },
  { key: "order", subModule: "user_order", label: "Orders — User" },
  {
    key: "order",
    subModule: "bulk_order_enquiry",
    label: "Orders — Bulk Order Enquiry",
  },
];

// Combined list for the permissions table
// rowKey = `${module}__${subModule ?? ''}`
export const ALL_PERMISSION_ROWS = [
  ...ALL_MODULES.map((m) => ({ ...m, rowKey: m.key })),
  ...ORDER_SUBMODULES.map((m) => ({
    ...m,
    rowKey: `order__${m.subModule}`,
  })),
];

export const ACCESS_LEVELS = [
  { value: "view", label: "View", color: "blue" },
  { value: "update", label: "Update", color: "green" },
  { value: "no_access", label: "No Access", color: "red" },
];

export const useEmployeePermissions = (employeeId) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPermissions = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await graphqlRequest(GET_EMPLOYEE_PERMISSIONS, {
        employeeId: Number(employeeId),
      });
      setPermissions(
        (data.employeePermissions || []).map((p) => ({
          ...p,
          module: p.module.toLowerCase(),
          subModule:
            (p.subModule || p.sub_module || null)?.toLowerCase() ?? null,
          access: p.access.toLowerCase(),
        })),
      );
    } catch (error) {
      message.error("Failed to load permissions: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Find the stored permission for a row.
   * For order rows, match on both module + sub_module.
   * For other rows, match on module only.
   */
  const getPermissionForRow = (moduleKey, subModule = null) =>
    permissions.find(
      (p) =>
        p.module === moduleKey &&
        (subModule ? p.subModule === subModule : !p.subModule),
    ) || null;

  /** Called when user changes the access Select on any row */
  const handleAccessChange = async (moduleKey, subModule = null, newAccess) => {
    if (!employeeId) {
      message.error("No employee selected");
      return;
    }
    setSaving(true);
    try {
      const existing = getPermissionForRow(moduleKey, subModule);

      if (!existing) {
        await graphqlRequest(CREATE_EMPLOYEE_PERMISSION, {
          employeeId: Number(employeeId),
          module: moduleKey,
          access: newAccess,
          ...(subModule && { subModule }),
        });
        message.success("Permission set");
      } else {
        await graphqlRequest(UPDATE_EMPLOYEE_PERMISSION, {
          id: Number(existing.id),
          access: newAccess,
          ...(subModule && { subModule }),
        });
        message.success("Permission updated");
      }

      await loadPermissions();
    } catch (error) {
      message.error("Failed to update permission: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePermission = async (permissionId) => {
    setSaving(true);
    try {
      await graphqlRequest(DELETE_EMPLOYEE_PERMISSION, {
        id: Number(permissionId),
      });
      message.success("Permission removed");
      await loadPermissions();
    } catch (error) {
      message.error("Failed to remove permission: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    permissions,
    loading,
    saving,
    loadPermissions,
    getPermissionForRow,
    handleAccessChange,
    deletePermission,
  };
};
