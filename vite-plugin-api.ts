import { createJiti } from "jiti";
import path from "path";
import type { Plugin } from "vite";

const jiti = createJiti(import.meta.url, { interopDefault: true });
const serverRoot = path.resolve(process.cwd(), "server");

export const vitePluginApi = (): Plugin => ({
  name: "vite-plugin-api",
  configureServer(viteServer) {
    let isDatabaseReady = false;

    viteServer.middlewares.use((request, response, next) => {
      if (!request.url?.startsWith("/api")) {
        next();
        return;
      }

      void (async () => {
        try {
          if (!isDatabaseReady) {
            jiti(`${serverRoot}/config/env.ts`);
            const bootstrapModule = jiti(`${serverRoot}/bootstrap.ts`) as {
              bootstrapDatabase: () => Promise<void>;
            };
            await bootstrapModule.bootstrapDatabase();
            isDatabaseReady = true;
          }

          const appModule = jiti(`${serverRoot}/app.ts`) as {
            createApp: () => (
              request: Parameters<typeof next>[0],
              response: Parameters<typeof next>[1],
              nextFn: typeof next
            ) => void;
          };
          appModule.createApp()(request, response, next);
        } catch (error) {
          console.error("API middleware error:", error);
          response.statusCode = 500;
          response.end("Internal Server Error");
        }
      })();
    });
  },
});
