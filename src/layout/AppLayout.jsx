import { Layout } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ApplicationTag from "../components/Tag";
import { NotificationProvider } from "../context/NotificationContext";
import { useAuth } from "../hooks/useAuth";
import useStockManager from "../hooks/useStockManager";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";

const { Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { stockStats } = useStockManager();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    // NotificationProvider wraps everything so both HeaderBar and Sidebar
    // share a single WebSocket connection and the same notification state.
    <NotificationProvider>
      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        <ApplicationTag />

        <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />

        <Layout
          style={{
            marginTop: 2,
            marginLeft: window.innerWidth < 768 ? 0 : collapsed ? 80 : 200,
            transition: "all .2s",
          }}
        >
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            criticalStock={stockStats.critical}
            outOfStock={stockStats.outOfStock}
          />

          <Content
            style={{
              margin: window.innerWidth < 768 ? 8 : 16,
              padding: window.innerWidth < 768 ? 12 : 16,
              height: "calc(100vh - 70px)",
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </NotificationProvider>
  );
}