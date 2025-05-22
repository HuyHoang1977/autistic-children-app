import React, { useState } from "react";
import { registerUser } from "../services/authService";
import { validateRegister } from "../services/validation";

interface Props {
  onSuccess: () => void;
}

const RegisterForm: React.FC<Props> = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const errors = validateRegister({ name, email, password });
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    try {
      const data = await registerUser(name, email, password);
      if (data.id) {
        setSuccess("Đăng ký thành công! Bạn có thể đăng nhập.");
        setName("");
        setEmail("");
        setPassword("");
        onSuccess();
      } else {
        setError(data.error || (data.errors && data.errors[0]) || "Đăng ký thất bại");
      }
    } catch {
      setError("Lỗi kết nối server");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 300 }}>
      <h2>Đăng ký</h2>
      <input
        type="text"
        placeholder="Tên"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
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
        Đăng ký
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </form>
  );
};

export default RegisterForm;