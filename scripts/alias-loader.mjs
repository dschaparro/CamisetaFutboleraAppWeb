import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC = path.resolve(import.meta.dirname, "..", "src");

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }

  const rest = specifier.slice(2);
  const withExt = path.extname(rest) ? rest : `${rest}.ts`;
  return nextResolve(pathToFileURL(path.join(SRC, withExt)).href, context);
}
