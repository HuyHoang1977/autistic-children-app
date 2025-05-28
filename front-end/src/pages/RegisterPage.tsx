import React, { useState } from "react";
import RegisterForm from "../components/RegisterForm";
import { Link } from "react-router-dom";
import "../App.css";

const RegisterPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  return (
    <div className="App">
      <header className="App-header">
        {!user ? (
          <>
            <RegisterForm onSuccess={setUser} />
            <p>
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </>
        ) : (
          <div>
            <h2>Đăng ký thành công!</h2>
            <pre style={{ textAlign: "left", background: "#222", padding: 16, borderRadius: 8, color: "#fff" }}>
              {JSON.stringify(user, null, 2)}
            </pre>
            <p>
              <Link to="/login" style={{ color: "#61dafb" }}>Đăng nhập tài khoản khác</Link>
            </p>
          </div>
        )}
      </header>
    </div>
  );
};

export default RegisterPage;