import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Pool } from 'pg';
import { APP_CONFIG, AppConfig, readConfig } from './config';
import { AUTH, createAuth } from './auth';
import { SessionGuard } from './session.guard';
import { ProfileController } from './profile.controller';

@Global()
@Module({
  providers: [
    { provide: APP_CONFIG, useFactory: () => readConfig() },
    {
      provide: Pool,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        new Pool({ connectionString: config.DATABASE_URL, max: 10 }),
    },
    { provide: AUTH, inject: [Pool, APP_CONFIG], useFactory: createAuth },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  controllers: [ProfileController],
  exports: [AUTH, APP_CONFIG, Pool],
})
export class IdentityModule implements OnApplicationShutdown {
  constructor(@Inject(Pool) private readonly pool: Pool) {}
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
