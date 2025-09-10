# Repository Pattern Implementation & Service Layer Integration

## Overview

This project uses an advanced Repository Pattern to manage data access, validation, and business logic for core entities (Customer, Product, Transaction, StoreConfig) in a scalable and maintainable way. The repository layer is designed to be flexible, testable, and ready for integration with a higher-level service class.

## Key Features

- **Configurable Repositories:** All repositories accept a `RepositoryConfig` object, allowing runtime configuration of validation, audit logging, business rules, and batch sizes.
- **Centralized Factory:** The `EnhancedRepositoryFactory` manages repository instances, configuration, and caching. It provides methods for bulk operations, health checks, and statistics.
- **Validation & Error Handling:** Each repository uses a `ValidationService` for input validation and throws custom errors (`ValidationError`, `DatabaseError`, etc.) for robust error handling.
- **Business Logic:** Domain-specific logic (e.g., only one active store config, integrity checks) is included where necessary, especially in `StoreConfigRepository`.
- **Batch Operations:** Bulk create, update, and delete operations are supported for performance.
- **Flexible Queries:** Repositories expose methods for filtered, paginated, and sorted queries.
- **Audit Logging:** Audit log support is configurable and can be extended to log changes after mutations.

## Preparation for Service Layer Integration

- The repository layer is now decoupled from direct business logic orchestration. All data access, validation, and domain rules are handled in repositories.
- The service class (e.g., `DatabaseService`) will orchestrate workflows, coordinate multiple repositories, and handle cross-entity business logic.
- The factory provides a single point to obtain all repositories, making it easy for the service class to access and use them.
- The repository interfaces are fully typed and ready for dependency injection into the service class.

## How to Connect to the Service Class

1. **Obtain Repositories:** Use `RepositoryFactory.getAllRepositories(db)` to get all repository instances for a given database connection.
2. **Inject into Service:** Pass these repositories to your service class constructor or initialization method.
3. **Orchestrate Logic:** The service class can now call repository methods for CRUD, batch, and business logic operations, and handle cross-entity workflows.
4. **Configure as Needed:** Use `RepositoryFactory.configure(config)` to set global repository options before initializing the service.

## Example Usage

```typescript
import { getRepositories } from "./repositories/RepositoryFactory";
import { createDatabaseService } from "./service";

const db = ... // your SQLiteDatabase instance
const repositories = getRepositories(db);
const service = createDatabaseService(db, repositories);
```

## Benefits

- **Separation of Concerns:** Data access, validation, and business logic are clearly separated.
- **Testability:** Each repository and the service class can be tested independently.
- **Scalability:** Easily add new entities, repositories, or business rules.
- **Maintainability:** Centralized configuration and factory management simplify future changes.

---

For more details, see the implementation files in `/src/services/database/repositories/` and `/src/services/database/service/`.
