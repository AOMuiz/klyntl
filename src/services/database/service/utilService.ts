// Custom Error Types
export class DatabaseError extends Error {
  public readonly operation: string;

  constructor(operation: string, cause?: Error) {
    super(
      `Database operation '${operation}' failed${
        cause ? `: ${cause.message}` : ""
      }
      }`,
      cause ? { cause } : undefined
    );
    this.name = "DatabaseError";
    this.operation = operation;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends Error {
  public readonly resource: string;
  public readonly identifier: string;

  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.identifier = identifier;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class DuplicateError extends Error {
  public readonly field: string;
  public readonly value: string;

  constructor(field: string, value: string) {
    super(`Duplicate value for field '${field}'`);
    this.name = "DuplicateError";
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) Error.captureStackTrace(this, DuplicateError);
  }
}

// Enhanced error types
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly code?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BusinessRuleError extends Error {
  public readonly rule: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, rule: string, context?: Record<string, any>) {
    super(message);
    this.name = "BusinessRuleError";
    this.rule = rule;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ConcurrencyError extends Error {
  public readonly recordId: string;
  public readonly tableName: string;

  constructor(recordId: string, tableName: string) {
    super(`Record ${recordId} in ${tableName} was modified by another process`);
    this.name = "ConcurrencyError";
    this.recordId = recordId;
    this.tableName = tableName;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
