import { login, register } from "../api/authApi";

// Login chỉ cần email và password
export async function loginUser(email: string, password: string) {
  return await login(email, password);
}

// Register nhận object chứa đầy đủ các trường backend yêu cầu
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}) {
  return await register(data);
}