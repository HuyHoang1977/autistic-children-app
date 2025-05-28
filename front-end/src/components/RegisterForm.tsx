import React, { useState } from "react";
import { registerUser } from "../services/authService";

interface Props {
  onSuccess: (user: any) => void;
}

const RegisterForm: React.FC<Props> = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userType, setUserType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate đơn giản
    if (!username || !email || !password || !avatarUrl|| !fullName || !phone) { 
      setError("Vui lòng nhập đầy đủ username, email, password!");
      return;
    }

    try {
      const data = await registerUser({
        username,
        email,
        password,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      });
      if (data.user_id) {
        onSuccess(data);
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
        placeholder="Tên đăng nhập"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
      <input
        type="text"
        placeholder="Họ tên"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
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
      <input
        type="text"
        placeholder="Số điện thoại"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
      <input
        type="text"
        placeholder="Avatar URL"
        value={avatarUrl}
        onChange={e => setAvatarUrl(e.target.value)}
        style={{ margin: "8px 0", padding: "8px", width: "100%" }}
      />
      <button type="submit" style={{ padding: "8px 16px", marginTop: 8 }}>
        Đăng ký
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default RegisterForm;