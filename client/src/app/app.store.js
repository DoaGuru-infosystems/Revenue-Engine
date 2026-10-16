import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "../redux/user/userSlice.js";
import { persistReducer, persistStore, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Strip transient loading and error states during both inbound (save) and outbound (load) persistence
const userTransform = createTransform(
  (inboundState, key) => {
    if (key === "user" && inboundState) {
      return {
        ...inboundState,
        loading: false,
        error: null,
      };
    }
    return inboundState;
  },
  (outboundState, key) => {
    if (key === "user" && outboundState) {
      return {
        ...outboundState,
        loading: false,
        error: null,
      };
    }
    return outboundState;
  }
);

const rootReducer = combineReducers({ user: userReducer });

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  transforms: [userTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export default store;
