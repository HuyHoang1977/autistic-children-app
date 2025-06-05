import React, { useState } from "react";
import { loginUser } from "../../services/authService";
import { validateLogin } from "../../services/validation";

interface Props {
  onSuccess: (user: any) => void;
}

const LoginForm: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors = validateLogin({ email, password });
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    try {
      const data = await loginUser(email, password);
      if (data.user_id) {
        onSuccess(data);
      } else {
        setError(data.error || (data.errors && data.errors[0]) || "Đăng nhập thất bại");
      }
    } catch {
      setError("Lỗi kết nối server");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 300 }}>
      <h2>Đăng nhập</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
      <input
        type="password"
        placeholder="Mật khẩu"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
      <button type="submit" style={{ padding: "8px 16px", marginTop: 8 }}>
        Đăng nhập
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default LoginForm;