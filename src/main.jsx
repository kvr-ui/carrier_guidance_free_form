import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "./index.css";
import CareerGuidance from "./pages/CareerGuidance";
import Success from "./pages/Success";
import Admin from "./pages/Admin";

const router = createBrowserRouter([
  { path: "/", element: <CareerGuidance /> },
  { path: "/success", element: <Success /> },
  { path: "/admin", element: <Admin /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
