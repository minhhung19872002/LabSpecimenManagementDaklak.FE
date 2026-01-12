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
 * Parse result string to number
 * Supports formats:
 * - Plain number: "200", "0.5", "1,5", ".5", "5."
 * - Scientific notation: "2,0 x 10^2", "1.5 x 10^-3", "2,0x10^2", "1.5e3", "2E-2"
 * - Mathematical expressions: "10^2*5+4^9-9/10^2", "2+3*4"
 * - With multiplication sign variations: "x", "×", "*"
 *
 * @param result - Result string to parse
 * @param decimalPlaces - Number of decimal places (default: 4)
 * @param returnZeroForText - If true, returns 0 for non-parseable text (default: true)
 * @returns Parsed number rounded to specified decimal places, or 0 if cannot parse (when returnZeroForText is true)
 *
 * @example
 * parseResultToNumber("2,0 x 10^2") // returns 200.0000
 * parseResultToNumber("1,5 x 10^-3") // returns 0.0015
 * parseResultToNumber("1.5e3") // returns 1500.0000
 * parseResultToNumber("200") // returns 200.0000
 * parseResultToNumber(".5") // returns 0.5000
 * parseResultToNumber("10^2*5+4") // returns 504.0000
 * parseResultToNumber("Âm tính") // returns 0 (text cannot be calculated)
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

  // Replace Vietnamese decimal separator (comma) with dot
  normalized = normalized.replace(/,/g, ".");

  // Normalize multiplication signs: × and x (lowercase) to *
  // But only when followed/preceded by numbers or expressions
  normalized = normalized.replace(/×/g, "*");
  // Replace 'x' with '*' only when it looks like multiplication (number x number or x 10^)
  normalized = normalized.replace(/(\d)\s*x\s*(\d)/gi, "$1*$2");
  normalized = normalized.replace(/(\d)\s*x\s*(10\^)/gi, "$1*$2");

  // Remove spaces
  normalized = normalized.replace(/\s/g, "");

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

  // Cannot parse - return 0 for text (or null if legacy behavior requested)
  return returnZeroForText ? 0 : null;
};

/**
 * Compare result value with limit
 * @param result - Result string (can be scientific notation)
 * @param limit - Limit value (number)
 * @param decimalPlaces - Decimal places for comparison (default: 4)
 * @returns Object with comparison result:
 *   - parsedValue: The parsed numeric value (or null if not parseable)
 *   - isWithinLimit: true if result <= limit, false if result > limit, null if cannot compare
 *   - canCompare: true if both values are numeric and can be compared
 *
 * @example
 * compareResultWithLimit("2,0 x 10^2", 500)
 * // returns { parsedValue: 200, isWithinLimit: true, canCompare: true }
 *
 * compareResultWithLimit("2,0 x 10^3", 500)
 * // returns { parsedValue: 2000, isWithinLimit: false, canCompare: true }
 *
 * compareResultWithLimit("Âm tính", 500)
 * // returns { parsedValue: null, isWithinLimit: null, canCompare: false }
 */
export const compareResultWithLimit = (
  result: string | null | undefined,
  limit: number | string | null | undefined,
  decimalPlaces: number = 4
): {
  parsedValue: number | null;
  isWithinLimit: boolean | null;
  canCompare: boolean;
} => {
  const parsedValue = parseResultToNumber(result, decimalPlaces);

  // Cannot compare if result is not a number
  if (parsedValue === null) {
    return {
      parsedValue: null,
      isWithinLimit: null,
      canCompare: false,
    };
  }

  // Convert limit to number (handle string input)
  const numericLimit = typeof limit === "string" ? parseFloat(limit) : limit;

  // Cannot compare if limit is not defined or not a valid number
  if (numericLimit === null || numericLimit === undefined || isNaN(numericLimit)) {
    return {
      parsedValue,
      isWithinLimit: null,
      canCompare: false,
    };
  }

  return {
    parsedValue,
    isWithinLimit: parsedValue <= numericLimit,
    canCompare: true,
  };
};