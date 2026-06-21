import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api.js";

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wishlist");
    return data.wishlist;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || "Failed to load wishlist");
  }
});

export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      return data.wishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to add to wishlist");
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      return data.wishlist;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to remove from wishlist");
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: [], status: "idle", error: null },
  reducers: {
    resetWishlistState(state) {
      state.items = [];
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        // Route returns the raw array of product ids (not populated) on add.
        // We keep it for reference, but rely on the caller re-fetching for full product data.
        state.idsOnly = action.payload;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const remainingIds = action.payload.map((id) => id.toString());
        state.items = state.items.filter((p) => remainingIds.includes(p._id));
      });
  },
});

export const { resetWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
