import { Expression } from "../types.ts";

export default function compile(ast: Expression): string {
  switch (ast.type) {
    case "mult":
      return compile(ast.left) + "*" + compile(ast.right);
    case "number":
      return ast.child;
    case "add":
      return compile(ast.left) + "+" + compile(ast.right);
    case "sub":
      return compile(ast.left) + "-" + compile(ast.right);
    case "div":
      return compile(ast.left) + "/" + compile(ast.right);
    case "pow":
      return `pow(${compile(ast.left)},${compile(ast.right)})`;
    case "paren":
      return `(${compile(ast.child)})`;
    case "function":
      return `${ast.value}(${compile(ast.child)})`;
    case "x":
      return "x";
  }
  throw new Error("unsupported compile operation: " + JSON.stringify(ast));
}
