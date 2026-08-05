import { message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || 'https://192.168.1.40:8000/graphql/';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('authToken') && {
        Authorization: `JWT ${localStorage.getItem('authToken')}`,
    }),
});

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [searchText, setSearchText] = useState('');
    const skipSearchEffect = useRef(true);
    const isFetching = useRef(false);

    // Initial load
    useEffect(() => {
        loadCustomers();
    }, []);

    // Debounced search
    useEffect(() => {
        if (skipSearchEffect.current) {
            skipSearchEffect.current = false;
            return;
        }
        const timer = setTimeout(() => loadCustomers(null, true), 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    const loadCustomers = async (cursor = null, isNewSearch = false) => {
        if (isFetching.current) return;
        isFetching.current = true;

        isNewSearch ? setLoading(true) : setFetchingMore(true);

        try {
            let queryArgs = 'first: 15';
            if (cursor) queryArgs += `, after: "${cursor}"`;
            if (searchText) queryArgs += `, search: ${JSON.stringify(searchText)}`;

            const response = await fetch(GRAPHQL_URI, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    query: `
            query {
              customers(${queryArgs}) {
                customers {
      id
      customerId
      

      user {
        id
        firstName
        lastName
        email
        phone
        isActive
      }

      addresses {
        id
        name
        phone
        addressLine
        city
        state
        landmark
        pincode
        isDefault
      }
    }
                nextCursor
                hasMore
              }
            }
          `,
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const transformed = (result.data?.customers?.customers || []).map((c) => ({
                ...c,

                id: c.id,
                customerId: c.customerId,
                firstName: c.user?.firstName || '',
                lastName: c.user?.lastName || '',
                email: c.user?.email || 'N/A',
                phone: c.user?.phone || null,
                isActive: c.user?.isActive ?? false,
                fullName: `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || 'N/A',
            }));

            setCustomers((prev) => {
                if (isNewSearch) {
                    return transformed;
                }

                return [...prev, ...transformed];
            });

            setNextCursor(result.data?.customers?.nextCursor);
            setHasMore(result.data?.customers?.hasMore);
        } catch (error) {
            message.error('Failed to load customers: ' + error.message);
        } finally {
            setLoading(false);
            setFetchingMore(false);
            isFetching.current = false;
        }
    };

    const deleteCustomer = async (id) => {
        try {
            const response = await fetch(GRAPHQL_URI, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    query: `
            mutation {
              deleteCustomer(id: ${parseInt(id)}) { ok }
            }
          `,
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const { deleteCustomer: dc } = result.data || {};
            if (dc?.ok === true || dc === null) {
                setCustomers((prev) => prev.filter((c) => c.id !== id));
                message.success('Customer deleted successfully');
            } else {
                message.error('Delete operation failed');
            }
        } catch (error) {
            message.error('Failed to delete customer: ' + error.message);
        }
    };

    const toggleCustomerStatus = async (record) => {
        try {
            await updateCustomer(record.id, {
                firstName: record.firstName,
                lastName: record.lastName,
                phone: record.phone,
                isActive: !record.isActive,
            });

            message.success(
                `Customer ${!record.isActive ? 'activated' : 'deactivated'} successfully`
            );
        } catch (error) {
            //console.log(error);
        }
    };

    const updateCustomer = async (id, values) => {
        const response = await fetch(GRAPHQL_URI, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                query: `
            mutation {
                updateCustomer(
                id: ${id},
                firstName: "${values.firstName || ''}",
                lastName: "${values.lastName || ''}",
                phone: "${values.phone || ''}"
                isActive: ${values.isActive}
                
                ) {
                customer { id }
                }
            }
            `,
            }),
        });

        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message);

        if (result.data?.updateCustomer?.customer) {
            setCustomers((prev) =>
                prev.map((c) =>
                    c.id === id
                        ? {
                            ...c,
                            firstName: values.firstName,
                            lastName: values.lastName,
                            fullName: `${values.firstName || ''} ${values.lastName || ''}`.trim() || 'N/A',
                        }
                        : c
                )
            );
            // message.success('Customer updated successfully');

        } else {
            //throw new Error('Failed to update customer');
        }
    };

    const skeletonRows = useMemo(
        () => Array.from({ length: 11 }).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true })),
        []
    );

    return {
        customers,
        loading,
        fetchingMore,
        nextCursor,
        hasMore,
        searchText,
        setSearchText,
        skeletonRows,
        loadCustomers,
        deleteCustomer,
        updateCustomer,
        toggleCustomerStatus,
    };
};