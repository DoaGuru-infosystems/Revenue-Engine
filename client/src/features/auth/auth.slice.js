import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  token: null,
  refreshTable: false,
  walletBalance: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token } = action.payload;
      state.currentUser = user;
      state.token = token;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.token = null;
      state.walletBalance = null;
    },
    toggleRefresh: (state) => {
      state.refreshTable = !state.refreshTable;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, clearUser, toggleRefresh, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
