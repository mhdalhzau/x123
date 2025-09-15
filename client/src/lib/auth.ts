import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const TOKEN_KEY = "starpos_token";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Verify token with server
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Invalid token");
        })
        .then((user) => {
          setAuthState({ user, token, isLoading: false });
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setAuthState({ user: null, token: null, isLoading: false });
        });
    } else {
      setAuthState({ user: null, token: null, isLoading: false });
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const { token, user } = await response.json();
    localStorage.setItem(TOKEN_KEY, token);
    setAuthState({ user, token, isLoading: false });
    
    return { user, token };
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Ignore errors during logout
      }
    }
    
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({ user: null, token: null, isLoading: false });
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user,
  };
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
