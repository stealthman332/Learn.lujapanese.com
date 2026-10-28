import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const isDev = process.argv.includes("--dev");

// Clean and prepare dist directory
if (!existsSync("dist")) {
  mkdirSync("dist", { recursive: true });
}

console.log(`Building MASU · JLC (${isDev ? "development" : "production"})...`);

try {
  // 1. Bundle JavaScript
  await esbuild.build({
    entryPoints: ["src/app.js"],
    bundle: true,
    outfile: "dist/app.js",
    format: "esm",
    target: ["es2022"],
    minify: false,
    sourcemap: isDev,
    logLevel: "info"
  });

  // 2. Bundle CSS
  await esbuild.build({
    entryPoints: ["src/css/index.css"],
    bundle: true,
    outfile: "dist/app.css",
    minify: false,
    sourcemap: isDev,
    logLevel: "info"
  });

  // 3. Copy public files into dist/
  cpSync("public", "dist", { recursive: true });

  // 4. Copy data/ into dist/data/
  mkdirSync("dist/data", { recursive: true });
  cpSync("data", "dist/data", { recursive: true });

  // Print asset summary
  console.log("\n📦 Build completed successfully! Output in dist/:");
  const files = readdirSync("dist");
  for (const f of files) {
    const s = statSync(join("dist", f));
    if (s.isFile()) {
      console.log(`  • ${f.padEnd(24)} ${(s.size / 1024).toFixed(1)} KB`);
    } else if (s.isDirectory()) {
      const sub = readdirSync(join("dist", f));
      console.log(`  • ${f}/ (${sub.length} files)`);
    }
  }

  if (isDev) {
    const ctx = await esbuild.context({
      entryPoints: ["src/app.js"],
      bundle: true,
      outfile: "dist/app.js",
      format: "esm",
      sourcemap: true
    });
    const { host, port } = await ctx.serve({
      servedir: "dist",
      port: 8080
    });
    console.log(`\n🚀 Dev server running at http://${host || "localhost"}:${port}/`);
  }
} catch (err) {
  console.error("Build failed:", err);
  process.exit(1);
}
