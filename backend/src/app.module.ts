import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { CsModule } from './cs/cs.module';
import { ReservationModule } from './reservation/reservation.module';
import { CrmModule } from './crm/crm.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ReportModule } from './report/report.module';
import { HrModule } from './hr/hr.module';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { validateEnv } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),

    ScheduleModule.forRoot(),

    // Core
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,

    // OmniDesk CS Module
    CsModule,

    // BizPilot Business Modules
    BusinessProfileModule,
    ReservationModule,
    CrmModule,
    InvoiceModule,
    ReportModule,
    HrModule,
  ],
})
export class AppModule {}
