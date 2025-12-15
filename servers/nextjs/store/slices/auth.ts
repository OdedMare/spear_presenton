import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  sessionToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  username: null,
  sessionToken: null,
  isLoading: true, // Start as loading to check stored session
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        userId: number;
        username: string;
        sessionToken: string;
      }>
    ) => {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.sessionToken = action.payload.sessionToken;
      state.isLoading = false;
      state.error = null;

      // Store session token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sessionToken", action.payload.sessionToken);
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.username = null;
      state.sessionToken = null;
      state.isLoading = false;
      state.error = null;

      // Remove session token from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("sessionToken");
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setAuthLoading,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
