export abstract class BaseService<T> {
  abstract findAll(): Promise<T[]>;
  abstract findOne(id: number): Promise<T>;
  abstract remove(id: number): Promise<void>;
}
