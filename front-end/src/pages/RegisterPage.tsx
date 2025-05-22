import React from "react";
import RegisterForm from "../components/RegisterForm";
import { Link } from "react-router-dom";
import "../App.css";

const RegisterPage: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <RegisterForm onSuccess={() => {}} />
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </header>
    </div>
  );
};

export default RegisterPage;