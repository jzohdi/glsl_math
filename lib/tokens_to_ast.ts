/**
 * @fileoverview This exports a function to take an array of tokens
 * and transforms into AST structure. The algorithm does a three pass
 * technique.
 * The first pass: parse +, - as these symbols break an expression into separate discrete parts
 * The second pass: parse ^, / as these have strict left/right requirements.
 * The third pass: parse all other: (), log, tan, sin, *, etc. as these will be recursive or be multiplications of eachother
 */
import { Expression, Func, LeftRight, Operator, Token } from "../types.ts";

// TODO: simplify that this is just everything except LeftRight
export const typesThatDontRequireNext = new Set<Expression["type"]>([
  "x",
  "function",
  "paren",
  "number",
]);

/**
 * This function takes lexed tokens and returns a syntax tree.
 * Input will be for example tan, (, x, ), ^, ( , 2.343, ), log, (, x, )
 *
 * Things with a left and right hand: +, *, -, /, pow,
 * Things with a single child: sin, cos, tan, log, ()
 * Things with no children: x (variable), number
 */
export function makeSyntaxTree(tokens: Token[]): Expression | null {
  const expressionRoot = findRoot(tokens);
  if (expressionRoot === null) {
    return null;
  }
  const rootToken = tokens[expressionRoot.index];
  if (rootToken.type === "operator") {
    return parseOperator(rootToken, expressionRoot, tokens);
  }
  if (rootToken.type === "power") {
    return parsePower(expressionRoot, tokens);
  }
  if (rootToken.type === "negative") {
    const right = makeSyntaxTree(tokens.slice(1));
    if (right === null) {
      throw new Error(
        "Something went wrong, can't find a right side for negative symbol at: " +
          JSON.stringify(expressionRoot),
      );
    }
    return multWithRight({ type: "number", child: "-1.0" }, right);
  }
  if (rootToken.type === "x") {
    const right = makeSyntaxTree(tokens.slice(1));
    return multWithRight({ type: "x" }, right);
  }
  if (rootToken.type === "number") {
    const right = makeSyntaxTree(tokens.slice(1));
    return multWithRight({ type: "number", child: rootToken.value }, right);
  }
  if (rootToken.type === "open") {
    const { endIndex, child } = parseFunctionBody(tokens, expressionRoot);
    const expression = {
      type: "paren",
      child,
    } as const;
    const rightSide = makeSyntaxTree(tokens.slice(endIndex + 1));
    return multWithRight(expression, rightSide);
  }
  if (rootToken.type === "log") {
    return parseFunction(tokens, expressionRoot, "log");
  }
  if (rootToken.type === "trig") {
    return parseFunction(tokens, expressionRoot, rootToken.value);
  }
  if (rootToken.type === "abs") {
    return parseFunction(tokens, expressionRoot, "abs");
  }
  if (rootToken.type === "ceil") {
    return parseFunction(tokens, expressionRoot, "ceil");
  }
  if (rootToken.type === "floor") {
    return parseFunction(tokens, expressionRoot, "floor");
  }
  if (rootToken.type === "round") {
    return parseFunction(tokens, expressionRoot, "round");
  }
  if (rootToken.type === "sqrt") {
    return parseFunction(tokens, expressionRoot, "sqrt");
  }
  throw new Error(
    "Could not complete parsing of expression: " + rootToken.type,
  );
}

function parseFunction(
  tokens: Token[],
  expressionRoot: ExpressionRoot,
  functionValue: Func["value"],
) {
  const { endIndex, child } = parseFunctionBody(tokens, expressionRoot, 1);
  const expression = {
    type: "function",
    value: functionValue,
    child,
  } as const;
  const rightSide = makeSyntaxTree(tokens.slice(endIndex + 1));
  return multWithRight(expression, rightSide);
}

function parseFunctionBody(
  tokens: Token[],
  expressionRoot: ExpressionRoot,
  parenthesisOffset?: number,
) {
  const endIndex = findMatchingClose(tokens, expressionRoot.index);
  if (endIndex === null) {
    throw new Error(
      "Could find matching close paren for open at index = " +
        expressionRoot.index,
    );
  }

  const child = makeSyntaxTree(
    tokens.slice(expressionRoot.index + 1 + (parenthesisOffset ?? 0), endIndex),
  ); // don't include the beginning "("" or end ")"
  if (child === null) {
    throw new Error(
      `Missing function body between parenthesis between: ${expressionRoot.index} and ${endIndex}`,
    );
  }
  return { endIndex, child };
}

function multWithRight(
  expression: Expression,
  rightSide: Expression | null,
): Expression {
  if (rightSide === null) {
    return expression;
  }
  return {
    type: "mult",
    left: expression,
    right: rightSide,
  };
}

function parsePower(expressionRoot: ExpressionRoot, tokens: Token[]) {
  const left = makeSyntaxTree(tokens.slice(0, expressionRoot.index)); // don't include the rootToken (param)
  const right = makeSyntaxTree(tokens.slice(expressionRoot.index + 1)); // don't include the rootToken (param);
  if (left === null || right === null) {
    throw new Error(
      "Operator expects valid left and right hand side expressions at: " +
        JSON.stringify(expressionRoot),
    );
  }
  return {
    type: "pow",
    left,
    right,
  } as const;
}

// Operator
function parseOperator(
  rootToken: Operator,
  expressionRoot: ExpressionRoot,
  tokens: Token[],
) {
  const left = makeSyntaxTree(tokens.slice(0, expressionRoot.index)); // don't include the rootToken (param)
  const right = makeSyntaxTree(tokens.slice(expressionRoot.index + 1)); // don't include the rootToken (param);
  if (left === null || right === null) {
    throw new Error(
      "Operator expects valid left and right hand side expressions at: " +
        JSON.stringify(expressionRoot),
    );
  }
  return {
    type: getTypeFromOperator(rootToken),
    left,
    right,
  };
}

function getTypeFromOperator(token: Operator): LeftRight["type"] {
  if (token.value === "*") {
    return "mult";
  }
  if (token.value === "/") {
    return "div";
  }
  if (token.value === "+") {
    return "add";
  }
  return "sub";
}

function findMatchingClose(tokens: Token[], startIndex?: number) {
  let numOpen = 0;
  for (let i = startIndex ?? 0; i < tokens.length; i++) {
    if (tokens[i].type === "open") {
      numOpen += 1;
      continue;
    }
    if (tokens[i].type === "close") {
      numOpen -= 1;
      if (numOpen === 0) {
        return i;
      }
      if (numOpen < 0) {
        throw new Error("number of closing parenthesis exceeds number of open");
      }
    }
  }
  return null;
}

/**
 * (x + 2)/3log(x) + x
 * does every expression have a "root"? ->
 * here "+" is the root, how to find this?
 * if finding (, find the matching ")", then check after
 * if found a function, find the ending ")", then check after
 * if found *, /, or ^, this is a candidate, but keep going. (precedence?)
 * if found +, or - then this is the correct token?
 */
export function findRoot(tokens: Token[]) {
  if (tokens.length === 0) {
    return null;
  }
  let candidateRoot: ExpressionRoot = chooseCandidate(null, tokens[0], 0);
  let i = getNextCandidateIndex(tokens, 0);
  while (i < tokens.length) {
    const curr = tokens[i];
    candidateRoot = chooseCandidate(candidateRoot, curr, i);
    i = getNextCandidateIndex(tokens, i);
  }

  return candidateRoot;
}

const functionTypes = new Set<Token["type"]>([
  "log",
  "trig",
  "open",
  "abs",
]);

function getNextCandidateIndex(tokens: Token[], index: number) {
  const curr = tokens[index];
  if (functionTypes.has(curr.type)) {
    const matchingIndex = findMatchingClose(tokens, index);
    if (matchingIndex === null) {
      throw new Error("Could not find matching close parenthesis.");
    }
    return matchingIndex + 1;
  }
  return index + 1;
}

type ExpressionRoot = {
  type: Exclude<Token["type"], "close">;
  index: number;
  precedence: number;
};

function getPrecendence(token: Token) {
  if (token.type === "operator" && ["+", "-"].includes(token.value)) {
    return 3;
  }
  if (token.type === "operator" || token.type === "power") {
    return 2;
  }
  return 1;
}

function chooseCandidate(
  currentCandidate: ExpressionRoot | null,
  newCandidate: Token,
  index: number,
): ExpressionRoot {
  if (newCandidate.type === "close") {
    throw new Error(
      "Closing parenthesis does not have a matching open parent at index = " +
        index,
    );
  }
  const newPrecedence = getPrecendence(newCandidate);
  if (currentCandidate === null) {
    return {
      type: newCandidate.type,
      precedence: newPrecedence,
      index,
    };
  }

  if (newPrecedence > currentCandidate.precedence) {
    return {
      type: newCandidate.type,
      precedence: newPrecedence,
      index,
    };
  }
  return currentCandidate;
}
