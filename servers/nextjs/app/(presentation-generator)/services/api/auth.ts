export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  user_id: number;
  username: string;
  session_token: string;
  created_at: string;
  last_login: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  user_id?: number;
  username?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Login with username
 */
export async function login(username: string): Promise<LoginResponse> {
  const response = await fetch(`/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

/**
 * Validate session token
 */
export async function validateSession(
  token: string
): Promise<ValidateSessionResponse> {
  const response = await fetch(`/api/v1/auth/validate`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
}

/**
 * Logout and invalidate session
 */
export async function logout(token: string): Promise<LogoutResponse> {
  const response = await fetch(`/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
}
