import {
  CarOutlined,
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

const ADMIN_MENU = [
  { key: "/", label: "Dashboard", icon: <DashboardOutlined /> },
  {
    key: "/products",
    label: "Products",
    icon: <ProductOutlined />,
    children: [
      { key: "/products/all", label: "All Products" },
      { key: "/categories", label: "Categories" },
      { key: "/stock", label: "Stock Management" },
    ],
  },
  {
    key: "/orders",
    label: "Orders",
    icon: <ShoppingOutlined />,
    children: [
      { key: "/orders/dashboard", label: "Orders Dashboard" },
      { key: "/orders/system", label: "System Orders" },
      { key: "/orders/bulk", label: "Bulk Orders" },
      { key: "/orders/custom", label: "Custom Orders" },
      { key: "/orders/user", label: "User Orders" },
      { key: "/orders/bulk-enquiries", label: "Bulk Order Enquiries" },
    ],
  },
  { key: "/transactions", label: "Transactions", icon: <TransactionOutlined /> },
  {
    key: "/refunds",
    label: "Refunds",
    icon: <RollbackOutlined />
  },
  { key: "/delivery", label: "Delivery", icon: <CarOutlined /> },
  { key: "/customers", label: "Customers", icon: <UserOutlined /> },
  { key: "/employees", label: "Employees", icon: <TeamOutlined /> },
  { key: "/enquiries", label: "Enquiries", icon: <MailOutlined /> },
  { key: "/settings", label: "Store Settings", icon: <SettingOutlined /> },
  { key: "logout", label: "Logout", icon: <LogoutOutlined /> },
];

const buildPermissionMenu = (hasPermission) => {
  const items = [];
  items.push({ key: "/", label: "Dashboard", icon: <DashboardOutlined /> });

  if (hasPermission("product", "view"))
    items.push({
      key: "/products", label: "Products", icon: <ProductOutlined />,
      children: [{ key: "/products/all", label: "All Products" }],
    });
  if (hasPermission("category", "view"))
    items.push({ key: "/categories", label: "Categories", icon: <ProductOutlined /> });
  if (hasPermission("stock", "view"))
    items.push({ key: "/stock", label: "Stock Management", icon: <ProductOutlined /> });

  const orderChildren = [];
  if (hasPermission("order", "view", "system"))
    orderChildren.push({ key: "/orders/system", label: "System Orders" });
  if (hasPermission("order", "view", "bulk"))
    orderChildren.push({ key: "/orders/bulk", label: "Bulk Orders" });
  if (hasPermission("order", "view", "normal"))
    orderChildren.push({ key: "/orders/custom", label: "Normal Orders" });
  if (hasPermission("order", "view", "admin"))
    orderChildren.push({ key: "/orders/user", label: "User Orders" });
  if (orderChildren.length > 0)
    items.push({ key: "/orders", label: "Orders", icon: <ShoppingOutlined />, children: orderChildren });

  if (hasPermission("transaction", "view"))
    items.push({ key: "/transactions", label: "Transactions", icon: <TransactionOutlined /> });

  if (hasPermission("transaction", "view"))
    items.push({
      key: "/refunds",
      label: "Refunds",
      icon: <RollbackOutlined />,
    });

  if (hasPermission("delivery", "view"))
    items.push({ key: "/delivery", label: "Delivery", icon: <CarOutlined /> });

  items.push({ key: "/enquiries", label: "Enquiries", icon: <MailOutlined /> });
  items.push({ key: "logout", label: "Logout", icon: <LogoutOutlined /> });
  return items;
};

export default function Sidebar({ collapsed, setCollapsed, criticalStock = 0, outOfStock = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, hasPermission, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [openKeys, setOpenKeys] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items = isAdmin ? ADMIN_MENU : buildPermissionMenu(hasPermission);

  const isOnOrders = location.pathname.startsWith("/orders/user");
  const ordersBadge = isOnOrders ? 0 : unreadCount;

  // ── Inject badge into Orders menu item via DOM ────────────────────────────
  useEffect(() => {
    const container = menuRef.current;
    if (!container || collapsed) return;

    const BADGE_ID = "orders-sidebar-badge";
    const orderMenuItem = container.querySelector('[data-menu-id$="\/orders"] .ant-menu-title-content');
    if (!orderMenuItem) return;

    orderMenuItem.style.display = "flex";
    orderMenuItem.style.alignItems = "center";
    orderMenuItem.style.justifyContent = "space-between";
    orderMenuItem.style.width = "100%";

    const existing = orderMenuItem.querySelector(`#${BADGE_ID}`);
    if (existing) existing.remove();

    if (ordersBadge > 0) {
      const badge = document.createElement("span");
      badge.id = BADGE_ID;
      badge.textContent = ordersBadge > 99 ? "99+" : String(ordersBadge);
      badge.style.cssText = `
        background: #ff4d4f; color: #fff; font-size: 10px; font-weight: 600;
        line-height: 1; padding: 2px 5px; border-radius: 10px;
        min-width: 18px; text-align: center; flex-shrink: 0; margin-left: 4px;
      `;
      orderMenuItem.appendChild(badge);
    }
  }, [ordersBadge, collapsed, openKeys]);

  const rootSubmenuKeys = ["/products", "/orders"];

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      Modal.confirm({
        title: "Logout",
        content: "Are you sure you want to logout?",
        okText: "Logout",
        okButtonProps: { danger: true },
        cancelText: "Cancel",
        onOk: () => { logout(); navigate("/login", { replace: true }); },
      });
      return;
    }
    navigate(key);
    if (isMobile) { setCollapsed(true); setOpenKeys([]); }
  };

  return (
    <span>
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed", top: 64, left: 0,
            width: "100%", height: "calc(100vh - 64px)",
            background: "rgba(0,0,0,0.3)", zIndex: 1000,
          }}
        />
      )}

      <Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        collapsedWidth={isMobile ? 0 : 80} width={200} trigger={null}
        style={{
          position: "fixed", left: 0, top: 64, bottom: 0,
          display: "flex", flexDirection: "column",
          overflow: "hidden", zIndex: 1000,
        }}
      >
        {/* Brand */}
        <div style={{
          height: 32, margin: 16,
          background: "rgba(255,255,255,0.1)", borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: "bold", flexShrink: 0,
        }}>
          {collapsed ? "EC" : "E-Commerce"}
        </div>

        {/* Collapsed: standalone orders badge */}
        {collapsed && ordersBadge > 0 && (
          <div onClick={() => navigate("/orders/user")} style={{
            display: "flex", justifyContent: "center",
            marginBottom: 8, cursor: "pointer",
          }}>
            <Badge count={ordersBadge} overflowCount={99}>
              <ShoppingOutlined style={{ fontSize: 20, color: "rgba(255,255,255,0.65)" }} />
            </Badge>
          </div>
        )}

        {/* Scrollable menu */}
        <div ref={menuRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <Menu
            className="premium-sidebar-menu"
            mode="inline"
            items={items}
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={(keys) => {
              const latestOpenKey = keys.find((k) => !openKeys.includes(k));
              setOpenKeys(
                rootSubmenuKeys.includes(latestOpenKey)
                  ? latestOpenKey ? [latestOpenKey] : []
                  : keys
              );
            }}
            onClick={handleMenuClick}
          />
        </div>

        {/* Stock alerts */}
        {!collapsed && (criticalStock > 0 || outOfStock > 0) && (
          <div style={{ padding: "8px 12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {outOfStock > 0 && (
              <div onClick={() => navigate("/stock")} style={{
                cursor: "pointer", borderRadius: 8, padding: "10px 12px",
                background: "#fff2f0", border: "1px solid #ffccc7",
              }}>
                <div style={{ fontWeight: 600, color: "#cf1322" }}>Out of Stock Alert</div>
                <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                  {outOfStock} products are out of stock
                </div>
              </div>
            )}
            {criticalStock > 0 && (
              <div onClick={() => navigate("/stock")} style={{
                cursor: "pointer", borderRadius: 8, padding: "10px 12px",
                background: "#fffbe6", border: "1px solid #ffe58f",
              }}>
                <div style={{ fontWeight: 600, color: "#d48806" }}>Critical Stock Alert</div>
                <div style={{ fontSize: 12, color: "#595959", marginTop: 4 }}>
                  {criticalStock} products need restocking
                </div>
              </div>
            )}
          </div>
        )}
      </Sider>
    </span>
  );
}