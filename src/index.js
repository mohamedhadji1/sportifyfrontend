import React from "react"
import ReactDOM from "react-dom/client"
import 'leaflet/dist/leaflet.css'
import "./index.css"
import App from "./App"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "./context/AuthProvider";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
)
