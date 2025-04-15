import { assertEquals } from "@std/assert";
import compileToGlsl from "./main.ts";
import { findRoot } from "./lib/tokens_to_ast.ts";
import { asTokens } from "./lib/string_to_tokens.ts";
import { Operator } from "./types.ts";
import { fail } from "@std/assert/fail";

Deno.test("Tests basic functionality and syntax", function basicCases() {
  assertEquals(compileToGlsl("2 + 2"), "2.0+2.0");
  assertEquals(compileToGlsl("2x + x^2"), "2.0*x+pow(x,2.0)");
  assertEquals(compileToGlsl("2x - x^2"), "2.0*x-pow(x,2.0)");
  assertEquals(compileToGlsl("2x"), "2.0*x");
  assertEquals(compileToGlsl("Ex"), "(2.71828182846)*x");
  assertEquals(
    compileToGlsl("tan(x)^PIlog(x)"),
    "pow(tan(x),(3.14159265359)*log(x))",
  );
  assertEquals(compileToGlsl("sin(x)"), "sin(x)");
  assertEquals(compileToGlsl("x^sin(x)cos(x)"), "pow(x,sin(x)*cos(x))");
  assertEquals(compileToGlsl("abs(-x/2^x)"), "abs(-1.0*x/pow(2.0,x))");
  assertEquals(compileToGlsl("-x^2"), "pow(-1.0*x,2.0)");
  assertEquals(compileToGlsl("sin(x)*x^2"), "sin(x)*pow(x,2.0)");
  assertEquals(
    compileToGlsl("floor(ceil(round(x^2 + sqrt(ceil(x)))))"),
    "floor(ceil(round(pow(x,2.0)+sqrt(ceil(x)))))",
  );
  assertEquals(
    compileToGlsl("acos(atan(asin(x)))"),
    "acos(atan(asin(x)))",
  );
});

Deno.test("Tests that subtraction is handled properly vs negative sign", function subtractionVsNegative() {
  assertEquals(compileToGlsl("-2x"), "-1.0*2.0*x");
  assertEquals(compileToGlsl("x^-2"), "pow(x,-1.0*2.0)");
  assertEquals(compileToGlsl("-sin(x)"), "-1.0*sin(x)");
  assertEquals(
    compileToGlsl("log(x)^sin(x) - cos(x)"),
    "pow(log(x),sin(x))-cos(x)",
  );
});

Deno.test("Tests recursive cases", () => {
  assertEquals(
    compileToGlsl("-32E^E^log(tan(x/32e))sin(x)+2x", { debug: true }),
    "pow(-1.0*32.0*(2.71828182846),pow((2.71828182846),log(tan(x/32.0*(2.71828182846)))*sin(x)))+2.0*x",
  );
});

Deno.test("find root, when root is + op", () => {
  const tokens = asTokens("(x + 2)/3log(x) + x");
  const root = findRoot(tokens);
  if (root === null) {
    fail("root not found");
  }
  const rootToken = tokens[root.index];
  assertEquals(
    rootToken.type,
    "operator",
  );
  assertEquals(root.index, 11);
});

Deno.test("find root, when surrounded by paren", () => {
  const tokens = asTokens("((x + 2)/3log(x) + x)");
  const root = findRoot(tokens);
  if (root === null) {
    fail("root not found");
  }
  const rootToken = tokens[root.index];
  assertEquals(
    rootToken.type,
    "open",
  );
  assertEquals(root.index, 0);
});

Deno.test("find root, when division near end", () => {
  const tokens = asTokens("(x + 2)log(x)-2EPitan(x)sin(x)/2");
  const root = findRoot(tokens);
  if (root === null) {
    fail("root not found");
  }
  const rootToken = tokens[root.index];
  assertEquals(
    rootToken.type,
    "operator",
  );
  assertEquals((rootToken as Operator).value, "/");
  assertEquals(root.index, 25);
});
