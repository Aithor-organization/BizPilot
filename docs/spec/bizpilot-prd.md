# BizPilot PRD (Product Requirements Document)

> SMB 올인원 비즈니스 운영 에이전트 플랫폼
> Self-Evolving Omnichannel Business Operations Agent for SMBs

---

## 1. 프로젝트 개요

### 1.1 비전
5~50인 규모 중소기업/소상공인을 위한 **"AI 직원"**. 고객 응대, 예약 관리, CRM, 견적서 발행, 매출 리포트, 직원 HR까지 하나의 AI 에이전트가 처리하며, 매 상호작용에서 학습하여 업종 특화 전문성이 축적됩니다.

### 1.2 핵심 가치 제안
| 가치 | 설명 |
|------|------|
| **자기 진화** | 모든 상호작용에서 패턴 학습 → 시간이 지날수록 더 정확한 응대 |
| **올인원 운영** | CS + 예약 + CRM + 견적 + 리포트 + HR 통합 |
| **업종 특화** | 음식점/미용실/학원 등 업종별 맞춤 운영 로직 |
| **옴니채널** | 웹챗 + 카카오톡 + SMS + 이메일 통합 관리 |
| **비개발자 친화** | 사장님이 직접 워크플로우 커스터마이즈 가능 |

### 1.3 기술 스택
| 분류 | 기술 | 버전 |
|------|------|------|
| Backend | NestJS | 10.3+ |
| Frontend | Next.js (App Router) | 15.1+ |
| Language | TypeScript | 5.7+ |
| ORM | Prisma | 5.8+ |
| Database | PostgreSQL + pgvector | 15+ |
| Cache/Queue | Redis + BullMQ | 7+ / 5.67+ |
| Auth | JWT + bcryptjs + Passport | - |
| Realtime | Socket.IO | 4.8+ |
| AI/LLM | OpenAI API | - |
| Payment | PortOne (토스페이먼츠) | - |
| Container | Docker + Docker Compose | - |

### 1.4 작업 디렉토리
```
/home/cafe66/workspace/proj_cc/BizPilot
```

---

## 2. 모듈 아키텍처

### 2.1 전체 모듈 구조
```
BizPilot/
├── backend/
│   ├── src/
│   │   ├── app.module.ts           # 루트 모듈
│   │   ├── main.ts                 # 엔트리포인트
│   │   │
│   │   ├── auth/                   # [OmniDesk 재사용] 인증/인가
│   │   ├── common/                 # [OmniDesk 재사용] 공통 유틸
│   │   ├── health/                 # [OmniDesk 재사용] 헬스체크
│   │   ├── prisma/                 # [OmniDesk 재사용] Prisma 서비스
│   │   │
│   │   ├── tenant/                 # [OmniDesk 확장] 멀티테넌트
│   │   │   └── + businessType 필드 (RESTAURANT/SALON/ACADEMY/GENERAL)
│   │   │
│   │   ├── cs/                     # [OmniDesk CS 모듈 내장]
│   │   │   ├── channel/            #   채널 관리
│   │   │   ├── widget/             #   웹챗 위젯
│   │   │   ├── conversation/       #   대화 관리
│   │   │   ├── brain/              #   자가 학습 AI
│   │   │   ├── knowledge/          #   RAG 지식 베이스
│   │   │   └── queue/              #   BullMQ 프로세서
│   │   │
│   │   ├── reservation/            # [신규] 예약/스케줄링
│   │   ├── crm/                    # [신규] 고객/거래처 CRM
│   │   ├── invoice/                # [신규] 견적서/세금계산서
│   │   ├── report/                 # [신규] 매출/지출 리포트
│   │   ├── hr/                     # [신규] 직원 근태/휴가
│   │   │
│   │   ├── credit/                 # [OmniDesk 재사용] 크레딧/결제
│   │   ├── payment/                # [OmniDesk 재사용] PortOne 연동
│   │   └── dify/                   # [OmniDesk 재사용] LLM 연동
│   │
│   ├── prisma/
│   │   └── schema.prisma           # 26+ 모델
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # 로그인/가입
│   │   │   ├── dashboard/          # SMB 대시보드
│   │   │   ├── cs/                 # 고객 지원 (OmniDesk)
│   │   │   ├── reservations/       # 예약 관리
│   │   │   ├── customers/          # CRM
│   │   │   ├── invoices/           # 견적서/계산서
│   │   │   ├── reports/            # 리포트
│   │   │   ├── hr/                 # 직원 관리
│   │   │   ├── settings/           # 설정
│   │   │   └── widget/             # 공개 웹챗 위젯
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── docs/spec/                      # 스펙 문서
└── package.json                    # 모노레포 루트
```

### 2.2 모듈 의존성 맵
```
auth ← tenant ← cs (channel, widget, conversation, brain, knowledge)
                ← reservation
                ← crm
                ← invoice
                ← report
                ← hr
                ← credit/payment
common → 모든 모듈에서 사용 (guards, utils)
queue  → cs, reservation, report (비동기 작업)
```

---

## 3. 데이터베이스 스키마

### 3.1 OmniDesk 재사용 모델 (14개, Od 접두사)

OmniDesk의 모든 모델을 그대로 가져오되, `OdTenant`에 `businessType` 필드를 추가합니다.

```prisma
// OdTenant 확장
model OdTenant {
  // ... 기존 필드
  businessType  BusinessType  @default(GENERAL)
}

enum BusinessType {
  RESTAURANT    // 음식점/카페
  SALON         // 미용실/뷰티
  ACADEMY       // 학원/교육
  CLINIC        // 병원/클리닉
  RETAIL        // 소매/판매
  SERVICE       // 서비스업
  GENERAL       // 일반
}
```

### 3.2 BizPilot 신규 모델 (12개, Bp 접두사)

#### 3.2.1 예약 모듈 (3개)
```prisma
model BpService {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      OdTenant @relation(fields: [tenantId], references: [id])
  name        String                    // 서비스명 (예: "커트", "염색")
  description String?
  price       Int                       // 가격 (원)
  duration    Int                       // 소요시간 (분)
  category    String?                   // 카테고리
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reservations BpReservation[]
  invoiceItems BpInvoiceItem[]

  @@index([tenantId])
}

model BpReservationSlot {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      OdTenant @relation(fields: [tenantId], references: [id])
  dayOfWeek   Int                       // 0(일)~6(토)
  startTime   String                    // "09:00"
  endTime     String                    // "18:00"
  slotMinutes Int      @default(30)     // 슬롯 단위 (분)
  maxBookings Int      @default(1)      // 슬롯당 최대 예약 수
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@unique([tenantId, dayOfWeek])
}

model BpReservation {
  id          String            @id @default(cuid())
  tenantId    String
  tenant      OdTenant          @relation(fields: [tenantId], references: [id])
  customerId  String?
  customer    BpCustomer?       @relation(fields: [customerId], references: [id])
  serviceId   String?
  service     BpService?        @relation(fields: [serviceId], references: [id])
  employeeId  String?
  employee    BpEmployee?       @relation(fields: [employeeId], references: [id])
  date        DateTime                  // 예약 날짜
  startTime   String                    // "14:00"
  endTime     String                    // "14:30"
  status      ReservationStatus @default(PENDING)
  note        String?                   // 고객 메모
  source      String?           @default("MANUAL") // MANUAL, WEBCHAT, KAKAO
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([tenantId, date])
  @@index([tenantId, status])
  @@index([customerId])
  @@index([employeeId])
}

enum ReservationStatus {
  PENDING     // 대기
  CONFIRMED   // 확정
  COMPLETED   // 완료
  CANCELLED   // 취소
  NO_SHOW     // 노쇼
}
```

#### 3.2.2 CRM 모듈 (2개)
```prisma
model BpCustomer {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      OdTenant @relation(fields: [tenantId], references: [id])
  name        String
  phone       String?
  email       String?
  birthDate   DateTime?
  gender      String?                   // M, F, OTHER
  tags        String[] @default([])     // ["VIP", "단골"]
  note        String?
  totalVisits Int      @default(0)
  totalSpent  Int      @default(0)      // 누적 결제 금액
  lastVisitAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reservations BpReservation[]
  contactLogs  BpContactLog[]
  invoices     BpInvoice[]

  @@index([tenantId])
  @@index([tenantId, phone])
  @@index([tenantId, name])
}

model BpContactLog {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      OdTenant @relation(fields: [tenantId], references: [id])
  customerId  String
  customer    BpCustomer @relation(fields: [customerId], references: [id])
  type        ContactType               // 접촉 유형
  content     String                    // 내용
  createdBy   String?                   // 작성자 userId
  createdAt   DateTime @default(now())

  @@index([customerId])
  @@index([tenantId])
}

enum ContactType {
  VISIT       // 방문
  CALL        // 전화
  MESSAGE     // 메시지 (카카오, SMS)
  EMAIL       // 이메일
  NOTE        // 메모
}
```

#### 3.2.3 견적/계산서 모듈 (2개)
```prisma
model BpInvoice {
  id            String        @id @default(cuid())
  tenantId      String
  tenant        OdTenant      @relation(fields: [tenantId], references: [id])
  customerId    String?
  customer      BpCustomer?   @relation(fields: [customerId], references: [id])
  invoiceNumber String                  // 문서 번호 (자동 생성)
  type          InvoiceType   @default(ESTIMATE) // 견적/세금계산서
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime      @default(now())
  dueDate       DateTime?
  subtotal      Int           @default(0) // 공급가액
  taxAmount     Int           @default(0) // 세액 (10%)
  totalAmount   Int           @default(0) // 합계
  note          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items BpInvoiceItem[]

  @@index([tenantId])
  @@index([tenantId, invoiceNumber])
  @@index([customerId])
}

model BpInvoiceItem {
  id          String    @id @default(cuid())
  invoiceId   String
  invoice     BpInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  serviceId   String?
  service     BpService? @relation(fields: [serviceId], references: [id])
  description String                    // 품목명
  quantity    Int       @default(1)
  unitPrice   Int                       // 단가
  amount      Int                       // 금액 (수량 x 단가)
  sortOrder   Int       @default(0)

  @@index([invoiceId])
}

enum InvoiceType {
  ESTIMATE      // 견적서
  TAX_INVOICE   // 세금계산서
  RECEIPT       // 영수증
}

enum InvoiceStatus {
  DRAFT         // 작성 중
  SENT          // 발송됨
  PAID          // 결제됨
  OVERDUE       // 연체
  CANCELLED     // 취소
}
```

#### 3.2.4 리포트 모듈 (1개)
```prisma
model BpTransaction {
  id          String          @id @default(cuid())
  tenantId    String
  tenant      OdTenant        @relation(fields: [tenantId], references: [id])
  type        TransactionType
  category    String                    // "매출", "식자재", "인건비" 등
  description String
  amount      Int                       // 양수: 수입, 음수: 지출
  date        DateTime        @default(now())
  referenceId String?                   // 관련 예약/견적서 ID
  referenceType String?                 // RESERVATION, INVOICE
  createdBy   String?
  createdAt   DateTime        @default(now())

  @@index([tenantId, date])
  @@index([tenantId, type])
  @@index([tenantId, category])
}

enum TransactionType {
  INCOME      // 수입
  EXPENSE     // 지출
}
```

#### 3.2.5 HR 모듈 (3개)
```prisma
model BpEmployee {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      OdTenant @relation(fields: [tenantId], references: [id])
  userId      String?                   // User 계정 연결 (선택)
  name        String
  phone       String?
  email       String?
  role        String?                   // "매니저", "스태프" 등
  payType     PayType  @default(HOURLY)
  payRate     Int      @default(0)      // 시급 또는 월급 (원)
  startDate   DateTime @default(now())
  endDate     DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reservations BpReservation[]
  attendances  BpAttendance[]
  leaves       BpLeave[]

  @@index([tenantId])
}

model BpAttendance {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      OdTenant    @relation(fields: [tenantId], references: [id])
  employeeId  String
  employee    BpEmployee  @relation(fields: [employeeId], references: [id])
  date        DateTime
  clockIn     DateTime?
  clockOut    DateTime?
  breakMinutes Int        @default(0)
  totalMinutes Int        @default(0)   // 총 근무 시간 (분)
  status      AttendanceStatus @default(PRESENT)
  note        String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([employeeId, date])
  @@index([tenantId, date])
  @@unique([employeeId, date])
}

model BpLeave {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      OdTenant    @relation(fields: [tenantId], references: [id])
  employeeId  String
  employee    BpEmployee  @relation(fields: [employeeId], references: [id])
  type        LeaveType
  startDate   DateTime
  endDate     DateTime
  days        Float       @default(1)   // 사용 일수 (0.5 = 반차)
  reason      String?
  status      LeaveStatus @default(PENDING)
  approvedBy  String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([employeeId])
  @@index([tenantId])
}

enum PayType {
  HOURLY    // 시급
  MONTHLY   // 월급
}

enum AttendanceStatus {
  PRESENT   // 출근
  ABSENT    // 결근
  LATE      // 지각
  HALF_DAY  // 반차
}

enum LeaveType {
  ANNUAL    // 연차
  SICK      // 병가
  PERSONAL  // 개인사유
  OTHER     // 기타
}

enum LeaveStatus {
  PENDING   // 대기
  APPROVED  // 승인
  REJECTED  // 거절
}
```

#### 3.2.6 업종 프로필 (1개)
```prisma
model BpBusinessProfile {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  tenant        OdTenant @relation(fields: [tenantId], references: [id])
  businessName  String                  // 상호명
  ownerName     String?                 // 대표자명
  bizNumber     String?                 // 사업자등록번호
  address       String?                 // 주소
  phone         String?                 // 대표 전화번호
  openTime      String?  @default("09:00") // 영업 시작
  closeTime     String?  @default("18:00") // 영업 종료
  closedDays    Int[]    @default([])   // 휴무일 (0=일, 6=토)
  currency      String   @default("KRW")
  timezone      String   @default("Asia/Seoul")
  settings      Json     @default("{}")  // 업종별 추가 설정
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3.3 전체 모델 요약

| # | 접두사 | 모델명 | 출처 | 용도 |
|---|--------|--------|------|------|
| 1 | - | User | OmniDesk | 사용자 계정 |
| 2 | - | RefreshToken | OmniDesk | JWT 토큰 로테이션 |
| 3 | Od | Tenant | OmniDesk+확장 | 워크스페이스 + businessType |
| 4 | Od | TenantMember | OmniDesk | 팀원 관리 |
| 5 | Od | Channel | OmniDesk | 옴니채널 |
| 6 | Od | Widget | OmniDesk | 웹챗 위젯 |
| 7 | Od | Conversation | OmniDesk | 고객 대화 |
| 8 | Od | Message | OmniDesk | 대화 메시지 |
| 9 | Od | Document | OmniDesk | 지식 문서 |
| 10 | Od | KnowledgeChunk | OmniDesk | 벡터 청크 |
| 11 | Od | BrainPattern | OmniDesk | AI 학습 패턴 |
| 12 | Od | CreditAccount | OmniDesk | 크레딧 계정 |
| 13 | Od | CreditTransaction | OmniDesk | 크레딧 거래 |
| 14 | Bp | Service | 신규 | 서비스/메뉴 |
| 15 | Bp | ReservationSlot | 신규 | 예약 가능 시간대 |
| 16 | Bp | Reservation | 신규 | 예약 |
| 17 | Bp | Customer | 신규 | 고객 |
| 18 | Bp | ContactLog | 신규 | 고객 접촉 이력 |
| 19 | Bp | Invoice | 신규 | 견적서/계산서 |
| 20 | Bp | InvoiceItem | 신규 | 견적 항목 |
| 21 | Bp | Transaction | 신규 | 매출/지출 거래 |
| 22 | Bp | Employee | 신규 | 직원 |
| 23 | Bp | Attendance | 신규 | 출퇴근 기록 |
| 24 | Bp | Leave | 신규 | 휴가/연차 |
| 25 | Bp | BusinessProfile | 신규 | 업종 프로필 |
| **총 25개 모델** |

---

## 4. API 엔드포인트 설계

### 4.1 OmniDesk 재사용 API (기존 그대로)

| Module | Endpoints | 수 |
|--------|-----------|---|
| Auth | register, login, refresh, logout, profile | 6 |
| Tenant | CRUD + members | 7 |
| CS/Channel | CRUD | 4 |
| CS/Widget | CRUD + public API | 6 |
| CS/Conversation | list, detail, status, assign, message | 5 |
| CS/Brain | patterns CRUD + insights | 5 |
| CS/Knowledge | upload, list, detail, delete | 4 |
| Credit | balance, transactions, charge, verify | 4 |
| Health | health, ready | 2 |
| Admin | stats, users | 2 |
| **소계** | | **45** |

### 4.2 BizPilot 신규 API

#### 예약 모듈
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/tenants/:id/services` | 서비스 생성 |
| GET | `/api/tenants/:id/services` | 서비스 목록 |
| PATCH | `/api/tenants/:id/services/:sid` | 서비스 수정 |
| DELETE | `/api/tenants/:id/services/:sid` | 서비스 삭제 |
| GET | `/api/tenants/:id/reservation-slots` | 예약 슬롯 조회 |
| PUT | `/api/tenants/:id/reservation-slots` | 예약 슬롯 설정 |
| POST | `/api/tenants/:id/reservations` | 예약 생성 |
| GET | `/api/tenants/:id/reservations` | 예약 목록 (날짜/상태 필터) |
| GET | `/api/tenants/:id/reservations/:rid` | 예약 상세 |
| PATCH | `/api/tenants/:id/reservations/:rid` | 예약 수정 |
| PATCH | `/api/tenants/:id/reservations/:rid/status` | 예약 상태 변경 |
| GET | `/api/tenants/:id/reservations/available` | 예약 가능 시간 조회 |
| **소계** | | **12** |

#### CRM 모듈
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/tenants/:id/customers` | 고객 등록 |
| GET | `/api/tenants/:id/customers` | 고객 목록 (검색/필터) |
| GET | `/api/tenants/:id/customers/:cid` | 고객 상세 |
| PATCH | `/api/tenants/:id/customers/:cid` | 고객 수정 |
| DELETE | `/api/tenants/:id/customers/:cid` | 고객 삭제 |
| GET | `/api/tenants/:id/customers/:cid/history` | 고객 이력 (예약+접촉+결제) |
| POST | `/api/tenants/:id/customers/:cid/contact-logs` | 접촉 이력 추가 |
| GET | `/api/tenants/:id/customers/:cid/contact-logs` | 접촉 이력 조회 |
| **소계** | | **8** |

#### 견적/계산서 모듈
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/tenants/:id/invoices` | 견적서 생성 |
| GET | `/api/tenants/:id/invoices` | 견적서 목록 (타입/상태 필터) |
| GET | `/api/tenants/:id/invoices/:iid` | 견적서 상세 |
| PATCH | `/api/tenants/:id/invoices/:iid` | 견적서 수정 |
| DELETE | `/api/tenants/:id/invoices/:iid` | 견적서 삭제 |
| PATCH | `/api/tenants/:id/invoices/:iid/status` | 상태 변경 (DRAFT→SENT→PAID) |
| GET | `/api/tenants/:id/invoices/:iid/pdf` | PDF 다운로드 |
| **소계** | | **7** |

#### 리포트 모듈
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/tenants/:id/transactions` | 거래 등록 |
| GET | `/api/tenants/:id/transactions` | 거래 목록 (날짜/유형/카테고리) |
| DELETE | `/api/tenants/:id/transactions/:tid` | 거래 삭제 |
| GET | `/api/tenants/:id/reports/summary` | 기간별 요약 (매출/지출/이익) |
| GET | `/api/tenants/:id/reports/category` | 카테고리별 분석 |
| GET | `/api/tenants/:id/reports/trend` | 월별 추세 |
| GET | `/api/tenants/:id/reports/dashboard` | 대시보드 종합 데이터 |
| **소계** | | **7** |

#### HR 모듈
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/tenants/:id/employees` | 직원 등록 |
| GET | `/api/tenants/:id/employees` | 직원 목록 |
| GET | `/api/tenants/:id/employees/:eid` | 직원 상세 |
| PATCH | `/api/tenants/:id/employees/:eid` | 직원 수정 |
| DELETE | `/api/tenants/:id/employees/:eid` | 직원 비활성화 |
| POST | `/api/tenants/:id/employees/:eid/clock-in` | 출근 기록 |
| POST | `/api/tenants/:id/employees/:eid/clock-out` | 퇴근 기록 |
| GET | `/api/tenants/:id/attendance` | 출퇴근 목록 (날짜 필터) |
| GET | `/api/tenants/:id/attendance/summary` | 근태 요약 (월별) |
| POST | `/api/tenants/:id/leaves` | 휴가 신청 |
| GET | `/api/tenants/:id/leaves` | 휴가 목록 |
| PATCH | `/api/tenants/:id/leaves/:lid/approve` | 휴가 승인/거절 |
| **소계** | | **12** |

#### 업종 프로필
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/tenants/:id/business-profile` | 업종 프로필 조회 |
| PUT | `/api/tenants/:id/business-profile` | 업종 프로필 설정 |
| **소계** | | **2** |

### 4.3 API 총계

| 분류 | 엔드포인트 수 |
|------|-----------|
| OmniDesk 재사용 | 45 |
| 예약 | 12 |
| CRM | 8 |
| 견적/계산서 | 7 |
| 리포트 | 7 |
| HR | 12 |
| 업종 프로필 | 2 |
| **총계** | **93** |

---

## 5. 프론트엔드 페이지 설계

### 5.1 페이지 구조
```
frontend/src/app/
├── page.tsx                         # 랜딩 페이지
├── login/page.tsx                  # 로그인
├── register/page.tsx               # 회원가입
│
├── dashboard/page.tsx              # [신규] SMB 대시보드 (오늘 예약, 매출 요약, 알림)
│
├── cs/                              # [OmniDesk CS 내장]
│   ├── page.tsx                    # 대화 목록
│   ├── [id]/page.tsx               # 대화 상세
│   ├── knowledge/page.tsx          # 지식 베이스
│   └── patterns/page.tsx           # Brain 패턴
│
├── reservations/                    # [신규] 예약 관리
│   ├── page.tsx                    # 캘린더 뷰 + 목록 뷰
│   └── settings/page.tsx           # 예약 설정 (서비스, 슬롯)
│
├── customers/                       # [신규] CRM
│   ├── page.tsx                    # 고객 목록
│   └── [id]/page.tsx               # 고객 상세 (이력 포함)
│
├── invoices/                        # [신규] 견적/계산서
│   ├── page.tsx                    # 견적서 목록
│   ├── new/page.tsx                # 견적서 작성
│   └── [id]/page.tsx               # 견적서 상세/편집
│
├── reports/                         # [신규] 리포트
│   └── page.tsx                    # 매출/지출 리포트 (차트)
│
├── hr/                              # [신규] 직원 관리
│   ├── page.tsx                    # 직원 목록 + 출퇴근
│   └── leaves/page.tsx             # 휴가 관리
│
├── settings/                        # 설정
│   ├── page.tsx                    # 설정 메인
│   ├── profile/page.tsx            # [신규] 업종 프로필
│   ├── channels/page.tsx           # [OmniDesk] 채널 설정
│   ├── widgets/page.tsx            # [OmniDesk] 위젯 설정
│   └── billing/page.tsx            # [OmniDesk] 결제/크레딧
│
├── admin/page.tsx                  # 관리자
│
└── widget/
    └── [embedToken]/page.tsx       # [OmniDesk] 공개 위젯
```

**총 페이지 수: 22개** (14 OmniDesk + 8 신규)

### 5.2 주요 컴포넌트 설계

| 컴포넌트 | 위치 | 용도 |
|---------|------|------|
| `DashboardStats` | dashboard/ | 오늘 예약 수, 매출 요약, AI 자동 응답률 |
| `ReservationCalendar` | reservations/ | 캘린더 뷰 (주간/월간) |
| `ReservationForm` | reservations/ | 예약 생성/수정 폼 |
| `CustomerList` | customers/ | 고객 검색/필터/태그 |
| `CustomerDetail` | customers/ | 고객 상세 + 이력 타임라인 |
| `InvoiceEditor` | invoices/ | 견적서 편집기 (항목 추가/삭제) |
| `InvoicePDF` | invoices/ | PDF 미리보기/다운로드 |
| `ReportChart` | reports/ | 매출/지출 차트 (라인/바/파이) |
| `AttendanceBoard` | hr/ | 출퇴근 보드 (오늘 출근 현황) |
| `LeaveCalendar` | hr/ | 휴가 캘린더 뷰 |
| `Sidebar` | layout | 네비게이션 사이드바 |
| `ChatWidget` | cs/ | [OmniDesk] 채팅 위젯 |

---

## 6. 비기능 요구사항

### 6.1 성능
| 항목 | 기준 |
|------|------|
| API 응답 시간 | < 200ms (p95) |
| 페이지 로딩 | < 2초 (FCP) |
| 동시 접속 | 100 테넌트 x 10 사용자 |
| DB 쿼리 | < 50ms (단일 테이블) |

### 6.2 보안
| 항목 | 구현 |
|------|------|
| 인증 | JWT Access(15분) + Refresh(30일) 로테이션 |
| 인가 | RBAC (Owner > Admin > Agent) |
| 테넌트 격리 | 모든 쿼리에 tenantId 필터 |
| 데이터 암호화 | AES-256-GCM (민감 정보) |
| XSS 방지 | DOMPurify + Helmet.js |
| CSRF | HMAC-SHA256 서명 토큰 |
| Rate Limiting | IP 기반 10 req/sec |

### 6.3 확장성
| 항목 | 전략 |
|------|------|
| 수평 확장 | 무상태 서버 + Redis 세션 |
| 비동기 처리 | BullMQ 큐 (문서, 메시지, 학습) |
| DB 확장 | Read Replica 지원 |
| 파일 저장 | 로컬 → S3 마이그레이션 경로 |

---

## 7. 구현 태스크 분해

### Phase A: 프로젝트 초기화 (Task 1-5)

| # | 태스크 | 예상 파일 수 | 의존성 |
|---|--------|-----------|--------|
| T-01 | 모노레포 초기화 (package.json, tsconfig, docker-compose) | 5 | 없음 |
| T-02 | OmniDesk 재사용 모듈 복사 (auth, common, health, prisma) | 30+ | T-01 |
| T-03 | Prisma 스키마 작성 (25 모델, enums, relations) | 1 | T-02 |
| T-04 | OmniDesk CS 모듈 내장 (channel, widget, conversation, brain, knowledge, queue) | 25+ | T-03 |
| T-05 | Frontend 기본 구조 (layout, auth pages, api client, stores) | 15+ | T-01 |

### Phase B: 핵심 비즈니스 모듈 (Task 6-10)

| # | 태스크 | 예상 파일 수 | 의존성 |
|---|--------|-----------|--------|
| T-06 | Tenant 확장 (BusinessType, BusinessProfile) | 5 | T-03 |
| T-07 | 예약 모듈 Backend (Service, Slot, Reservation CRUD) | 10 | T-06 |
| T-08 | CRM 모듈 Backend (Customer, ContactLog CRUD) | 8 | T-06 |
| T-09 | 견적/계산서 모듈 Backend (Invoice, InvoiceItem CRUD) | 8 | T-06 |
| T-10 | 리포트 모듈 Backend (Transaction CRUD, 집계 쿼리) | 6 | T-06 |

### Phase C: HR + 대시보드 (Task 11-13)

| # | 태스크 | 예상 파일 수 | 의존성 |
|---|--------|-----------|--------|
| T-11 | HR 모듈 Backend (Employee, Attendance, Leave) | 10 | T-06 |
| T-12 | 대시보드 API (종합 통계 집계) | 3 | T-07~T-11 |
| T-13 | AppModule 통합 + Swagger 문서 | 2 | T-04~T-12 |

### Phase D: 프론트엔드 (Task 14-21)

| # | 태스크 | 예상 파일 수 | 의존성 |
|---|--------|-----------|--------|
| T-14 | 레이아웃 + 사이드바 + 대시보드 페이지 | 5 | T-05, T-12 |
| T-15 | CS 페이지 (OmniDesk 프론트엔드 통합) | 8 | T-04, T-14 |
| T-16 | 예약 페이지 (캘린더 뷰 + 폼) | 5 | T-07, T-14 |
| T-17 | CRM 페이지 (고객 목록 + 상세) | 4 | T-08, T-14 |
| T-18 | 견적서 페이지 (목록 + 에디터) | 5 | T-09, T-14 |
| T-19 | 리포트 페이지 (차트) | 3 | T-10, T-14 |
| T-20 | HR 페이지 (직원 + 출퇴근 + 휴가) | 4 | T-11, T-14 |
| T-21 | 설정 페이지 (업종 프로필) | 2 | T-06, T-14 |

### Phase E: 테스트 + 배포 (Task 22-25)

| # | 태스크 | 예상 파일 수 | 의존성 |
|---|--------|-----------|--------|
| T-22 | Backend 단위 테스트 (서비스별) | 10+ | T-07~T-11 |
| T-23 | Backend E2E 테스트 (주요 시나리오) | 5+ | T-13 |
| T-24 | Frontend 컴포넌트 테스트 | 8+ | T-14~T-21 |
| T-25 | Docker Compose + 배포 설정 + README | 5 | T-22~T-24 |

### 태스크 총계

| Phase | 태스크 수 | 예상 파일 수 |
|-------|----------|-----------|
| A: 초기화 | 5 | 75+ |
| B: 핵심 모듈 | 5 | 37 |
| C: HR + 대시보드 | 3 | 15 |
| D: 프론트엔드 | 8 | 36 |
| E: 테스트 + 배포 | 4 | 28+ |
| **총계** | **25** | **191+** |

---

## 8. 리스크 분석

| 리스크 | 영향 | 확률 | 완화 전략 |
|--------|------|------|---------|
| OmniDesk 코드 호환성 | HIGH | MED | Prisma 스키마 통합 시 충돌 테스트 |
| Brain AI 품질 미흡 | MED | HIGH | 현재 수준 그대로 사용, 추후 LLM 통합 |
| 프론트엔드 규모 | MED | MED | 최소 기능만 구현, 점진적 개선 |
| 배포 환경 차이 | LOW | LOW | Docker Compose로 표준화 |
| 테스트 커버리지 부족 | MED | MED | 핵심 서비스 단위 테스트 우선 |

---

*작성일: 2026-02-09*
*버전: 1.0.0*
*작업 디렉토리: /home/cafe66/workspace/proj_cc/BizPilot*
