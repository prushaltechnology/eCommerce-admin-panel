// import { CloseOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
// import { Avatar, Dropdown, Layout } from "antd";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";

// const { Header } = Layout;

// const getGreeting = () => {
//   const hour = new Date().getHours();
//   if (hour < 12) return "Good Morning";
//   if (hour < 18) return "Good Afternoon";
//   return "Good Evening";
// };

// const getDisplayName = (user) =>
//   user?.displayName || user?.first_name || user?.firstName || user?.name || "Admin";

// export default function HeaderBar({ collapsed, setCollapsed }) {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const userMenuItems = [
//     {
//       key: "profile",
//       icon: <UserOutlined />,
//       label: "Profile",
//       onClick: () => navigate("/profile"),
//     },
//     {
//       key: "settings",
//       icon: <UserOutlined />,
//       label: "Settings",
//       onClick: () => navigate("/settings"),
//     },
//     {
//       type: "divider",
//     },
//     {
//       key: "logout",
//       icon: <LogoutOutlined />,
//       label: "Logout",
//       onClick: handleLogout,
//     },
//   ];

//   return (
//     <Header
//       style={{
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         color: "#fff",
//         position: "sticky",
//         top: 0,
//         zIndex: 1000,
//         width: "100%",
//         padding: "0 16px",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           minWidth: 0,
//           flex: 1,
//         }}
//       >
//         {collapsed ? (
//           <MenuOutlined
//             onClick={() => setCollapsed(false)}
//             style={{ fontSize: 20, cursor: "pointer" }}
//           />
//         ) : (
//           <CloseOutlined
//             onClick={() => setCollapsed(true)}
//             style={{ fontSize: 20, cursor: "pointer" }}
//           />
//         )}

//         <div
//           style={{
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             fontWeight: 600,
//             fontSize: 18,
//           }}
//         >
//           {user &&
//             (isMobile
//               ? `Flower's Admin - ${getDisplayName(user)}`
//               : `Flower's Admin - ${getGreeting()}, ${getDisplayName(user)}`)}
//         </div>
//       </div>

//       <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
//         <Avatar
//           size="large"
//           icon={<UserOutlined />}
//           style={{
//             backgroundColor: "#ffffff",
//             color: "#727bd8",
//             cursor: "pointer",
//             flexShrink: 0,
//           }}
//         />
//       </Dropdown>
//     </Header>
//   );
// }



import { CloseOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Layout } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../hooks/useAuth";

const { Header } = Layout;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const getDisplayName = (user) =>
  user?.displayName || user?.first_name || user?.firstName || user?.name || "Admin";

export default function HeaderBar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Profile", onClick: () => navigate("/profile") },
    { key: "settings", icon: <UserOutlined />, label: "Settings", onClick: () => navigate("/settings") },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Logout", onClick: handleLogout },
  ];

  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        padding: "0 16px",
      }}
    >
      {/* Left: hamburger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        {collapsed ? (
          <MenuOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 20, cursor: "pointer" }} />
        ) : (
          <CloseOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 20, cursor: "pointer" }} />
        )}
        <div style={{
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontWeight: 600, fontSize: 18,
        }}>
          {user && (isMobile
            ? `Flower's Admin - ${getDisplayName(user)}`
            : `Flower's Admin - ${getGreeting()}, ${getDisplayName(user)}`
          )}
        </div>
      </div>

      {/* Right: bell + avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          height: '100%',
        }}
      >
        <NotificationBell />

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            size={42}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#fff',
              color: '#727bd8',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      </div>
    </Header>
  );
}