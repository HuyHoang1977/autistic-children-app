import { login, register } from "../api/authApi";

export async function loginUser(email: string, password: string) {
  return await login(email, password);
}

export async function registerUser(name: string, email: string, password: string) {
  return await register(name, email, password);
}