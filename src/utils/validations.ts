// Solution 1: Validation helper functions
export function validateNumber(
  value: string | number,
  defaultValue: number = 0
): number {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : defaultValue;

  const trimmed = String(value).trim();
  if (trimmed === "") return defaultValue;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function validatePositiveInteger(
  value: string | number,
  defaultValue: number = 0
): number {
  const num = validateNumber(value, defaultValue);
  return Math.max(0, Math.floor(num));
}

// Solution 2: Validation with error throwing
export function parseNumberStrict(
  value: string | number,
  fieldName: string
): number {
  if (typeof value === "number") {
    if (isNaN(value)) throw new Error(`${fieldName} must be a valid number`);
    return value;
  }

  const trimmed = String(value).trim();
  if (trimmed === "") throw new Error(`${fieldName} is required`);

  const parsed = parseFloat(trimmed);
  if (isNaN(parsed))
    throw new Error(`${fieldName} must be a valid number, got "${value}"`);

  return parsed;
}

// Solution 3: Validation with result object (most flexible)
interface ValidationResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}

export function validateNumberSafe(
  value: string | number,
  fieldName: string
): ValidationResult<number> {
  try {
    if (typeof value === "number") {
      if (isNaN(value))
        return { success: false, error: `${fieldName} is not a valid number` };
      return { success: true, value };
    }

    const trimmed = String(value).trim();
    if (trimmed === "")
      return { success: false, error: `${fieldName} is required` };

    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) {
      return {
        success: false,
        error: `${fieldName} must be a valid number, got "${value}"`,
      };
    }

    return { success: true, value: parsed };
  } catch (error) {
    return {
      success: false,
      error: `Validation error for ${fieldName}: ${error}`,
    };
  }
}
