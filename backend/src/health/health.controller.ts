import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: 'ok' | 'error';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

interface ReadyStatus {
  ready: boolean;
  timestamp: string;
  services: {
    database: boolean;
    llm: boolean;
  };
}

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  /**
   * Liveness probe - 서버가 살아있는지 확인
   * Kubernetes: livenessProbe
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check (liveness)' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  @ApiResponse({ status: 503, description: 'Server is unhealthy' })
  async healthCheck(): Promise<HealthStatus> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const status: HealthStatus = {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbStatus,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024),
          total: Math.round(totalMemory / 1024 / 1024),
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
      },
    };

    return status;
  }

  /**
   * Readiness probe - 서버가 트래픽을 받을 준비가 되었는지 확인
   * Kubernetes: readinessProbe
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Server is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Server is not ready' })
  async readyCheck(): Promise<ReadyStatus> {
    // Database check
    let dbReady = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch {
      dbReady = false;
    }

    // LLM API check
    const llmKey = process.env.OPENAI_API_KEY || '';
    const llmReady = !llmKey || llmKey.includes('xxx') ? true : !!llmKey;

    const ready = dbReady; // DB가 핵심 의존성

    return {
      ready,
      timestamp: new Date().toISOString(),
      services: {
        database: dbReady,
        llm: llmReady,
      },
    };
  }

  /**
   * Simple ping - 최소한의 응답
   */
  @Get('ping')
  @ApiOperation({ summary: 'Simple ping' })
  @ApiResponse({ status: 200, description: 'pong' })
  ping(): { message: string } {
    return { message: 'pong' };
  }
}
