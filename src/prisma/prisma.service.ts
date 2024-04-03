import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const options = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ] as Array<Prisma.LogDefinition>,
};

@Injectable()
export class PrismaService
  extends PrismaClient<typeof options, Prisma.LogLevel>
  implements OnModuleInit
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: options.log,
    });

    this.$on('query', ({ query, params, duration }: Prisma.QueryEvent) => {
      this.logger.debug(`Query ${query} took ${duration}ms, params: ${params}`);
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`prisma error: ${e.message}`);
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(`prisma info: ${e.message}`);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`prisma warn: ${e.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
