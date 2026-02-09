import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { EncryptionService } from './utils/encryption.service';
import { RedisService } from './utils/redis.service';
import { SecurityAuditService } from './services/security-audit.service';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EncryptionService, RedisService, SecurityAuditService],
  exports: [EncryptionService, RedisService, SecurityAuditService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 라우트에 보안 헤더 적용
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
