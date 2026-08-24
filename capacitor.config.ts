import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.roca.coleta",
  appName: "Roca Coleta",
  webDir: "dist",

  server: {
    androidScheme: "http",
  },
};

export default config;