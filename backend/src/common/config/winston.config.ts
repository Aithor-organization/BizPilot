import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// 개발환경용 포맷 (컬러 + 가독성)
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, context, stack, ...meta }) => {
    const contextStr = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}${stackStr}`;
  }),
);

// 프로덕션용 포맷 (JSON 구조화)
const prodFormat = combine(
  timestamp({ format: 'ISO' }),
  errors({ stack: true }),
  json(),
);

export const winstonConfig: WinstonModuleOptions = {
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    }),
    // 프로덕션에서는 파일 로깅 추가 가능
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: prodFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: prodFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
};

// 로그 메타데이터 헬퍼
export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

// HTTP 요청 로깅용 포맷
export function formatHttpLog(context: LogContext): string {
  const { method, path, statusCode, duration, userId } = context;
  return `${method} ${path} ${statusCode} ${duration}ms ${userId ? `user:${userId}` : 'anonymous'}`;
}
