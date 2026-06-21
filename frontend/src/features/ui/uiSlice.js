import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    appliedCoupon: null, // { code, discountAmount, discountType, discountValue }
  },
  reducers: {
    setAppliedCoupon(state, action) {
      state.appliedCoupon = action.payload;
    },
    clearAppliedCoupon(state) {
      state.appliedCoupon = null;
    },
  },
});

export const { setAppliedCoupon, clearAppliedCoupon } = uiSlice.actions;
export default uiSlice.reducer;
