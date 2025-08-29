export interface IBaseRepository<T> {
  create(entity: Omit<T, "id">): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<T[]>;
}
