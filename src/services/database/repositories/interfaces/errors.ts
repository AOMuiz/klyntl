// ===== REPOSITORY ERROR CLASSES =====
// Custom error types for repository operations

export class RepositoryError extends Error {
  constructor(
    public readonly entity: string,
    public readonly operation: string,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "RepositoryError";

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super(entity, "findById", `${entity} with ID '${id}' not found`);
    this.name = "RepositoryNotFoundError";
  }
}

export class RepositoryValidationError extends RepositoryError {
  constructor(
    entity: string,
    operation: string,
    public readonly field: string,
    message: string
  ) {
    super(entity, operation, message);
    this.name = "RepositoryValidationError";
  }
}
