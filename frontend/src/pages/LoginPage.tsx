import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError("Unable to log in. Check your credentials and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <div className="card">
        <h2>Welcome back</h2>
        <p>Please sign in to continue.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <button className="button primary" style={{ width: "100%", marginTop: 12 }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

