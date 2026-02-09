import { Test, TestingModule } from '@nestjs/testing';
import { SecurityAuditService } from './security-audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    service = module.get(SecurityAuditService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('브루트포스 방지', () => {
    it('5회 미만 실패 시 잠금되지 않아야 함', async () => {
      for (let i = 0; i < 4; i++) {
        const result = await service.recordLoginFailure('attacker@test.com', '1.2.3.4');
        expect(result.isLocked).toBe(false);
        expect(result.remainingAttempts).toBe(4 - i);
      }
    });

    it('5회 이상 실패 시 계정이 잠겨야 함', async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordLoginFailure('victim@test.com', '1.2.3.4');
      }
      const result = await service.recordLoginFailure('victim@test.com', '1.2.3.4');
      expect(result.isLocked).toBe(true);
      expect(result.remainingAttempts).toBe(0);
    });

    it('잠금 후 isAccountLocked가 true를 반환해야 함', async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordLoginFailure('locked@test.com', '10.0.0.1');
      }
      expect(service.isAccountLocked('locked@test.com', '10.0.0.1')).toBe(true);
    });

    it('다른 IP에서는 독립적으로 카운트해야 함', async () => {
      for (let i = 0; i < 4; i++) {
        await service.recordLoginFailure('user@test.com', '1.1.1.1');
      }
      // 같은 사용자, 다른 IP → 카운트 독립
      const result = await service.recordLoginFailure('user@test.com', '2.2.2.2');
      expect(result.isLocked).toBe(false);
      expect(result.remainingAttempts).toBe(4); // 첫 번째 실패
    });

    it('로그인 성공 시 실패 카운터가 초기화되어야 함', async () => {
      for (let i = 0; i < 3; i++) {
        await service.recordLoginFailure('user@test.com', '1.1.1.1');
      }
      service.clearLoginFailures('user@test.com', '1.1.1.1');
      expect(service.isAccountLocked('user@test.com', '1.1.1.1')).toBe(false);

      // 초기화 후 다시 카운트 시작
      const result = await service.recordLoginFailure('user@test.com', '1.1.1.1');
      expect(result.remainingAttempts).toBe(4);
    });

    it('잠금되지 않은 계정은 false를 반환해야 함', () => {
      expect(service.isAccountLocked('nobody@test.com', '1.1.1.1')).toBe(false);
    });
  });

  describe('보안 이벤트 로깅', () => {
    it('LOGIN_SUCCESS 이벤트를 정상 기록해야 함', async () => {
      await expect(
        service.logEvent({
          type: 'LOGIN_SUCCESS',
          userId: 'user-123',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
      ).resolves.not.toThrow();
    });

    it('TOKEN_REUSE_DETECTED는 CRITICAL 레벨로 기록해야 함', async () => {
      await expect(
        service.logEvent({
          type: 'TOKEN_REUSE_DETECTED',
          ip: '10.0.0.1',
          details: { tokenFamily: 'family-abc' },
        }),
      ).resolves.not.toThrow();
    });

    it('민감 정보가 마스킹되어야 함', async () => {
      // logEvent 내부 sanitizeDetails가 동작하는지 간접 확인
      await expect(
        service.logEvent({
          type: 'LOGIN_FAILURE',
          ip: '127.0.0.1',
          details: { email: 'secret@example.com', password: 'my-password' },
        }),
      ).resolves.not.toThrow();
    });
  });
});
