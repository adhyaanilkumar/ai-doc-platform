import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ email, password, full_name: fullName });
      navigate("/");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || "Unable to create account. Please try again.";
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <div className="card">
        <h2>Create an account</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

