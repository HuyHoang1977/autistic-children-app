import React, { useState } from "react";
import LoginForm from "../components/forms/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

const LoginPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    // Nếu là admin thì chuyển hướng sang /admin, ngược lại sang /
    if (
      userData.role &&
      (userData.role.role_name === "Admin" || userData.user_type === 1)
    ) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <LoginForm onSuccess={handleLoginSuccess} />
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </header>
    </div>
  );
};

export default LoginPage;