export interface IBaseRepository<T> {
  create(entity: Omit<T, "id">): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<T[]>;

  // New features needed from DatabaseService
  batchCreate(entities: Omit<T, "id">[]): Promise<T[]>;
  batchUpdate(updates: { id: string; entity: Partial<T> }[]): Promise<void>;
  batchDelete(ids: string[]): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}
