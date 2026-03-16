import dayjs from "dayjs";

/**
 * Format date to DD/MM/YYYY format
 * @param date - Date string or null/undefined
 * @returns Formatted date string or "-" if no date
 */
export const formatDate = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY") : "-";

/**
 * Format date to DD/MM/YYYY HH:mm format
 * @param date - Date string or null/undefined
 * @returns Formatted datetime string or "-" if no date
 */
export const formatDateTime = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-";

/**
 * Format currency value to Vietnamese VND format
 * @param value - Number value
 * @returns Formatted currency string with VND suffix
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

/**
 * Format number with thousands separator
 * @param value - Number value
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

/**
 * Strip all HTML tags from a string, returning plain text (using DOMParser)
 * Handles: block elements (p, br → newline), list items (ul→"- ", ol→"1. "), HTML entities auto-decoded
 * @param html - HTML string
 * @returns Plain text without any HTML tags
 *
 * @example
 * stripHtmlTags("<p>Hello <b>world</b></p>") // returns "Hello world"
 * stripHtmlTags("<p>Line 1</p><p>Line 2</p>") // returns "Line 1\nLine 2"
 * stripHtmlTags("<ul><li>Item 1</li><li>Item 2</li></ul>") // returns "- Item 1\n- Item 2"
 * stripHtmlTags("<ol><li>A</li><li>B</li></ol>") // returns "1. A\n2. B"
 */
export const stripHtmlTags = (html: string | undefined | null): string => {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (
    node: Node,
    listType?: "ul" | "ol",
    listIndex?: { value: number },
  ): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    // Track list context for children
    let childListType = listType;
    let childListIndex = listIndex;
    if (tag === "ul") {
      childListType = "ul";
      childListIndex = { value: 0 };
    } else if (tag === "ol") {
      childListType = "ol";
      childListIndex = { value: 0 };
    }

    // Recurse children
    let content = "";
    for (const child of Array.from(node.childNodes)) {
      content += walk(child, childListType, childListIndex);
    }

    if (tag === "li") {
      const prefix =
        listType === "ol" && listIndex ? `${++listIndex.value}. ` : "- ";
      return `\n${prefix}${content.trim()}`;
    }
    if (tag === "ul" || tag === "ol") {
      return `${content}\n`;
    }
    if (tag === "p" || tag === "div" || /^h[1-6]$/.test(tag)) {
      return `${content}\n`;
    }
    if (tag === "br") {
      return "\n";
    }

    return content;
  };

  let result = walk(doc.body);
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
};

/**
 * Strip <p> tags from HTML string but keep inner HTML content
 * Useful for rendering limit values with subscript/superscript from rich text editor
 * @param html - HTML string that may contain <p> wrapper tags
 * @returns HTML string without <p> wrapper tags
 *
 * @example
 * stripPTags("<p>10<sup>2</sup></p>") // returns "10<sup>2</sup>"
 * stripPTags("<p>H<sub>2</sub>O</p>") // returns "H<sub>2</sub>O"
 * stripPTags("plain text") // returns "plain text"
 */
export const stripPTags = (html: string | undefined | null): string => {
  if (!html) return "";
  return html.replace(/^<p>|<\/p>$/gi, "").trim();
};

/**
 * Convert HTML superscript/subscript to mathematical expression
 * - <sup>n</sup> becomes ^n (power)
 * - <sub>n</sub> is removed (subscript is not used in calculations)
 * - Unicode superscript characters (⁰¹²³⁴⁵⁶⁷⁸⁹) are converted to ^n
 *
 * @param html - HTML string containing <sup>/<sub> tags or Unicode superscripts
 * @returns Plain text mathematical expression
 *
 * @example
 * convertHtmlToMathExpression("2<sup>3</sup>") // returns "2^3"
 * convertHtmlToMathExpression("3<sup>2</sup> x 4") // returns "3^2 x 4"
 * convertHtmlToMathExpression("10<sup>-2</sup>") // returns "10^-2"
 * convertHtmlToMathExpression("H<sub>2</sub>O") // returns "H2O"
 * convertHtmlToMathExpression("2³") // returns "2^3"
 * convertHtmlToMathExpression("3² x 4") // returns "3^2 x 4"
 */
export const convertHtmlToMathExpression = (html: string | undefined | null): string => {
  if (!html) return "";

  let result = html;

  // First strip p tags
  result = result.replace(/^<p>|<\/p>$/gi, "").trim();

  // Convert <sup>content</sup> to ^(content)
  // Handle nested content and negative numbers
  result = result.replace(/<sup>([^<]*)<\/sup>/gi, (_, content) => {
    const trimmed = content.trim();
    // If content has operators or multiple digits, wrap in parentheses
    if (trimmed.length > 1 || trimmed.startsWith("-")) {
      return `^(${trimmed})`;
    }
    return `^${trimmed}`;
  });

  // Remove <sub>content</sub> (subscript is not used in math calculations)
  result = result.replace(/<sub>([^<]*)<\/sub>/gi, "$1");

  // Remove any remaining HTML tags
  result = result.replace(/<[^>]+>/g, "");

  // Convert Unicode superscript characters to ^n
  const superscriptMap: Record<string, string> = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
    "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "⁻": "-", "⁺": "+",
  };

  // Find sequences of Unicode superscript characters and convert them
  result = result.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (match) => {
    const converted = match.split("").map(c => superscriptMap[c] || c).join("");
    // If the superscript is more than one character or starts with minus, wrap in parentheses
    if (converted.length > 1 || converted.startsWith("-")) {
      return `^(${converted})`;
    }
    return `^${converted}`;
  });

  // Convert Unicode subscript characters (just remove the subscript notation)
  const subscriptMap: Record<string, string> = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
    "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  };
  result = result.replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (match) => {
    return match.split("").map(c => subscriptMap[c] || c).join("");
  });

  // Decode HTML entities
  result = result.replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");

  return result.trim();
};

/**
 * Safely evaluate a mathematical expression string
 * Supports: +, -, *, /, ^ (power), parentheses
 * Does NOT use eval() for security reasons
 *
 * @param expr - Mathematical expression string (already normalized with . as decimal)
 * @returns Calculated result or null if invalid
 */
const evaluateMathExpression = (expr: string): number | null => {
  try {
    // Remove all whitespace
    expr = expr.replace(/\s/g, "");

    // Check if expression contains only valid characters
    // Valid: digits, decimal point, operators (+, -, *, /, ^), parentheses
    if (!/^[0-9.+\-*/^()]+$/.test(expr)) {
      return null;
    }

    // Handle power operator ^ by converting to **
    // But we need to be careful with order of operations
    // Use a simple recursive descent parser approach

    // Tokenize
    const tokens: (string | number)[] = [];
    let i = 0;
    while (i < expr.length) {
      const char = expr[i];

      // Number (including decimal)
      if (/[0-9.]/.test(char)) {
        let numStr = "";
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        const num = parseFloat(numStr);
        if (isNaN(num)) return null;
        tokens.push(num);
        continue;
      }

      // Operators and parentheses
      if (/[+\-*/^()]/.test(char)) {
        tokens.push(char);
        i++;
        continue;
      }

      // Unknown character
      return null;
    }

    // Simple expression evaluator using shunting-yard algorithm
    const outputQueue: (number | string)[] = [];
    const operatorStack: string[] = [];

    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "^": 3,
    };

    const isRightAssociative: Record<string, boolean> = {
      "^": true,
    };

    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];

      if (typeof token === "number") {
        outputQueue.push(token);
      } else if (token === "(") {
        operatorStack.push(token);
      } else if (token === ")") {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== "("
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length === 0) return null; // Mismatched parentheses
        operatorStack.pop(); // Remove the "("
      } else if ("+-*/^".includes(token)) {
        // Handle unary minus/plus
        if (
          token === "-" &&
          (j === 0 ||
            tokens[j - 1] === "(" ||
            "+-*/^".includes(tokens[j - 1] as string))
        ) {
          // Unary minus - push 0 first to make it 0-x
          outputQueue.push(0);
        } else if (
          token === "+" &&
          (j === 0 ||
            tokens[j - 1] === "(" ||
            "+-*/^".includes(tokens[j - 1] as string))
        ) {
          // Unary plus - just skip it
          continue;
        }

        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== "(" &&
          (precedence[operatorStack[operatorStack.length - 1]] >
            precedence[token] ||
            (precedence[operatorStack[operatorStack.length - 1]] ===
              precedence[token] &&
              !isRightAssociative[token]))
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      }
    }

    while (operatorStack.length > 0) {
      const op = operatorStack.pop()!;
      if (op === "(" || op === ")") return null; // Mismatched parentheses
      outputQueue.push(op);
    }

    // Evaluate RPN
    const evalStack: number[] = [];
    for (const token of outputQueue) {
      if (typeof token === "number") {
        evalStack.push(token);
      } else {
        if (evalStack.length < 2) return null;
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;
        switch (token) {
          case "+":
            evalStack.push(a + b);
            break;
          case "-":
            evalStack.push(a - b);
            break;
          case "*":
            evalStack.push(a * b);
            break;
          case "/":
            if (b === 0) return null; // Division by zero
            evalStack.push(a / b);
            break;
          case "^":
            evalStack.push(Math.pow(a, b));
            break;
          default:
            return null;
        }
      }
    }

    if (evalStack.length !== 1) return null;
    return evalStack[0];
  } catch {
    return null;
  }
};

/**
 * Special text values that represent "negative" or "not detected" results
 * These are treated as <= 0 for comparison purposes
 */
const NEGATIVE_RESULT_TEXTS = [
  "âm tính",
  "không phát hiện",
  "am tinh",
  "khong phat hien",
  "negative",
  "not detected",
  "nd", // Not Detected abbreviation
];

/**
 * Large positive number used for "positive" or "detected" text results
 * when exact value is unknown. This ensures they fail upper limit checks.
 */
export const POSITIVE_TEXT_VALUE = Number.MAX_SAFE_INTEGER;

/**
 * Check if a parsed value represents a "positive/detected" text result
 * @param value - Parsed numeric value
 * @returns true if the value represents a positive text result
 */
export const isPositiveTextValue = (value: number | null): boolean => {
  return value === POSITIVE_TEXT_VALUE;
};

/**
 * Check if a text result represents a negative/not detected result
 * @param text - Text to check (will be trimmed and lowercased)
 * @returns true if the text represents a negative result
 */
export const isNegativeResultText = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  return NEGATIVE_RESULT_TEXTS.some(
    (negText) => lowerText === negText || lowerText.includes(negText)
  );
};

/**
 * Parse result string to number
 * Supports formats:
 * - Plain number: "200", "0.5", "1,5", ".5", "5."
 * - Scientific notation: "2,0 x 10^2", "1.5 x 10^-3", "2,0x10^2", "1.5e3", "2E-2"
 * - Mathematical expressions: "10^2*5+4^9-9/10^2", "2+3*4"
 * - With multiplication sign variations: "x", "×", "*"
 * - Text results: "Âm tính", "Không phát hiện" → 0; "Dương tính" → large positive number
 *
 * @param result - Result string to parse
 * @param decimalPlaces - Number of decimal places (default: 4)
 * @param returnZeroForText - If true, returns semantic value for text (default: true)
 *   - "Âm tính"/"Không phát hiện" → 0
 *   - Other text → large positive number (MAX_SAFE_INTEGER)
 * @returns Parsed number rounded to specified decimal places, or semantic value for text
 *
 * @example
 * parseResultToNumber("2,0 x 10^2") // returns 200.0000
 * parseResultToNumber("1,5 x 10^-3") // returns 0.0015
 * parseResultToNumber("1.5e3") // returns 1500.0000
 * parseResultToNumber("200") // returns 200.0000
 * parseResultToNumber(".5") // returns 0.5000
 * parseResultToNumber("10^2*5+4") // returns 504.0000
 * parseResultToNumber("Âm tính") // returns 0 (negative/not detected = 0)
 * parseResultToNumber("Không phát hiện") // returns 0 (negative/not detected = 0)
 * parseResultToNumber("Dương tính") // returns MAX_SAFE_INTEGER (positive = large number)
 * parseResultToNumber("Âm tính", 4, false) // returns null (legacy behavior)
 */
export const parseResultToNumber = (
  result: string | null | undefined,
  decimalPlaces: number = 4,
  returnZeroForText: boolean = true
): number | null => {
  if (!result || typeof result !== "string") {
    return returnZeroForText ? 0 : null;
  }

  // Trim and normalize the string
  let normalized = result.trim();

  if (normalized === "") {
    return returnZeroForText ? 0 : null;
  }

  // Giới hạn độ dài expression để tránh DoS
  if (normalized.length > 100) {
    return returnZeroForText ? 0 : null;
  }

  // Check for special text results first (before any normalization that might affect text matching)
  if (returnZeroForText) {
    // Check if it's a negative/not detected result → return 0
    if (isNegativeResultText(normalized)) {
      return 0;
    }

    // Check if it looks like text (contains letters but not a valid number format)
    // If it's unparseable text that's NOT negative, return large positive number
    const hasLetters = /[a-zA-ZÀ-ỹ]/.test(normalized);
    const looksLikeScientific = /^\d.*[eExX×].*\d/i.test(normalized);
    if (hasLetters && !looksLikeScientific) {
      // It's text that doesn't look like scientific notation
      // and is not a negative result → treat as positive (detected)
      return POSITIVE_TEXT_VALUE;
    }
  }

  // Replace Vietnamese decimal separator (comma) with dot
  normalized = normalized.replace(/,/g, ".");

  // Normalize multiplication signs: ×, x, X, ✕, ✖, ⨉ to *
  // Replace all Unicode multiplication-like characters with *
  normalized = normalized.replace(/[×✕✖⨉·•]/g, "*");

  // Remove all whitespace (including Unicode whitespace like &nbsp;)
  normalized = normalized.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, "");

  // Replace 'x' or 'X' with '*' when it looks like multiplication (after spaces removed)
  // Pattern: (digit or closing paren) + x/X + (digit or opening paren or ^)
  normalized = normalized.replace(/(\d|\))[xX](\d|\(|\^)/g, "$1*$2");
  // Also handle x followed by 10^ pattern
  normalized = normalized.replace(/(\d)[xX](10\^)/gi, "$1*$2");
  // Fallback: replace any remaining x/X with * when between digits
  normalized = normalized.replace(/(\d)[xX](\d)/g, "$1*$2");

  // Support scientific notation with e/E: "1.5e3", "2E-2", "1e+5"
  const sciEPattern = /^([+-]?(\d+(\.\d*)?|\.\d+))[eE]([+-]?\d+)$/;
  const sciEMatch = normalized.match(sciEPattern);
  if (sciEMatch) {
    const mantissa = parseFloat(sciEMatch[1]);
    const exponent = parseInt(sciEMatch[4], 10);
    if (!isNaN(mantissa) && !isNaN(exponent)) {
      const value = mantissa * Math.pow(10, exponent);
      return parseFloat(value.toFixed(decimalPlaces));
    }
  }

  // Check if it's a simple scientific notation pattern: number * 10^exponent
  // Patterns: "2.0*10^2", "2.0*10^-2"
  const scientificPattern = /^([+-]?(\d+(\.\d*)?|\.\d+))\*10\^([+-]?\d+)$/;
  const scientificMatch = normalized.match(scientificPattern);

  if (scientificMatch) {
    const mantissa = parseFloat(scientificMatch[1]);
    const exponent = parseInt(scientificMatch[4], 10);

    if (!isNaN(mantissa) && !isNaN(exponent)) {
      const value = mantissa * Math.pow(10, exponent);
      return parseFloat(value.toFixed(decimalPlaces));
    }
  }

  // Try parsing as plain number first (supports .5 and 5.)
  const plainNum = parseFloat(normalized);
  if (!isNaN(plainNum) && /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(normalized)) {
    return parseFloat(plainNum.toFixed(decimalPlaces));
  }

  // Fix negative exponents like 10^-2 by converting to 10^(0-2)
  // This allows the expression evaluator to handle it correctly
  normalized = normalized.replace(/\^-(\d+)/g, "^(0-$1)");

  // Try evaluating as mathematical expression
  const evalResult = evaluateMathExpression(normalized);
  if (evalResult !== null && isFinite(evalResult)) {
    return parseFloat(evalResult.toFixed(decimalPlaces));
  }

  // Cannot parse - check original text for semantic meaning
  if (returnZeroForText) {
    // Re-check original result (before normalization) for negative text
    if (isNegativeResultText(result.trim())) {
      return 0;
    }
    // Other unparseable values are treated as positive (detected)
    return POSITIVE_TEXT_VALUE;
  }

  return null;
};

/**
 * Parse result string and extract prefix comparison operator if present.
 * e.g. "< 5" → { operator: "<", value: 5 }
 *      "200" → { operator: null, value: 200 }
 *      "Âm tính" → { operator: null, value: 0 }
 */
export const parseResultWithOperator = (
  result: string | null | undefined,
  decimalPlaces: number = 4
): { operator: string | null; value: number | null } => {
  if (!result || typeof result !== "string") {
    return { operator: null, value: null };
  }

  const trimmed = result.trim();
  if (trimmed === "") {
    return { operator: null, value: null };
  }

  // Match prefix operators: "<", ">", "<=", ">=", "≤", "≥"
  const prefixMatch = trimmed.match(/^([<>≤≥]=?)\s*(.+)$/);
  if (prefixMatch) {
    const op = prefixMatch[1];
    const rest = prefixMatch[2];
    const value = parseResultToNumber(rest, decimalPlaces);
    if (value !== null) {
      // Normalize operator symbols
      const normalizedOp = op === "≤" ? "<=" : op === "≥" ? ">=" : op;
      return { operator: normalizedOp, value };
    }
  }

  // No prefix operator — parse as plain value
  const value = parseResultToNumber(result, decimalPlaces);
  return { operator: null, value };
};

/**
 * Normalize comparison operator to standard form.
 * "≤" → "<=", "≥" → ">="
 */
const normalizeOperator = (op: string): string => {
  if (op === "≤") return "<=";
  if (op === "≥") return ">=";
  return op;
};

/**
 * Check if operator is an upper-bound type (result must be ≤ or < limit)
 */
const isUpperBoundOp = (op: string): boolean => {
  const n = normalizeOperator(op);
  return n === "<=" || n === "<";
};

/**
 * Check if operator is a lower-bound type (result must be ≥ or > limit)
 */
const isLowerBoundOp = (op: string): boolean => {
  const n = normalizeOperator(op);
  return n === ">=" || n === ">";
};

/**
 * Compare a plain numeric result against a single limit with an operator.
 */
const comparePlainValue = (
  resultValue: number,
  op: string,
  limitValue: number
): boolean => {
  switch (normalizeOperator(op)) {
    case "<=": return resultValue <= limitValue;
    case ">=": return resultValue >= limitValue;
    case "<":  return resultValue < limitValue;
    case ">":  return resultValue > limitValue;
    case "=":  return resultValue === limitValue;
    default:   return false;
  }
};

/**
 * Handle result with prefix operator (e.g. "< 5") against a single limit.
 * Principle: if we can't prove the result meets the standard → fail (conservative/compliance).
 *
 * When result = "< V" (actual value is somewhere in [0, V)):
 *   - Limit "≤ L" or "< L": if V ≤ L → pass; if V > L → fail (can't prove ≤ L)
 *   - Limit "≥ L" or "> L": always fail (value < V, can't guarantee ≥ L)
 *   - Limit "= L": fail (can't prove exact equality)
 *
 * When result = "> V" (actual value is somewhere in (V, ∞)):
 *   - Limit "≥ L" or "> L": if V ≥ L → pass; if V < L → fail (can't prove ≥ L)
 *   - Limit "≤ L" or "< L": always fail (value > V, can't guarantee ≤ L)
 *   - Limit "= L": fail (can't prove exact equality)
 */
const comparePrefixedValue = (
  resultOp: string,
  resultValue: number,
  limitOp: string,
  limitValue: number
): "pass" | "fail" => {
  const nResultOp = normalizeOperator(resultOp);
  const nLimitOp = normalizeOperator(limitOp);

  // Result "< V" or "<= V" — actual value is below V (or at V)
  if (nResultOp === "<" || nResultOp === "<=") {
    if (isUpperBoundOp(nLimitOp)) {
      // Limit says value must be ≤ L (or < L)
      // If V ≤ L → actual value < V ≤ L → definitely passes
      // If V > L → can't prove actual value ≤ L → fail
      return resultValue <= limitValue ? "pass" : "fail";
    }
    // Limit says value must be ≥ L or > L or = L
    // Value < V → can't guarantee it meets a lower bound or exact match
    return "fail";
  }

  // Result "> V" or ">= V" — actual value is above V (or at V)
  if (nResultOp === ">" || nResultOp === ">=") {
    if (isLowerBoundOp(nLimitOp)) {
      // Limit says value must be ≥ L (or > L)
      // If V ≥ L → actual value > V ≥ L → definitely passes
      // If V < L → can't prove actual value ≥ L → fail
      return resultValue >= limitValue ? "pass" : "fail";
    }
    // Limit says value must be ≤ L or < L or = L
    // Value > V → can't guarantee it meets an upper bound or exact match
    return "fail";
  }

  return "fail";
};

/**
 * Evaluate pass/fail for a test result against standard limits.
 * Handles: plain numbers, scientific notation, math expressions,
 * text results ("Âm tính"/"Dương tính"), and prefixed results ("< 5", "> 10").
 * Supports both single limit and range (lowerLimit + upperLimit) comparisons.
 *
 * @returns "pass" | "fail" | null (null = cannot determine)
 */
export const evaluatePassFail = (
  result: string | undefined,
  comparisonOperator: string | undefined,
  allowedLimit: string | undefined,
  lowerOperator?: string,
  lowerLimit?: string,
  upperOperator?: string,
  upperLimit?: string,
): "pass" | "fail" | null => {
  if (!result) return null;

  // Parse result (may have prefix operator like "< 5")
  const parsed = parseResultWithOperator(result);
  if (parsed.value === null) return null;

  const { operator: resultOp, value: resultValue } = parsed;

  // --- Range comparison ---
  if (lowerLimit && upperLimit) {
    const lowerVal = parseResultToNumber(convertHtmlToMathExpression(lowerLimit));
    const upperVal = parseResultToNumber(convertHtmlToMathExpression(upperLimit));
    if (lowerVal === null || upperVal === null) return null;

    const lowerOp = lowerOperator || ">";
    const upperOp = upperOperator || "<";

    if (resultOp) {
      // Prefixed result against range — evaluate each bound separately
      const lowerResult = comparePrefixedValue(resultOp, resultValue, lowerOp, lowerVal);
      const upperResult = comparePrefixedValue(resultOp, resultValue, upperOp, upperVal);

      // Both must pass; if either is null (indeterminate), overall is null
      if (lowerResult === "fail" || upperResult === "fail") return "fail";
      if (lowerResult === "pass" && upperResult === "pass") return "pass";
      return null;
    }

    // Plain value against range
    const passLower = comparePlainValue(resultValue, lowerOp, lowerVal);
    const passUpper = comparePlainValue(resultValue, upperOp, upperVal);
    return passLower && passUpper ? "pass" : "fail";
  }

  // --- Single limit comparison ---
  if (!comparisonOperator || !allowedLimit) return null;

  const limitValue = parseResultToNumber(convertHtmlToMathExpression(allowedLimit));
  if (limitValue === null) return null;

  if (resultOp) {
    // Prefixed result against single limit
    return comparePrefixedValue(resultOp, resultValue, comparisonOperator, limitValue);
  }

  // Plain value against single limit
  return comparePlainValue(resultValue, comparisonOperator, limitValue) ? "pass" : "fail";
};