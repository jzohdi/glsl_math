export type CompilerOptions = {
  debug?: boolean;
};

export type Variable = {
  type: "x";
};
export type Number = {
  type: "number";
  child: string;
};
export type LeftRight = {
  type: "sub" | "add" | "div" | "mult" | "pow";
  left: Expression;
  right: Expression;
};
// a parenthesis always follows certain things like cos,
// but a parenthesis () can be used anywhere to denote a grouping
export type Parenthesis = {
  type: "paren";
  child: Expression;
};
export type Func = {
  type: "function";
  value: "sin" | "cos" | "tan" | "log" | "abs" | "floor" | "round" | "ceil";
  child: Expression;
};
export type Expression = LeftRight | Func | Parenthesis | Variable | Number;

export type Abs = { type: "abs" };
export type Ceil = { type: "ceil" };
export type CloseParen = { type: "close" };
// keeping as string, don't lose leading or trailing zeros
export type DecimalNumber = { type: "number"; value: string };
export type Floor = { type: "floor" };
export type Log = { type: "log" };
export type Negative = { type: "negative" };
export type OpenParen = { type: "open" };
export type Operator = { type: "operator"; value: "-" | "+" | "*" | "/" };
export type Power = { type: "power" };
export type Round = { type: "round" };
export type Trig = { type: "trig"; value: "tan" | "cos" | "sin" };
export type XSymbol = { type: "x" };

export const supportedTrigOps = new Set<Trig["value"]>(["tan", "cos", "sin"]);

export type Token =
  | Abs
  | Ceil
  | CloseParen
  | DecimalNumber
  | Floor
  | Log
  | Negative
  | OpenParen
  | Operator
  | Power
  | Round
  | Trig
  | XSymbol;

export type ParsedValue = {
  value: Token;
  rest: string;
};
