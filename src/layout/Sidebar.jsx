import {
  CarOutlined,
  CloseOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MailOutlined,
  ProductOutlined,
  RollbackOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { Badge, Layout, Menu, Modal } from "antd";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../hooks/useAuth";

import "./Sidebar.css";

const { Sider } = Layout;

/* =========================================================
   ADMIN MENU
   ========================================================= */

const ADMIN_MENU = [
  {
    key: "/",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  },

  {
    key: "/products",
    label: "Products",
    icon: <ProductOutlined />,
    children: [
      {
        key: "/products/all",
        label: "All Products",
      },
      {
        key: "/categories",
        label: "Categories",
      },
      {
        key: "/stock",
        label: "Stock Management",
      },
    ],
  },

  {
    key: "/orders",
    label: "Orders",
    icon: <ShoppingOutlined />,
    children: [
      {
        key: "/orders/dashboard",
        label: "Orders Dashboard",
      },
      {
        key: "/orders/system",
        label: "System Orders",
      },
      {
        key: "/orders/bulk",
        label: "Bulk Orders",
      },
      {
        key: "/orders/custom",
        label: "Custom Orders",
      },
      {
        key: "/orders/user",
        label: "User Orders",
      },
      {
        key: "/orders/bulk-enquiries",
        label: "Bulk Order Enquiries",
      },
    ],
  },

  {
    key: "/transactions",
    label: "Transactions",
    icon: <TransactionOutlined />,
  },

  {
    key: "/refunds",
    label: "Refunds",
    icon: <RollbackOutlined />,
  },

  {
    key: "/delivery",
    label: "Delivery",
    icon: <CarOutlined />,
  },

  {
    key: "/customers",
    label: "Customers",
    icon: <UserOutlined />,
  },

  {
    key: "/employees",
    label: "Employees",
    icon: <TeamOutlined />,
  },

  {
    key: "/enquiries",
    label: "Enquiries",
    icon: <MailOutlined />,
  },

  {
    key: "/settings",
    label: "Store Settings",
    icon: <SettingOutlined />,
  },

  {
    key: "logout",
    label: "Logout",
    icon: <LogoutOutlined />,
  },
];

/* =========================================================
   PERMISSION MENU
   =========================================================
   IMPORTANT: the `subModule` strings passed to hasPermission()
   for Orders must match exactly what the API returns in
   permissions[].subModule (system_order, bulk_order,
   custom_order, user_order, bulk_order_enquiry,
   order_dashboard) — mismatched strings silently hide the
   whole Orders menu even when the user has access.
   ========================================================= */

const buildPermissionMenu = (hasPermission) => {
  const items = [];

  /* Dashboard */
  items.push({
    key: "/",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  });

  /* Products */
  if (hasPermission("product", "view")) {
    items.push({
      key: "/products",
      label: "Products",
      icon: <ProductOutlined />,
      children: [
        {
          key: "/products/all",
          label: "All Products",
        },
      ],
    });
  }

  /* Categories */
  if (hasPermission("category", "view")) {
    items.push({
      key: "/categories",
      label: "Categories",
      icon: <ProductOutlined />,
    });
  }

  /* Stock */
  if (hasPermission("stock", "view")) {
    items.push({
      key: "/stock",
      label: "Stock Management",
      icon: <ProductOutlined />,
    });
  }

  /* Orders */
  const orderChildren = [];

  if (hasPermission("order", "view", "order_dashboard")) {
    orderChildren.push({
      key: "/orders/dashboard",
      label: "Orders Dashboard",
    });
  }

  if (hasPermission("order", "view", "system_order")) {
    orderChildren.push({
      key: "/orders/system",
      label: "System Orders",
    });
  }

  if (hasPermission("order", "view", "bulk_order")) {
    orderChildren.push({
      key: "/orders/bulk",
      label: "Bulk Orders",
    });
  }

  if (hasPermission("order", "view", "custom_order")) {
    orderChildren.push({
      key: "/orders/custom",
      label: "Custom Orders",
    });
  }

  if (hasPermission("order", "view", "user_order")) {
    orderChildren.push({
      key: "/orders/user",
      label: "User Orders",
    });
  }

  if (hasPermission("order", "view", "bulk_order_enquiry")) {
    orderChildren.push({
      key: "/orders/bulk-enquiries",
      label: "Bulk Order Enquiries",
    });
  }

  if (orderChildren.length > 0) {
    items.push({
      key: "/orders",
      label: "Orders",
      icon: <ShoppingOutlined />,
      children: orderChildren,
    });
  }

  /* Transactions */
  if (hasPermission("transaction", "view")) {
    items.push({
      key: "/transactions",
      label: "Transactions",
      icon: <TransactionOutlined />,
    });
  }

  /* Refunds */
  if (hasPermission("refund", "view")) {
    items.push({
      key: "/refunds",
      label: "Refunds",
      icon: <RollbackOutlined />,
    });
  }

  /* Delivery */
  if (hasPermission("delivery", "view")) {
    items.push({
      key: "/delivery",
      label: "Delivery",
      icon: <CarOutlined />,
    });
  }

  /* Customers */
  if (hasPermission("customer", "view")) {
    items.push({
      key: "/customers",
      label: "Customers",
      icon: <UserOutlined />,
    });
  }

  /* Employees */
  if (hasPermission("employee", "view")) {
    items.push({
      key: "/employees",
      label: "Employees",
      icon: <TeamOutlined />,
    });
  }

  /* Store Settings */
  if (hasPermission("store_settings", "view")) {
    items.push({
      key: "/settings",
      label: "Store Settings",
      icon: <SettingOutlined />,
    });
  }

  /* Enquiries */
  if (hasPermission("enquiry", "view")) {
    items.push({
      key: "/enquiries",
      label: "Enquiries",
      icon: <MailOutlined />,
    });
  }

  /* Logout */
  items.push({
    key: "logout",
    label: "Logout",
    icon: <LogoutOutlined />,
  });

  return items;
};

/* =========================================================
   SIDEBAR
   ========================================================= */

export default function Sidebar({
  collapsed,
  setCollapsed,
  criticalStock = 0,
  outOfStock = 0,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAdmin, hasPermission, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [openKeys, setOpenKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 768
  );

  const menuRef = useRef(null);

  /* =========================================================
     STOCK ALERT DISMISSAL
     =========================================================
     Dismissing an alert hides it, but only until the underlying
     count actually changes — storing the count at dismiss time
     (rather than a plain boolean) means a NEW out-of-stock item
     showing up later re-surfaces the alert instead of staying
     hidden forever after one dismissal.
     ========================================================= */

  const [dismissedOutOfStockAt, setDismissedOutOfStockAt] = useState(null);
  const [dismissedCriticalAt, setDismissedCriticalAt] = useState(null);

  const showOutOfStockAlert =
    outOfStock > 0 && outOfStock !== dismissedOutOfStockAt;

  const showCriticalAlert =
    criticalStock > 0 && criticalStock !== dismissedCriticalAt;

  /* =========================================================
     WINDOW RESIZE
     ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     MENU
     ========================================================= */

  const items = isAdmin
    ? ADMIN_MENU
    : buildPermissionMenu(hasPermission);

  /* =========================================================
     STOCK ALERT PERMISSION
     ========================================================= */

  const canViewStock = isAdmin || hasPermission("stock", "view");

  /* =========================================================
     ORDERS BADGE
     ========================================================= */

  const isOnOrders = location.pathname.startsWith(
    "/orders/user"
  );

  const ordersBadge = isOnOrders ? 0 : unreadCount;

  /* =========================================================
     INJECT ORDERS BADGE
     ========================================================= */

  useEffect(() => {
    const container = menuRef.current;

    if (!container || collapsed) {
      return;
    }

    const BADGE_ID = "orders-sidebar-badge";

    const orderMenuItem = container.querySelector(
      '[data-menu-id$="/orders"] .ant-menu-title-content'
    );

    if (!orderMenuItem) {
      return;
    }

    orderMenuItem.style.display = "flex";
    orderMenuItem.style.alignItems = "center";
    orderMenuItem.style.justifyContent = "space-between";
    orderMenuItem.style.width = "100%";

    const existing = orderMenuItem.querySelector(
      `#${BADGE_ID}`
    );

    if (existing) {
      existing.remove();
    }

    if (ordersBadge > 0) {
      const badge = document.createElement("span");

      badge.id = BADGE_ID;

      badge.textContent =
        ordersBadge > 99
          ? "99+"
          : String(ordersBadge);

      badge.style.cssText = `
        background: #ff4d4f;
        color: #ffffff;
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        padding: 2px 5px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
        flex-shrink: 0;
        margin-left: 4px;
      `;

      orderMenuItem.appendChild(badge);
    }
  }, [
    ordersBadge,
    collapsed,
    openKeys,
  ]);

  /* =========================================================
     ROOT SUBMENU
     ========================================================= */

  const rootSubmenuKeys = [
    "/products",
    "/orders",
  ];

  /* =========================================================
     MENU CLICK
     ========================================================= */

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      Modal.confirm({
        title: "Logout",
        content: "Are you sure you want to logout?",
        okText: "Logout",
        okButtonProps: {
          danger: true,
        },
        cancelText: "Cancel",

        onOk: () => {
          logout();

          navigate("/login", {
            replace: true,
          });
        },
      });

      return;
    }

    navigate(key);

    if (isMobile) {
      setCollapsed(true);
      setOpenKeys([]);
    }
  };

  /* =========================================================
     STOCK ALERT CLICK — navigates to Stock page pre-filtered
     ========================================================= */

  const handleStockAlertClick = (filterValue) => {
    navigate(`/stock?filter=${filterValue}`);

    if (isMobile) {
      setCollapsed(true);
    }
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <span>
      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            width: "100%",
            height: "calc(100vh - 64px)",
            background: "rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={isMobile ? 0 : 80}
        width={200}
        trigger={null}
        style={{
          position: "fixed",
          left: 0,
          top: 64,
          bottom: 0,
          overflow: "hidden",
          zIndex: 1000,
        }}
      >
        {/* ===================================================
            MAIN SIDEBAR CONTAINER
            =================================================== */}

        <div
          className="premium-sidebar"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
          }}
        >
          {/* =================================================
              BRAND
              ================================================= */}

          <div
            className="premium-sidebar-brand"
            style={{
              height: 32,
              margin: 16,
              background:
                "rgba(255,255,255,0.1)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            {collapsed
              ? "EC"
              : "E-Commerce"}
          </div>

          {/* =================================================
              COLLAPSED ORDERS BADGE
              ================================================= */}

          {collapsed &&
            ordersBadge > 0 && (
              <div
                onClick={() =>
                  navigate("/orders/user")
                }
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 8,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Badge
                  count={ordersBadge}
                  overflowCount={99}
                >
                  <ShoppingOutlined
                    style={{
                      fontSize: 20,
                      color:
                        "rgba(255,255,255,0.65)",
                    }}
                  />
                </Badge>
              </div>
            )}

          {/* =================================================
              SCROLLABLE MENU
              ================================================= */}

          <div
            ref={menuRef}
            className="premium-sidebar-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <Menu
              className="premium-sidebar-menu"
              mode="inline"
              items={items}
              selectedKeys={[
                location.pathname,
              ]}
              openKeys={openKeys}
              onOpenChange={(keys) => {
                const latestOpenKey =
                  keys.find(
                    (key) =>
                      !openKeys.includes(key)
                  );

                setOpenKeys(
                  rootSubmenuKeys.includes(
                    latestOpenKey
                  )
                    ? latestOpenKey
                      ? [latestOpenKey]
                      : []
                    : keys
                );
              }}
              onClick={handleMenuClick}
            />
          </div>

          {/* =================================================
              STOCK ALERTS
              ================================================= */}

          {!collapsed &&
            canViewStock &&
            (showCriticalAlert ||
              showOutOfStockAlert) && (
              <div
                style={{
                  padding:
                    "8px 12px 16px",
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {/* OUT OF STOCK */}

                {showOutOfStockAlert && (
                  <div
                    onClick={() =>
                      handleStockAlertClick("out")
                    }
                    style={{
                      cursor: "pointer",
                      borderRadius: 8,
                      padding:
                        "10px 12px",
                      background:
                        "#fff2f0",
                      border:
                        "1px solid #ffccc7",
                      position: "relative",
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedOutOfStockAt(outOfStock);
                      }}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        cursor: "pointer",
                        color: "#8c8c8c",
                        fontSize: 11,
                        padding: 4,
                        lineHeight: 1,
                      }}
                      title="Dismiss"
                    >
                      <CloseOutlined />
                    </div>

                    <div
                      style={{
                        fontWeight: 600,
                        color:
                          "#cf1322",
                        paddingRight: 16,
                      }}
                    >
                      Out of Stock Alert
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#595959",
                        marginTop: 4,
                      }}
                    >
                      {outOfStock}{" "}
                      products are out
                      of stock
                    </div>
                  </div>
                )}

                {/* CRITICAL STOCK */}

                {showCriticalAlert && (
                  <div
                    onClick={() =>
                      handleStockAlertClick("critical")
                    }
                    style={{
                      cursor: "pointer",
                      borderRadius: 8,
                      padding:
                        "10px 12px",
                      background:
                        "#fffbe6",
                      border:
                        "1px solid #ffe58f",
                      position: "relative",
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedCriticalAt(criticalStock);
                      }}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        cursor: "pointer",
                        color: "#8c8c8c",
                        fontSize: 11,
                        padding: 4,
                        lineHeight: 1,
                      }}
                      title="Dismiss"
                    >
                      <CloseOutlined />
                    </div>

                    <div
                      style={{
                        fontWeight: 600,
                        color:
                          "#d48806",
                        paddingRight: 16,
                      }}
                    >
                      Critical Stock Alert
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color:
                          "#595959",
                        marginTop: 4,
                      }}
                    >
                      {criticalStock}{" "}
                      products need
                      restocking
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </Sider>
    </span>
  );
}