import React from "react";
import LoginForm from "../components/LoginForm";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="App">
      <header className="App-header">
        <LoginForm onSuccess={() => navigate("/")} />
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </header>
    </div>
  );
};

export default LoginPage;