import { Logger } from '@nestjs/common';

export const logger = new Logger('Global');

export const formatError = (e: unknown): string => {
  return `error: ${e}, message: ${
    (e as Error).message ?? 'no message'
  }, stack: ${(e as Error).stack ?? 'no stack'}`;
};

export const fullError = (e: unknown): string => {
  return JSON.stringify(e, Object.getOwnPropertyNames(e));
};
