import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api.js";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/products", { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to load products");
    }
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${slug}`);
      return data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Product not found");
    }
  }
);

export const fetchCategories = createAsyncThunk("products/fetchCategories", async () => {
  const { data } = await api.get("/products/categories");
  return data;
});

export const submitReview = createAsyncThunk(
  "products/submitReview",
  async ({ slug, rating, comment }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/products/${slug}/reviews`, { rating, comment });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Failed to submit review");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    categories: [],
    brands: [],
    current: null,
    listStatus: "idle",
    detailStatus: "idle",
    reviewStatus: "idle",
    error: null,
  },
  reducers: {
    clearCurrentProduct(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.listStatus = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.detailStatus = "loading";
        state.current = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.brands = action.payload.brands;
      })
      .addCase(submitReview.pending, (state) => {
        state.reviewStatus = "loading";
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviewStatus = "succeeded";
        if (state.current) {
          state.current.reviews = action.payload.reviews;
          state.current.ratingAverage = action.payload.ratingAverage;
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.reviewStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
