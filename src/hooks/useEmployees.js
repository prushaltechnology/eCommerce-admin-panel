import { message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CREATE_EMPLOYEE,
    DELETE_EMPLOYEE,
    UPDATE_EMPLOYEE,
} from '../graphql/employeeMutations';
import { GET_EMPLOYEES } from '../graphql/queries';

const formatEmployee = (emp) => ({
    id: emp.id,
    employeeId: emp.employeeId,
    firstName: emp.user?.firstName || '',
    lastName: emp.user?.lastName || '',
    name: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim(),
    email: emp.user?.email || '',
    phone: emp.user?.phone || '',
    roleName: emp.roleName,
    isActive: emp.isActive,
    status: emp.isActive ? 'active' : 'inactive',
    role: emp.roleName?.toLowerCase() || 'employee',
});

export const useEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [fetchingMore, setFetchingMore] = useState(false);

    const skipSearchEffect = useRef(true);
    const isFetching = useRef(false);

    useEffect(() => {
        loadEmployees();
    }, []);

    // Debounced search
    useEffect(() => {
        if (skipSearchEffect.current) {
            skipSearchEffect.current = false;
            return;
        }
        const timer = setTimeout(() => loadEmployees(null, false, searchText), 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    const loadEmployees = async (cursor = null, append = false, search = searchText) => {
        if (isFetching.current) return;
        isFetching.current = true;

        if (append) setFetchingMore(true);
        else setLoading(true);

        try {
            const { graphqlRequest } = await import('../api/graphql');
            const data = await graphqlRequest(GET_EMPLOYEES, {
                first: 15,
                after: cursor,
                search: search || null
            });
            const newEmployees = (data.employees?.employees || []).map(formatEmployee);

            setEmployees(prev => append ? [...prev, ...newEmployees] : newEmployees);

            setHasMore(data.employees?.hasMore ?? false);
            setNextCursor(data.employees?.nextCursor ?? null);
        } catch (error) {
            message.error('Failed to load employees: ' + error.message);
        } finally {
            setLoading(false);
            setFetchingMore(false);
            isFetching.current = false;
        }
    };

    const createEmployee = async (values) => {
        const { graphqlRequest } = await import('../api/graphql');
        await graphqlRequest(CREATE_EMPLOYEE, {
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            employeeRoleName: values.employeeRoleName,
        });
        message.success('Employee added successfully');
        await loadEmployees();
    };


    const updateEmployee = async (values) => {
        try {
            const { graphqlRequest } = await import('../api/graphql');

            await graphqlRequest(UPDATE_EMPLOYEE, {
                id: Number(values.id),
                firstName: values.firstName,
                lastName: values.lastName,
                phone: values.phone,
                roleName: values.roleName,
                isActive: values.isActive,
            });

            message.success('Employee updated successfully');

            await loadEmployees();
        } catch (error) {
            message.error('Failed to update employee');
            throw error;
        }
    };

    const deleteEmployee = async (record) => {
        const { graphqlRequest } = await import('../api/graphql');
        await graphqlRequest(DELETE_EMPLOYEE, {
            id: Number(record.id),
        });
        await graphqlRequest(DELETE_EMPLOYEE, {
            id: Number(record.id),
        });
        message.success('Employee deleted successfully');
        await loadEmployees();
    };

    const toggleEmployeeStatus = async (record) => {
        try {
            await updateEmployee({
                id: record.id,
                firstName: record.firstName,
                lastName: record.lastName,
                phone: record.phone,
                roleName: record.roleName,
                isActive: !record.isActive,
            });

            message.success(
                `Employee ${!record.isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            //console.log(error);
        }

    };

    const filteredEmployees = useMemo(
        () =>
            employees.filter((emp) => {
                const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
                const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
                return matchesRole && matchesStatus;
            }),
        [employees, roleFilter, statusFilter]
    );

    const stats = useMemo(
        () => ({
            total: employees.length,
            active: employees.filter((e) => e.status === 'active').length,
            inactive: employees.filter((e) => e.status === 'inactive').length,
            admin: employees.filter((e) => e.role === 'admin').length,
            manager: employees.filter((e) => e.role === 'manager').length,
            employee: employees.filter((e) => e.role === 'employee').length,
        }),
        [employees]
    );

    const skeletonRows = useMemo(
        () => Array.from({ length: 11 }).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true })),
        []
    );





    return {
        employees,
        filteredEmployees,
        loading,
        stats,
        skeletonRows,
        searchText,
        setSearchText,
        roleFilter,
        setRoleFilter,
        hasMore,
        nextCursor,
        fetchingMore,
        hasMore,
        nextCursor,
        fetchingMore,
        statusFilter,
        setStatusFilter,
        loadEmployees,
        createEmployee,
        deleteEmployee,
        updateEmployee,
        updateEmployee,
        toggleEmployeeStatus,
    };
};

