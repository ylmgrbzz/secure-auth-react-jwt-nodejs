import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

interface ErrorResponse {
  message: string;
  error: string;
  errorType: string;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

// Token doğrulama
export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token bulunamadı");
      }

      const response = await axios.post<AuthResponse>("/api/auth/verify-token");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Token doğrulama hatası" }
      );
    }
  }
);

// Giriş yapma
export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post<AuthResponse>(
        "/api/auth/login",
        credentials
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      return response.data;
    } catch (error: any) {
      const errorData: ErrorResponse = error.response?.data || {
        message: "Giriş başarısız",
        error: "UnknownError",
        errorType: "LoginError",
      };
      return rejectWithValue(errorData);
    }
  }
);

// Kayıt olma
export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: { email: string; password: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post<AuthResponse>(
        "/api/auth/register",
        userData
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      return response.data;
    } catch (error: any) {
      const errorData: ErrorResponse = error.response?.data || {
        message: "Kayıt başarısız",
        error: "UnknownError",
        errorType: "RegistrationError",
      };
      return rejectWithValue(errorData);
    }
  }
);

// Çıkış yapma
export const logoutAsync = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axios.post("/api/auth/logout");
      localStorage.removeItem("token");
      return { message: "Başarıyla çıkış yapıldı" };
    } catch (error: any) {
      const errorData: ErrorResponse = error.response?.data || {
        message: "Çıkış başarısız",
        error: "UnknownError",
        errorType: "LogoutError",
      };
      return rejectWithValue(errorData);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as ErrorResponse)?.message ||
          "Token doğrulama hatası";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as ErrorResponse)?.message || "Giriş başarısız";
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as ErrorResponse)?.message || "Kayıt başarısız";
      })
      // Logout
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as ErrorResponse)?.message || "Çıkış başarısız";
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
