/**
 * @fileoverview This exports the "parse" function which takes the original
 * formula as a string and tokenizes into typescript objects.
 */

import {
  Operator,
  ParsedValue,
  supportedTrigOps,
  Token,
  Trig,
} from "../types.ts";

function addDecimalIfNone(num: string) {
  if (num.includes(".")) {
    return num;
  }
  return num + ".0";
}

function clean(formula: string) {
  return formula.trim()
    .replaceAll(/(PI|Pi|pi)/g, "(3.14159265359)") // parens to diff between numbers, ex: 2PIx
    .replaceAll(/(?<!c)[Ee](?!i)/g, "(2.71828182846)") // not sure if should do this here or later
    .replaceAll(/-(?=\S)/g, "neg")
    .replaceAll(/\s/g, "");
}

// TODO: handle negative operators = if "-" is touching something else
// then it becomes negative, if "-" is surrounded by space, then it is
// subtraction
type OperatorSymbol = Operator["value"];
const supportedOperators = new Set<OperatorSymbol>(["-", "+", "*", "/"]);
function isOperator(symbol: string): symbol is OperatorSymbol {
  return supportedOperators.has(symbol as OperatorSymbol);
}

export function asTokens(formula: string) {
  const cleanString = clean(formula);
  return parse(cleanString);
}

function parse(rawFormula: string): Token[] {
  const next = rawFormula.slice(0, 1);
  const leader: Token[] = [];
  if (rawFormula?.length === 0) {
    return [];
  } else if (next === "x") {
    leader.push({ type: "x" });
    return leader.concat(parse(rawFormula.slice(1)));
  } else if (isOperator(next)) {
    const { value, rest } = parseOperator(rawFormula);
    return [value].concat(parse(rest));
  } else if (next.match(/\d+/)?.input) {
    const { value, rest } = parseDigit(rawFormula);
    return [value].concat(parse(rest));
  } else if (next === "n") { // negative
    if (rawFormula.slice(0, 3) !== "neg") {
      throw new Error(`unhandled sequence: ${next} in ${rawFormula}`);
    }
    const rest = rawFormula.slice(3);
    leader.push({ type: "negative" });
    return leader.concat(parse(rest));
  } else if (next === "^") {
    const rest = rawFormula.slice(1);
    return [{ type: "power" } as Token].concat(parse(rest));
  } else if (next === "s" || next === "c" || next === "t" || next === "a") { // sin, cos, tan, asin, acos, atan
    const ceilOrSqrt = rawFormula.slice(0, 4);
    if (ceilOrSqrt === "ceil") {
      leader.push({ type: "ceil" });
      return leader.concat(parse(rawFormula.slice(4)));
    }
    if (ceilOrSqrt === "sqrt") {
      leader.push({ type: "sqrt" });
      return leader.concat(parse(rawFormula.slice(4)));
    }
    const maybeArcTrig = ceilOrSqrt as Trig["value"];
    if (supportedTrigOps.has(maybeArcTrig)) {
      leader.push({ type: "trig", value: maybeArcTrig });
      return leader.concat(parse(rawFormula.slice(4)));
    }
    const trigOrAbs = ceilOrSqrt.slice(0, 3);
    const rest = rawFormula.slice(3);
    if (trigOrAbs === "abs") {
      leader.push({ type: "abs" });
      return leader.concat(parse(rawFormula.slice(3)));
    }
    const maybeTrig = trigOrAbs as Trig["value"];
    if (!supportedTrigOps.has(maybeTrig)) {
      throw new Error(`unhandled sequence: ${next} in ${rawFormula}`);
    }
    leader.push({ type: "trig", value: maybeTrig });
    return leader.concat(parse(rest));
  } else if (next === "l") {
    const token = rawFormula.slice(0, 3);
    requireEquals(token, "log", rawFormula);
    leader.push({ type: "log" });
    return leader.concat(parse(rawFormula.slice(3)));
  } else if (next === "(") {
    leader.push({ type: "open" });
    return leader.concat(parse(rawFormula.slice(1)));
  } else if (next === ")") {
    leader.push({ type: "close" });
    return leader.concat(parse(rawFormula.slice(1)));
  } else if (next === "a") {
    const token = rawFormula.slice(0, 3);
    requireEquals(token, "abs", rawFormula);
    leader.push({ type: "abs" });
    return leader.concat(parse(rawFormula.slice(3)));
  } else if (next === "f") {
    const token = rawFormula.slice(0, 5);
    requireEquals(token, "floor", rawFormula);
    leader.push({ type: "floor" });
    return leader.concat(parse(rawFormula.slice(5)));
  } else if (next === "r") {
    const token = rawFormula.slice(0, 5);
    requireEquals(token, "round", rawFormula);
    leader.push({ type: "round" });
    return leader.concat(parse(rawFormula.slice(5)));
  }
  throw new Error(`unhandled character: ${next} in ${rawFormula}`);
}

function requireEquals(token: string, check: string, raw: string) {
  if (token !== check) {
    throw new Error(
      `Unhandled token: ${token} in ${raw}, did you mean ${check}?`,
    );
  }
}

function parseOperator(rest: string): ParsedValue {
  const operator = rest[0];
  if (!isOperator(operator)) {
    throw new Error("incorrect usage, something went wrong");
  }
  rest = rest.slice(1);
  return {
    value: {
      type: "operator",
      value: operator,
    },
    rest,
  };
}

const regex = /^([0-9]+(?:\.[0-9]+)?)(.*)$/;

function parseDigit(rest: string): ParsedValue {
  const match = rest.match(regex);
  if (match) {
    return {
      value: {
        type: "number",
        value: addDecimalIfNone(match[1]),
      } as const,
      rest: match[2],
    };
  } else {
    throw new Error("parseDigit used incorrectly for string: " + rest);
  }
}
