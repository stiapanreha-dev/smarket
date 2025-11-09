import { Repository, FindOptionsWhere, FindOneOptions, FindManyOptions } from 'typeorm';

/**
 * Create mock repository for testing
 */
export function createMockRepository<T = any>(): jest.Mocked<Repository<T>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    countBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      execute: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
    })),
    manager: {
      transaction: jest.fn(),
      query: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getRepository: jest.fn(),
    } as any,
    metadata: {} as any,
    target: {} as any,
    hasId: jest.fn(),
    getId: jest.fn(),
    insert: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    recover: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    extend: jest.fn(),
    preload: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    exist: jest.fn(),
    existsBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    findOneOrFail: jest.fn(),
    softRemove: jest.fn(),
    sum: jest.fn(),
    average: jest.fn(),
    minimum: jest.fn(),
    maximum: jest.fn(),
    upsert: jest.fn(),
  } as jest.Mocked<Repository<T>>;
}

/**
 * Create mock entity manager for testing
 */
export function createMockEntityManager() {
  return {
    transaction: jest.fn(),
    query: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getRepository: jest.fn(() => createMockRepository()),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    })),
  };
}

/**
 * Create mock data source for testing
 */
export function createMockDataSource() {
  const mockManager = createMockEntityManager();

  return {
    transaction: jest.fn((callback) => callback(mockManager)),
    query: jest.fn(),
    getRepository: jest.fn(() => createMockRepository()),
    manager: mockManager,
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
      manager: mockManager,
    })),
  };
}
