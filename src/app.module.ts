import { Module } from '@nestjs/common';
import moment from 'moment';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonConfigModule } from './config/common.config.module';
import { HeliusModule } from './helius/helius.module';
import { HelperModule } from './helpers/helper.module';
import { NftModule } from './nft/nft.module';
import { PrismaModule } from './prisma/prisma.module';
import { RunpodModule } from './runpod/runpod.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        quietReqLogger: true,
        level: process.env.LOGGER_LEVEL ?? 'debug',
        timestamp: () => {
          return `,"time":"${moment(new Date())
            .utcOffset(8)
            .format('YYYY-MM-DD HH:mm:ssZZ')}"`;
        },
        useLevel: 'debug',
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      },
      forRoutes: ['*'],
      exclude: ['health'],
    }),
    PrismaModule,
    CommonConfigModule,
    HelperModule,
    HeliusModule,
    NftModule,
    RunpodModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
