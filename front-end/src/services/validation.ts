export function validateLogin(data: { email: string; password: string }) {
  const errors: string[] = [];
  if (!data.email) errors.push("Email is required.");
  if (!data.password) errors.push("Password is required.");
  return errors;
}

export function validateRegister(data: { name: string; email: string; password: string }) {
  const errors: string[] = [];
  if (!data.name) errors.push("Name is required.");
  if (!data.email) errors.push("Email is required.");
  if (!data.password) errors.push("Password is required.");
  return errors;
}