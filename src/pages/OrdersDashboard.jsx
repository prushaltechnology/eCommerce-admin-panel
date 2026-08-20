import {
    CreditCardOutlined,
    FileOutlined,
    ShoppingCartOutlined,
    UserOutlined,
} from '@ant-design/icons';

import {
    Card,
    Col,
    Row,
    Space,
    Typography,
} from 'antd';

import {
    useEffect,
    useState,
} from 'react';

import { getBulkOrders } from '../api/bulkOrders';
import { getCustomOrders } from '../api/customOrders';
import { getAllOrders } from '../api/orders';

import SystemOrdersStats from '../../src/pages/orders/components/SystemOrdersStats';

const { Title, Text } = Typography;

const defaultStats = {
    total: 0,
    pending: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
};

const OrdersDashboard = () => {


    const [systemStats, setSystemStats] =
        useState(defaultStats);

    const [customStats, setCustomStats] =
        useState(defaultStats);

    const [bulkStats, setBulkStats] =
        useState(defaultStats);

    const [userStats, setUserStats] =
        useState(defaultStats);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        fetchDashboardStats();

    }, []);

    const fetchDashboardStats =
        async () => {

            setLoading(true);

            try {

                const [
                    systemRes,
                    customRes,
                    bulkRes,
                    userRes,
                ] = await Promise.all([

                    getAllOrders(
                        'admin_panel'
                    ),

                    getCustomOrders(),

                    getBulkOrders(),

                    getAllOrders(
                        'storefront'
                    ),
                ]);

                /* SYSTEM ORDERS */

                if (systemRes.success) {

                    setSystemStats({
                        total:
                            systemRes.totalOrders || 0,

                        pending:
                            systemRes.pendingOrders || 0,

                        dispatched:
                            systemRes.dispatchedOrders || 0,

                        delivered:
                            systemRes.deliveredOrders || 0,

                        cancelled:
                            systemRes.cancelledOrders || 0,

                        totalRevenue:
                            systemRes.revenue || 0,
                    });
                }

                /* CUSTOM ORDERS */

                if (customRes.success) {

                    setCustomStats({
                        total:
                            customRes.totalOrders || 0,

                        pending:
                            customRes.pendingOrders || 0,

                        dispatched:
                            customRes.dispatchedOrders || 0,

                        delivered:
                            customRes.deliveredOrders || 0,

                        cancelled:
                            customRes.cancelledOrders || 0,

                        totalRevenue:
                            customRes.revenue || 0,
                    });
                }

                /* BULK ORDERS */

                if (bulkRes.success) {

                    setBulkStats({
                        total:
                            bulkRes.totalOrders || 0,

                        pending:
                            bulkRes.pendingOrders || 0,

                        dispatched:
                            bulkRes.dispatchedOrders || 0,

                        delivered:
                            bulkRes.deliveredOrders || 0,

                        cancelled:
                            bulkRes.cancelledOrders || 0,

                        totalRevenue:
                            bulkRes.revenue || 0,
                    });
                }

                /* USER ORDERS */

                if (userRes.success) {

                    setUserStats({
                        total:
                            userRes.totalOrders || 0,

                        pending:
                            userRes.pendingOrders || 0,

                        dispatched:
                            userRes.dispatchedOrders || 0,

                        delivered:
                            userRes.deliveredOrders || 0,

                        cancelled:
                            userRes.cancelledOrders || 0,

                        totalRevenue:
                            userRes.revenue || 0,
                    });
                }

            } catch (error) {

                // console.error(
                //     'Failed to fetch dashboard stats:',
                //     error
                // );

            } finally {

                setLoading(false);
            }
        };

    /* OVERALL TOTALS */

    const overallStats = {

        total:
            systemStats.total +
            userStats.total,

        pending:
            systemStats.pending +
            userStats.pending,

        dispatched:
            systemStats.dispatched +
            userStats.dispatched,

        delivered:
            systemStats.delivered +
            userStats.delivered,

        cancelled:
            systemStats.cancelled +
            userStats.cancelled,

        totalRevenue:
            systemStats.totalRevenue +
            userStats.totalRevenue,
    };

    return (

        <div
            style={{

                height: 'calc(100vh - 120px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: 4,
            }}
        >

            <Space
                direction="vertical"
                size="large"
                style={{
                    display: 'flex',
                    width: '100%',
                }}
            >

                {/* PAGE HEADER */}

                <div>

                    <Title
                        level={4}
                        style={{
                            marginBottom: 3,
                        }}
                    >
                        Orders Dashboard
                    </Title>



                </div>

                {/* OVERALL STATS */}

                <Card title="Overall Orders Summary">

                    <SystemOrdersStats
                        stats={overallStats}
                        loading={loading}
                    />

                </Card>

                {/* ORDER TYPE STATS */}

                <Row gutter={[16, 16]}>

                    {/* SYSTEM ORDERS */}

                    <Col xs={24}>
                        <Card

                            title={
                                <Space>
                                    <CreditCardOutlined />
                                    System Orders
                                </Space>
                            }
                        >
                            <SystemOrdersStats
                                stats={systemStats}
                                loading={loading}
                            />

                        </Card>

                    </Col>

                    {/* CUSTOM ORDERS */}

                    <Col xs={24}>

                        <Card
                            title={
                                <Space>
                                    <FileOutlined />
                                    Custom Orders
                                </Space>
                            }
                        >

                            <SystemOrdersStats
                                stats={customStats}
                                loading={loading}
                            />

                        </Card>

                    </Col>

                    {/* BULK ORDERS */}

                    <Col xs={24}>

                        <Card
                            title={
                                <Space>
                                    <ShoppingCartOutlined />
                                    Bulk Orders
                                </Space>
                            }
                        >
                            <SystemOrdersStats
                                stats={bulkStats}
                                loading={loading}
                            />

                        </Card>

                    </Col>

                    {/* USER ORDERS */}
                    <Col xs={24}>

                        <Card
                            title={
                                <Space>
                                    <UserOutlined />
                                    User Orders
                                </Space>
                            }
                        >

                            <SystemOrdersStats
                                stats={userStats}
                                loading={loading}
                            />

                        </Card>

                    </Col>

                </Row>

            </Space>
        </div>
    );
};

export default OrdersDashboard;