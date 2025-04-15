// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./main.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "glsl_math",
    version: Deno.args[0],
    description:
      "Transforms human-readable mathematical expressions into GLSL shader code. Enter formulas like x^(-2cos(x)) and receive a GLSL-compatible string that is ready for use in WebGL projects and real‑time graphics applications.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/jzohdi/glsl_math.git",
    },
    bugs: {
      url: "https://github.com/jzohdi/glsl_math/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
