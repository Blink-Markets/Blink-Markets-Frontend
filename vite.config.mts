import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/salt": {
        target: "https://salt.api.mystenlabs.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/salt/, "/get_salt"),
      },
    },
  },
});
