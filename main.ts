import compile from "./lib/ast_to_string.ts";
import { asTokens } from "./lib/string_to_tokens.ts";
import { makeSyntaxTree } from "./lib/tokens_to_ast.ts";
import { CompilerOptions } from "./types.ts";

/**
 * Takes a formula such as: x^2, x + 2, sin(x) x^sin(x)cos(x)
 * and converts to a GLSL compatible formula such as:
 * pow(x, 2.0), x + 2.0, sin(x), pow(x, sin(x) * cos(x))
 * @param formula
 */
export default function compileToGlslFormula(
  formula: string,
  options?: CompilerOptions,
) {
  const tokens = asTokens(formula);

  if (options?.debug) {
    console.log(JSON.stringify({ tokens }, null, 4));
  }

  const ast = makeSyntaxTree(tokens);

  if (ast === null) {
    return "";
  }

  if (options?.debug) {
    console.log(JSON.stringify(ast, null, 4));
  }

  const result = compile(ast);

  return result;
}
