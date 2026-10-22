import "./config/setupApi.js";
import React from "react";
import ReactDOM from "react-dom/client";
import "./app/index.css";
import "./styles/theme.css";
import App from "./app/App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { persistor, store } from "./app/app.store.js";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// Global window scroll & overscroll lock for iOS/iPadOS/Android touch devices
if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      const isScrollable = e.target.closest(
        "main, .overflow-y-auto, .overflow-x-auto, textarea, input, select, [data-scrollable]"
      );
      if (!isScrollable) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Automatically recover if a dynamic module fails to fetch (e.g. server restart, Wi-Fi reconnect)
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    window.location.reload();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      (String(event.reason.message).includes("Failed to fetch dynamically imported module") ||
        String(event.reason.message).includes("error loading dynamically imported module"))
    ) {
      event.preventDefault();
      window.location.reload();
    }
  });
}

const router = createHashRouter([
  {
    path: "/*",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={ store }>
    <PersistGate persistor={ persistor } loading={ null }>
      <ThemeProvider>
        <RouterProvider router={ router } />
      </ThemeProvider>
    </PersistGate>
  </Provider>
);
