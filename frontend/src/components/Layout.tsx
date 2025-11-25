import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="app-shell">
      {!isAuthPage && (
        <header
          style={{
            backgroundColor: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: "#2563eb" }}>
            AI Document Studio
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user && <span style={{ fontSize: 14 }}>Signed in as {user.email}</span>}
            <button
              className="button secondary"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
      )}
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

