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
