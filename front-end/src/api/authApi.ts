export async function login(email: string, password: string) {
  const res = await fetch("http://localhost:8000/api/auth/login", {  // ✅ FIX: Added /api prefix
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:3000"  // ✅ ADDED CORS header
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  
  return res.json();
}

export async function register(data: any) {
  const res = await fetch("http://localhost:8000/api/auth/register", {  // ✅ FIX: Added /api prefix
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:3000"  // ✅ ADDED CORS header
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    throw new Error(`Registration failed: ${res.status}`);
  }
  
  return res.json();
}
