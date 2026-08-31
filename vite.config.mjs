import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const projectRoot = import.meta.dirname;
const buildScript = resolve(projectRoot, "scripts/build.mjs");
const generatedIndex = resolve(projectRoot, "dist/index.html");
const watchedFiles = new Set([
  resolve(projectRoot, "index.html"),
  resolve(projectRoot, "oidc-applications.json"),
]);

function catalogRebuildPlugin() {
  return {
    name: "catalog-rebuild",
    async transformIndexHtml() {
      return readFile(generatedIndex, "utf8");
    },
    configureServer(server) {
      let buildProcess;

      const rebuild = () => {
        if (buildProcess) return;

        buildProcess = spawn(process.execPath, [buildScript], {
          cwd: projectRoot,
          stdio: "inherit",
        });

        buildProcess.on("close", (exitCode) => {
          buildProcess = undefined;
          if (exitCode === 0) {
            server.ws.send({ type: "full-reload" });
          }
        });
      };

      const onFileChange = (changedPath) => {
        if (watchedFiles.has(resolve(changedPath))) {
          rebuild();
        }
      };

      server.watcher.add([...watchedFiles]);
      server.watcher.on("change", onFileChange);
      server.httpServer?.once("close", () => {
        server.watcher.off("change", onFileChange);
        buildProcess?.kill();
      });
    },
  };
}

export default defineConfig({
  root: projectRoot,
  plugins: [catalogRebuildPlugin()],
});
