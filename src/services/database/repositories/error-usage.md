Here are examples of common issues in your architecture, with code samples and prevention strategies:

---

### 1. **Multiple Repository Instances**

**Mistake Example:**

```typescript
// In two different files/components
const repoA = RepositoryFactory.getCustomerRepository(db);
const repoB = RepositoryFactory.getCustomerRepository(db);
// If the factory does not cache properly, these could be different instances!
```

**Prevention:**

- Use a singleton factory with proper caching.
- Always access repositories through a central provider or context.

**Correct Example:**

```typescript
// Centralized repository access
const repositories = RepositoryFactory.getAllRepositories(db);
const customerRepo = repositories.customerRepository;
// Use this everywhere in your app
```

---

### 2. **Database Context Availability**

**Mistake Example:**

```typescript
// In a component
const { db } = useDatabase();
db.getFirstAsync("SELECT * FROM customers"); // db might be undefined if provider not ready!
```

**Prevention:**

- Check for `isReady` or `db` existence before using.
- Show loading UI until db is available.

**Correct Example:**

```typescript
const { db, isReady } = useDatabase();
if (!isReady || !db) return <LoadingSpinner />;
db.getFirstAsync("SELECT * FROM customers");
```

---

### 3. **React Query Cache Staleness**

**Mistake Example:**

```typescript
// Direct mutation bypassing React Query
await customerRepo.createWithValidation(newCustomer);
// React Query cache is now stale!
```

**Prevention:**

- Always use React Query mutations and invalidate/refetch queries after changes.

**Correct Example:**

```typescript
const createMutation = useMutation({
  mutationFn: (data) => customerRepo.createWithValidation(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  },
});
```

---

### 4. **Error Handling**

**Mistake Example:**

```typescript
try {
  await customerRepo.createWithValidation(data);
} catch (error) {
  // No user feedback!
}
```

**Prevention:**

- Catch errors and display user-friendly messages.

**Correct Example:**

```typescript
try {
  await customerRepo.createWithValidation(data);
} catch (error) {
  showToast(error instanceof Error ? error.message : "Unknown error");
}
```

---

### 5. **Configuration Changes and Instance Cache**

**Mistake Example:**

```typescript
RepositoryFactory.configure({ enableAuditLog: true });
// Old cached instances still use previous config!
```

**Prevention:**

- Clear cached instances after config changes.

**Correct Example:**

```typescript
RepositoryFactory.configure({ enableAuditLog: true });
RepositoryFactory.clearInstances(); // Ensures new config is used
```

---

**Summary:**

- Centralize repository access and cache management.
- Always check for database readiness.
- Use React Query for all data mutations and cache updates.
- Handle errors gracefully and inform the user.
- Clear repository cache after configuration changes.

These practices will help you avoid subtle bugs and keep your app stable and maintainable.
