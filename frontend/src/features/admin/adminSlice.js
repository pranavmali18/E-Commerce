import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api.js";

// --- Products ---
export const adminFetchProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/products", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load products");
    }
  }
);

export const adminCreateProduct = createAsyncThunk(
  "admin/createProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/admin/products", payload);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to create product");
    }
  }
);

export const adminUpdateProduct = createAsyncThunk(
  "admin/updateProduct",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admin/products/${id}`, updates);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update product");
    }
  }
);

export const adminDeleteProduct = createAsyncThunk(
  "admin/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/products/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to delete product");
    }
  }
);

// --- Orders ---
export const adminFetchOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/orders", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load orders");
    }
  }
);

export const adminUpdateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
      return data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update order status");
    }
  }
);

// --- Users ---
export const adminFetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/users", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load users");
    }
  }
);

export const adminSetUserStatus = createAsyncThunk(
  "admin/setUserStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update user");
    }
  }
);

export const adminSetUserRole = createAsyncThunk(
  "admin/setUserRole",
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update user role");
    }
  }
);

// --- Coupons ---
export const adminFetchCoupons = createAsyncThunk(
  "admin/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/coupons");
      return data.coupons;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load coupons");
    }
  }
);

export const adminCreateCoupon = createAsyncThunk(
  "admin/createCoupon",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/admin/coupons", payload);
      return data.coupon;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to create coupon");
    }
  }
);

export const adminDeleteCoupon = createAsyncThunk(
  "admin/deleteCoupon",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/admin/coupons/${id}`);
      return data.coupon;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to delete coupon");
    }
  }
);

// --- Dashboard ---
export const adminFetchDashboardSummary = createAsyncThunk(
  "admin/fetchDashboardSummary",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/dashboard/summary");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load dashboard");
    }
  }
);

export const adminFetchRevenueTrend = createAsyncThunk(
  "admin/fetchRevenueTrend",
  async (days = 30, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/dashboard/revenue-trend", { params: { days } });
      return data.trend;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load revenue trend");
    }
  }
);

export const adminFetchTopProducts = createAsyncThunk(
  "admin/fetchTopProducts",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/dashboard/top-products");
      return data.topProducts;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load top products");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    products: [],
    productsPagination: { page: 1, totalPages: 1, total: 0 },
    orders: [],
    ordersPagination: { page: 1, totalPages: 1, total: 0 },
    users: [],
    usersPagination: { page: 1, totalPages: 1, total: 0 },
    coupons: [],
    summary: null,
    revenueTrend: [],
    topProducts: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Products
      .addCase(adminFetchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.productsPagination = action.payload.pagination;
      })
      .addCase(adminCreateProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      .addCase(adminUpdateProduct.fulfilled, (state, action) => {
        state.products = state.products.map((p) => (p._id === action.payload._id ? action.payload : p));
      })
      .addCase(adminDeleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      // Orders
      .addCase(adminFetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders;
        state.ordersPagination = action.payload.pagination;
      })
      .addCase(adminUpdateOrderStatus.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) => (o._id === action.payload._id ? action.payload : o));
      })
      // Users
      .addCase(adminFetchUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(adminSetUserStatus.fulfilled, (state, action) => {
        state.users = state.users.map((u) => (u._id === action.payload._id ? action.payload : u));
      })
      .addCase(adminSetUserRole.fulfilled, (state, action) => {
        state.users = state.users.map((u) => (u._id === action.payload._id ? action.payload : u));
      })
      // Coupons
      .addCase(adminFetchCoupons.fulfilled, (state, action) => {
        state.coupons = action.payload;
      })
      .addCase(adminCreateCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload);
      })
      .addCase(adminDeleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.map((c) => (c._id === action.payload._id ? action.payload : c));
      })
      // Dashboard
      .addCase(adminFetchDashboardSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(adminFetchRevenueTrend.fulfilled, (state, action) => {
        state.revenueTrend = action.payload;
      })
      .addCase(adminFetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload;
      })
      // Generic error capture
      .addMatcher(
        (a) => a.type.startsWith("admin/") && a.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export default adminSlice.reducer;
