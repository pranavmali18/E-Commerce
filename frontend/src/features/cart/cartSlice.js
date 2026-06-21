import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api.js";

export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/cart");
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Failed to load cart");
  }
});

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/cart/items", { productId, quantity });
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to add to cart");
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to update cart");
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/cart/items/${productId}`);
      return data.cart;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to remove item");
    }
  }
);

export const clearCart = createAsyncThunk("cart/clearCart", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete("/cart");
    return data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Failed to clear cart");
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    actionStatus: "idle", // for add/update/remove, separate from initial load
  },
  reducers: {
    resetCartState(state) {
      state.items = [];
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.items || [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addMatcher(
        (a) =>
          ["cart/addToCart/fulfilled", "cart/updateCartItem/fulfilled", "cart/removeCartItem/fulfilled", "cart/clearCart/fulfilled"].includes(
            a.type
          ),
        (state, action) => {
          state.actionStatus = "succeeded";
          state.items = action.payload?.items || [];
        }
      )
      .addMatcher(
        (a) => a.type.startsWith("cart/") && a.type.endsWith("/rejected") && a.type !== "cart/fetchCart/rejected",
        (state, action) => {
          state.actionStatus = "failed";
          state.error = action.payload;
        }
      );
  },
});

export const { resetCartState } = cartSlice.actions;
export default cartSlice.reducer;
