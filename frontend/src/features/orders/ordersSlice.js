import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api.js";

export const fetchOrders = createAsyncThunk("orders/fetchOrders", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/orders");
    return data.orders;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Failed to load orders");
  }
});

export const fetchOrder = createAsyncThunk("orders/fetchOrder", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Order not found");
  }
});

export const cancelOrder = createAsyncThunk("orders/cancelOrder", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Failed to cancel order");
  }
});

const ordersSlice = createSlice({
  name: "orders",
  initialState: { items: [], current: null, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = state.items.map((o) => (o._id === action.payload._id ? action.payload : o));
      });
  },
});

export default ordersSlice.reducer;
