import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://a6955bc0755674faf988362ae12eb164-929777486.us-east-1.elb.amazonaws.com",
        },
    },
});
