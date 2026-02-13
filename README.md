# BizPilot

> **SMB 올인원 비즈니스 운영 에이전트 플랫폼**

5~50인 규모 중소기업/소상공인을 위한 통합 비즈니스 운영 플랫폼입니다.
고객 응대(CS), 예약 관리, CRM, 견적서/세금계산서, 매출 리포트, 직원 HR, AI 지식 베이스까지 하나의 플랫폼에서 관리합니다.

---

## 고객 정의 및 해결 방안

### 고객 1: 분산된 업무 도구에 지친 소상공인 (카페·미용실·학원 등)

**문제점:**
5~50인 규모의 소상공인은 예약은 전화/카카오톡, 고객 관리는 엑셀, 매출은 포스기, 직원 근태는 수기 노트 등 업무마다 서로 다른 도구를 사용합니다. 도구 간 데이터가 연동되지 않아 이중 입력이 발생하고, 전체 사업 현황을 한눈에 파악할 수 없어 의사결정이 늦어집니다. 개별 SaaS를 각각 구독하면 월 비용이 누적되고 학습 곡선도 높아집니다.

**해결 방안:**
BizPilot은 예약 관리, 고객 CRM, 견적서/세금계산서, 매출 리포트, 직원 HR을 **하나의 통합 대시보드**에서 제공합니다. 예약이 생성되면 CRM에 방문 기록이 자동 추가되고, 결제 시 매출 리포트에 즉시 반영되는 등 모듈 간 데이터가 실시간으로 연동됩니다. 업종(카페·미용실·학원·병원 등)을 선택하면 UI와 워크플로우가 해당 업종에 최적화되어, 별도 설정 없이 바로 업무에 활용할 수 있습니다.

---

### 고객 2: 24시간 고객 문의 대응이 어려운 1인 사업자·소규모 팀

**문제점:**
고객 문의는 영업시간 외에도 들어오지만, 소규모 사업장은 전담 상담 인력을 두기 어렵습니다. 반복적인 질문(영업시간, 가격, 주차 안내 등)에 매번 수동 응답하느라 핵심 업무 시간이 소모되고, 응답 지연으로 잠재 고객이 이탈합니다. 기존 챗봇 솔루션은 도입 비용이 높고, 사업장 고유 정보를 학습시키기 어렵습니다.

**해결 방안:**
BizPilot의 **AI 고객 응대 시스템(OmniDesk)**은 웹챗 위젯을 통해 24시간 자동 상담을 제공합니다. 사업장의 FAQ 문서, 가격표, 수강 안내서 등을 PDF/TXT로 업로드하면 **RAG(검색 증강 생성) 지식 베이스**가 문서를 학습하여 정확한 답변을 생성합니다. 상담원이 해결한 사례는 **Brain 자가 학습 시스템**이 패턴으로 캡처하여 다음 유사 질문에 자동 대응하고, 복잡한 문의만 상담원에게 전달합니다. JavaScript 한 줄로 기존 웹사이트에 위젯을 삽입할 수 있어 도입 장벽이 낮습니다.

---

### 고객 3: 수기 장부·엑셀 기반 재무·인사 관리에서 벗어나고 싶은 사업주

**문제점:**
견적서와 세금계산서를 매번 수동으로 작성하면서 번호 중복, 세액 계산 오류가 빈번하게 발생합니다. 매출과 지출을 엑셀로 정리하다 보면 카테고리 분류가 일관되지 않고, 월별 추세 파악에 시간이 오래 걸립니다. 직원 출퇴근과 휴가를 수기로 관리하면 근무 시간 계산 실수와 분쟁이 발생하기 쉽습니다.

**해결 방안:**
BizPilot은 견적서(EST-YYYYMMDD-NNN) / 세금계산서(TAX-YYYYMMDD-NNN) **자동 번호 생성**과 **10% 부가세 자동 계산**을 지원하며, 견적서에서 세금계산서로 원클릭 전환이 가능합니다. 매출 리포트 모듈은 수입/지출을 카테고리별로 자동 분류하고 월별 추세 그래프를 실시간으로 제공하여 데이터 기반 경영 판단을 돕습니다. HR 모듈은 디지털 출퇴근(Clock In/Out)으로 근무 시간을 자동 계산하고, 휴식 시간 차감·휴가 승인 워크플로우까지 체계적으로 관리하여 인사 운영의 정확성과 투명성을 확보합니다.

---

## 목차

- [시스템 개요](#시스템-개요)
- [핵심 기능](#핵심-기능)
  - [AI 고객 응대 (OmniDesk)](#1-ai-고객-응대-omnidesk)
  - [예약 관리](#2-예약-관리)
  - [고객 CRM](#3-고객-crm)
  - [견적서 / 세금계산서](#4-견적서--세금계산서)
  - [매출 리포트](#5-매출-리포트)
  - [직원 HR 관리](#6-직원-hr-관리)
  - [지식 베이스 (RAG)](#7-지식-베이스-rag)
  - [웹챗 위젯](#8-웹챗-위젯)
  - [업종별 맞춤 설정](#9-업종별-맞춤-설정)
- [예시 시나리오](#예시-시나리오)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [설치 및 실행](#설치-및-실행)
  - [Docker로 실행 (권장)](#docker로-실행-권장)
  - [로컬 개발 모드](#로컬-개발-모드)
  - [환경 변수](#환경-변수)
- [프로젝트 구조](#프로젝트-구조)
- [API 엔드포인트](#api-엔드포인트)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [인증 시스템](#인증-시스템)
- [테스트](#테스트)
- [라이선스](#라이선스)

---

## 시스템 개요

BizPilot은 중소기업과 소상공인이 겪는 **분산된 업무 도구 문제**를 해결합니다.

| 기존 문제 | BizPilot 솔루션 |
|-----------|----------------|
| 예약은 전화/카카오톡, 고객 관리는 엑셀, 매출은 포스기 | 하나의 대시보드에서 통합 관리 |
| 고객 문의에 24시간 대응 불가 | AI 자동 응답 + 지식 베이스(RAG) |
| 견적서를 매번 수동 작성 | 자동 번호 생성, 세액 자동 계산 |
| 직원 근태를 수기로 기록 | 디지털 출퇴근 + 휴가 승인 시스템 |
| 매출/지출 파악이 어려움 | 실시간 리포트 + 카테고리 분석 |

### 대상 업종

카페, 미용실, 네일샵, 학원, 병원/의원, 피트니스센터, 반려동물 서비스, 소규모 리테일 등 **고객 접점이 있는 모든 소상공인 비즈니스**를 지원합니다.

### 프로젝트 통계

| 항목 | 수량 |
|------|------|
| Backend 파일 | 119개 |
| Frontend 파일 | 40개 |
| Prisma 모델 | 25개 (14 OmniDesk + 12 BizPilot) |
| API 엔드포인트 | 93개+ |
| 페이지 라우트 | 25개 |
| 테스트 Suites | 10개, 115+ 테스트 |

---

## 핵심 기능

### 1. AI 고객 응대 (OmniDesk)

24시간 AI 기반 고객 상담 시스템입니다. 고객이 웹챗 위젯으로 문의하면 AI가 자동으로 응답하고, 해결이 어려운 건은 상담원에게 전달합니다.

**주요 기능:**
- 웹챗/이메일 등 멀티채널 대화 통합 관리
- AI 자동 응답 (OpenAI GPT 기반)
- 대화 상태 관리 (대기 → 진행중 → 해결)
- 상담원 배정 및 우선순위 설정
- 실시간 채팅 (Socket.IO WebSocket)
- Brain 자가 학습 (성공/실패 패턴 자동 캡처)

**예시 작업:**
```
1. 카페 사장이 "영업시간이 어떻게 되나요?" 같은 반복 질문을 AI에 위임
2. 미용실에서 고객 문의를 자동으로 예약 안내로 연결
3. 상담원이 해결한 케이스를 Brain이 학습하여 다음부터 자동 응답
```

**관련 페이지:** `/cs`, `/cs/[id]`, `/cs/patterns`

---

### 2. 예약 관리

서비스/메뉴별 가격 설정, 요일별 운영 시간 관리, 예약 생성부터 완료까지 전체 라이프사이클을 지원합니다.

**주요 기능:**
- 서비스(메뉴) 등록: 이름, 가격, 소요 시간, 카테고리
- 예약 슬롯: 요일별 운영 시간, 슬롯 단위(분), 동시 예약 한도
- 예약 상태 관리: 대기(PENDING) → 확인(CONFIRMED) → 완료(COMPLETED) / 취소(CANCELLED) / 노쇼(NO_SHOW)
- 예약 가능 시간 자동 조회: 날짜 선택 시 빈 슬롯만 표시
- 예약 출처 추적: 수동 입력, 채팅 예약, 전화 예약 등

**예시 작업:**
```
1. 미용실: "커트 30분 25,000원", "염색 120분 80,000원" 서비스 등록
2. 화~토 10:00~20:00 운영, 일/월 휴무 설정
3. 고객이 "금요일 오후 2시 커트 예약" → 가능 여부 확인 후 자동 등록
4. 노쇼 고객 관리: NO_SHOW 처리 후 CRM에 기록
```

**관련 페이지:** `/reservations`, `/reservations/settings`

---

### 3. 고객 CRM

고객 정보 등록부터 접촉 이력, 방문/결제 히스토리까지 고객 관계를 체계적으로 관리합니다.

**주요 기능:**
- 고객 등록: 이름, 연락처, 이메일, 생년월일, 성별
- 태그 분류: VIP, 신규, 휴면 등 자유 태그
- 접촉 이력: 방문(VISIT), 전화(CALL), 메시지(MESSAGE), 이메일(EMAIL), 메모(NOTE)
- 고객 타임라인: 예약 + 접촉 + 결제 통합 이력
- 통계: 총 방문 횟수, 총 결제 금액, 최근 방문일 자동 집계

**예시 작업:**
```
1. 단골 고객 "김미소" 등록 → 태그: VIP, 단골
2. 방문 시마다 접촉 이력 자동 기록
3. 3개월 이상 미방문 고객 → 휴면 태그 자동 부여
4. 고객 상세 페이지에서 전체 히스토리 한눈에 확인
```

**관련 페이지:** `/customers`, `/customers/[id]`

---

### 4. 견적서 / 세금계산서

견적서 작성부터 세금계산서 발행까지, 자동 번호 생성과 세액 계산을 지원합니다.

**주요 기능:**
- 자동 번호 생성: 견적서(EST-YYYYMMDD-NNN), 세금계산서(TAX-YYYYMMDD-NNN)
- 품목 관리: 서비스/상품명, 수량, 단가, 금액 자동 계산
- 10% 부가세 자동 계산 (세금계산서 유형 시)
- 상태 관리: 작성 중(DRAFT) → 발송(SENT) → 결제(PAID) / 연체(OVERDUE) / 취소(CANCELLED)
- 유형 전환: 견적서(ESTIMATE) → 세금계산서(TAX_INVOICE) 원클릭 전환
- 영수증(RECEIPT) 발행

**예시 작업:**
```
1. 인테리어 업체: 견적서 EST-20260209-001 작성
   - 바닥 시공 50㎡ × 35,000원 = 1,750,000원
   - 도배 30㎡ × 15,000원 = 450,000원
   - 합계: 2,200,000원
2. 계약 확정 후 → 세금계산서 TAX-20260209-001 전환
   - 공급가액: 2,000,000원
   - 부가세(10%): 200,000원
   - 합계: 2,200,000원
3. 입금 확인 → 상태를 PAID로 변경
```

**관련 페이지:** `/invoices`, `/invoices/new`, `/invoices/[id]`

---

### 5. 매출 리포트

수입과 지출을 실시간으로 추적하고, 기간별/카테고리별 분석 리포트를 제공합니다.

**주요 기능:**
- 수입/지출 거래 등록: 금액, 카테고리, 날짜, 설명
- 기간별 요약: 일별/월별/연별 수입/지출/순이익
- 카테고리별 분석: 어디에 얼마를 쓰고 있는지 한눈에 파악
- 월별 추세 그래프: 매출 트렌드 시각화 (Recharts)
- 대시보드 통계: 오늘/이번 주/이번 달 핵심 지표

**예시 작업:**
```
1. 카페 2월 매출 분석:
   - 수입: 커피 판매 8,500,000원, 디저트 2,100,000원
   - 지출: 원두 구매 2,000,000원, 인건비 3,500,000원, 임대료 1,500,000원
   - 순이익: 3,600,000원
2. 카테고리별 분석: "원두 구매" 비중이 전월 대비 15% 증가 → 거래처 변경 검토
3. 월별 추세: 1월 대비 2월 매출 12% 성장 확인
```

**관련 페이지:** `/reports`, `/dashboard`

---

### 6. 직원 HR 관리

직원 등록, 출퇴근 기록, 휴가 관리, 급여 타입 설정까지 직원 관리 전반을 지원합니다.

**주요 기능:**
- 직원 등록: 이름, 연락처, 역할, 급여 타입(시급/월급), 급여 단가
- 출퇴근 기록: 디지털 Clock In/Out, 근무 시간 자동 계산, 휴식 시간 차감
- 근태 관리: 정상(PRESENT), 결근(ABSENT), 지각(LATE), 반차(HALF_DAY)
- 휴가 관리: 연차(ANNUAL), 병가(SICK), 개인사유(PERSONAL), 기타(OTHER)
- 휴가 승인 워크플로우: 신청(PENDING) → 승인(APPROVED) / 거절(REJECTED)
- 근태 요약: 직원별/기간별 출근 일수, 총 근무 시간 집계
- 휴가 일수 자동 계산: 시작일~종료일 기간으로 자동 산정

**예시 작업:**
```
1. 알바생 "이수진" 등록: 시급 11,000원
2. 매일 출근 시 Clock In → 퇴근 시 Clock Out → 근무 시간 자동 계산
   - 출근 09:00, 퇴근 18:00, 휴식 60분 → 실 근무 8시간
3. 연차 신청: 2월 14~16일 (3일) → 매니저 승인
4. 월말 근태 요약: 출근 22일, 총 176시간, 결근 0일, 지각 1일
```

**관련 페이지:** `/hr`, `/hr/leaves`

---

### 7. 지식 베이스 (RAG)

PDF, TXT, Markdown 문서를 업로드하면 AI가 학습하여 고객 문의에 정확한 답변을 생성합니다.

**주요 기능:**
- 문서 업로드: PDF, TXT, MD 지원 (최대 10MB)
- 비동기 처리: BullMQ 큐로 문서 처리 (청킹 → 임베딩)
- 벡터 임베딩: OpenAI text-embedding-3-small (1536차원)
- 벡터 저장: PostgreSQL pgvector 확장
- 하이브리드 검색: 벡터 유사도(70%) + 키워드 매칭(30%)
- 문서 상태 관리: 처리중(PROCESSING) → 완료 / 오류

**예시 작업:**
```
1. 미용실 FAQ 문서 업로드:
   - "가격표.pdf" → AI가 청크로 분할 → 벡터 임베딩 생성
   - 고객 질문: "커트 가격이 얼마인가요?"
   - RAG 검색: 가격표에서 관련 청크 찾기 → "남성 커트 25,000원입니다" 응답
2. 학원 수강 안내서 업로드:
   - "수강안내_2026.md" → 수강료, 시간표, 환불 규정 학습
   - 학부모 질문: "환불 규정이 어떻게 되나요?" → 정확한 규정 인용 응답
```

**관련 페이지:** `/cs/knowledge`

---

### 8. 웹챗 위젯

고객 웹사이트에 삽입 가능한 실시간 채팅 위젯입니다. JavaScript 한 줄로 설치됩니다.

**주요 기능:**
- 임베드 토큰 기반 인증 (보안)
- 커스터마이즈: 주 색상, 인사 메시지, 위치(좌/우 하단)
- 허용 도메인 설정: CORS 보안
- 실시간 WebSocket 연결 (Socket.IO)
- 방문자 식별: visitorId, visitorName, visitorEmail

**예시 작업:**
```
1. 위젯 생성: 주 색상 #4F46E5, 인사말 "안녕하세요! 무엇을 도와드릴까요?"
2. 고객 웹사이트에 스크립트 삽입:
   <script src="https://bizpilot.kr/widget.js" data-token="abc123"></script>
3. 방문자가 채팅 시작 → 대화 자동 생성 → AI 응답 또는 상담원 배정
```

**관련 페이지:** `/settings/widgets`, `/settings/channels`

---

### 9. 업종별 맞춤 설정

비즈니스 유형에 맞는 프로필을 설정하면 UI와 워크플로우가 업종에 최적화됩니다.

**지원 업종:**
| 업종 코드 | 업종 | 예시 |
|-----------|------|------|
| RESTAURANT | 요식업 | 카페, 레스토랑, 베이커리 |
| SALON | 뷰티/미용 | 미용실, 네일샵, 스파 |
| ACADEMY | 교육 | 학원, 과외, 스터디카페 |
| CLINIC | 의료 | 병원, 의원, 한의원 |
| RETAIL | 소매 | 꽃집, 문구점, 편의점 |
| SERVICE | 서비스 | 세탁소, 수리점, 펫샵 |
| GENERAL | 기타 | 위에 해당하지 않는 업종 |

**맞춤 설정 항목:**
- 사업자명, 대표자명, 사업자등록번호
- 영업 시간 (오픈/마감), 휴무일
- 통화(KRW), 타임존(Asia/Seoul)
- 업종별 추가 설정 (JSON)

**관련 페이지:** `/settings/profile`

---

## 예시 시나리오

### 시나리오 1: 미용실 "헤어플러스" 운영

```
09:00 - 출근, Clock In 처리
09:05 - 대시보드에서 오늘 예약 5건 확인
09:30 - 고객 "김미소" 내방 → CRM에 방문 기록 자동 추가
10:00 - 웹챗으로 "오후 3시 염색 예약 가능한가요?" 문의 → AI가 슬롯 확인 후 자동 응답
10:30 - 신규 고객 등록: 연락처, 태그(신규, 여성) 추가
12:00 - 견적서 작성: 염색 + 트리트먼트 = 130,000원
14:00 - 알바생 휴가 신청 확인 → 승인 처리
17:00 - 오늘 매출 등록: 커트 3건 75,000원, 염색 2건 160,000원
18:00 - 퇴근, Clock Out → 근무 8시간 자동 기록
```

### 시나리오 2: 학원 "스마트수학" 운영

```
- 수강 안내서 PDF를 지식 베이스에 업로드 → AI 학습
- 학부모 문의: "중3 수학반 수강료가 얼마인가요?"
  → RAG가 안내서에서 검색: "중3 수학 정규반 월 280,000원"
  → AI 자동 응답 + 상담 예약 안내
- 수강생 CRM 관리: 이름, 학년, 수강과목 태그
- 월말 리포트: 수강료 수입 8,400,000원, 강사 인건비 4,200,000원
```

### 시나리오 3: 카페 "모닝브루" 운영

```
- 메뉴 등록: 아메리카노 4,500원, 카페라떼 5,000원, 크루아상 3,500원
- 예약 슬롯: 단체석(6인) 예약 가능, 일반석은 예약 없이 운영
- 일일 매출 자동 집계 → 월별 트렌드로 성수기/비수기 파악
- 알바생 근태: 시급 11,000원 × 실 근무 시간 자동 계산
- FAQ: "주차 가능한가요?", "Wi-Fi 비밀번호?" → AI 자동 응답
```

### 시나리오 4: 동물병원 "해피펫" 운영

```
- 업종 프로필: CLINIC, 진료 시간 09:00~18:00, 일요일 휴무
- 서비스 등록: 기본 진료 30,000원, 예방접종 50,000원, 건강검진 80,000원
- 보호자 CRM: 반려동물 정보를 메모에 기록 (이름, 품종, 나이)
- 예약: 30분 단위 슬롯, 동시 진료 2건 가능
- 견적서: 수술비 + 입원비 + 약값 통합 견적
```

---

## 기술 스택

### Backend

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| Framework | NestJS | 10.3 | API 서버 |
| Language | TypeScript | 5.7 | 타입 안전성 |
| ORM | Prisma | 5.8 | DB 접근 |
| Auth | JWT + Passport | - | 인증/인가 |
| Password | bcryptjs | 2.4 | 비밀번호 해싱 (12 라운드) |
| Queue | BullMQ | 5.67 | 비동기 작업 큐 |
| WebSocket | Socket.IO | 4.8 | 실시간 채팅 |
| AI/LLM | OpenAI SDK | 6.18 | 임베딩 + 자동 응답 |
| Validation | class-validator | 0.14 | DTO 유효성 검사 |
| API Docs | Swagger | 7.2 | OpenAPI 문서 |
| Security | Helmet + Throttler | - | HTTP 보안 + Rate Limiting |
| Logger | Winston | 3.19 | 구조화된 로깅 |
| Scheduler | @nestjs/schedule | 6.1 | Cron 작업 |
| File | Multer + pdf-parse | - | 파일 업로드 + PDF 파싱 |

### Frontend

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| Framework | Next.js (App Router) | 15.1 | SSR/SSG |
| UI Library | React | 19.0 | 컴포넌트 |
| State | Zustand | 5.0 | 전역 상태 |
| Server State | TanStack Query | 5.62 | API 캐싱/동기화 |
| HTTP | Axios | 1.7 | API 호출 |
| Form | React Hook Form + Zod | - | 폼 관리 + 스키마 검증 |
| CSS | Tailwind CSS | 3.4 | 유틸리티 CSS |
| Chart | Recharts | 2.15 | 차트 시각화 |
| Icons | Lucide React | 0.468 | 아이콘 |
| Date | date-fns + date-fns-tz | 3.x | 날짜/타임존 처리 |
| Toast | react-hot-toast | 2.4 | 알림 |
| WebSocket | socket.io-client | 4.8 | 실시간 연결 |

### Infrastructure

| 서비스 | 기술 | 용도 |
|--------|------|------|
| Database | PostgreSQL 15 + pgvector | 메인 DB + 벡터 검색 |
| Cache/Queue | Redis 7 | 캐시 + BullMQ 큐 |
| Container | Docker + Docker Compose | 컨테이너 배포 |
| Runtime | Node.js 20 (Alpine) | 실행 환경 |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  Next.js 15  │  │  웹챗 위젯   │  │  외부 서비스 연동  │   │
│  │  (React 19)  │  │  (Socket.IO) │  │  (Webhook/API)   │   │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────────┘   │
└─────────┼──────────────────┼─────────────────┼───────────────┘
          │ REST API         │ WebSocket        │ HTTP
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS 10 API Server                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │ Business │ │   CRM    │ │ Invoice  │       │
│  │  Module  │ │ Profile  │ │  Module  │ │  Module  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Reserv-   │ │  Report  │ │    HR    │ │   CS     │       │
│  │ation     │ │  Module  │ │  Module  │ │(OmniDesk)│       │
│  └──────────┘ └──────────┘ └──────────┘ └────┬─────┘       │
│                                               │              │
│  ┌────────────────────────────────────────────┼──────────┐   │
│  │             OmniDesk CS Engine             │          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┴──┐      │   │
│  │  │ Brain  │ │  RAG   │ │ Credit │ │  Widget  │      │   │
│  │  │(학습)  │ │(지식)  │ │(크레딧)│ │ Gateway  │      │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────┬────────────────────────────┘
           │ Prisma ORM           │ BullMQ
           ▼                      ▼
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL 15   │    │     Redis 7      │
│   + pgvector     │    │  (캐시 + 큐)     │
│  (25 모델)       │    │  (3개 큐)        │
└──────────────────┘    └──────────────────┘
```

### 메시지 처리 파이프라인

```
고객 메시지 수신
    │
    ▼
[Widget Gateway] ──WebSocket──→ 실시간 알림
    │
    ▼
[Message Queue] ──BullMQ──→ 비동기 처리
    │
    ├─→ [Brain 패턴 매칭] ──match──→ 기존 패턴으로 즉시 응답
    │
    ├─→ [RAG 검색] ──search──→ 지식 베이스에서 관련 정보 검색
    │        │
    │        ▼
    │   [하이브리드 검색]
    │   벡터 유사도(70%) + 키워드(30%)
    │
    └─→ [LLM 생성] ──generate──→ 컨텍스트 기반 응답 생성
            │
            ▼
    [Brain 학습] ──capture──→ 성공/실패 패턴 자동 기록
```

---

## 설치 및 실행

### 사전 요구사항

- **Node.js** 20 이상
- **Docker** & **Docker Compose** (Docker 실행 시)
- **PostgreSQL** 15+ (로컬 실행 시, pgvector 확장 필요)
- **Redis** 7+ (로컬 실행 시)

---

### Docker로 실행 (권장)

가장 간편한 실행 방법입니다. PostgreSQL, Redis, Backend, Frontend가 모두 포함됩니다.

```bash
# 1. 저장소 클론
git clone <repository-url>
cd BizPilot

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필수 값 수정:
# - JWT_SECRET: JWT 시크릿 키 (32자 이상 권장)
# - ENCRYPTION_KEY: 암호화 키 (32자 이상 필수)
# - OPENAI_API_KEY: OpenAI API 키 (AI 기능 사용 시)

# 3. Docker Compose 실행
docker compose up -d

# 4. 상태 확인
docker compose ps

# 5. 로그 확인
docker compose logs -f backend
```

**접속 URL:**
| 서비스 | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API 문서 (Swagger) | http://localhost:4000/api/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

**서비스 중지/삭제:**
```bash
# 중지 (데이터 유지)
docker compose stop

# 삭제 (데이터 유지)
docker compose down

# 삭제 (데이터 포함 전체 삭제)
docker compose down -v
```

---

### 로컬 개발 모드

Docker 없이 직접 개발 환경을 구성합니다. PostgreSQL과 Redis가 로컬에 설치되어 있어야 합니다.

```bash
# 1. 저장소 클론
git clone <repository-url>
cd BizPilot

# 2. 의존성 설치 (monorepo 전체)
npm install

# 3. 환경 변수 설정
cp .env.example .env
cp .env.example backend/.env
# 두 파일 모두 DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY 설정

# 4. 데이터베이스 준비
cd backend

# pgvector 확장 활성화 (PostgreSQL에서 직접 실행)
# psql -d bizpilot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Prisma 클라이언트 생성 + DB 스키마 동기화
npx prisma generate
npx prisma db push
# 또는 마이그레이션 사용:
# npx prisma migrate dev --name init

cd ..

# 5. 백엔드 빌드 및 실행
cd backend
npm run build
npm run start:dev    # 개발 모드 (Hot Reload)
# 또는: node dist/main.js (프로덕션 모드)

# 6. 프론트엔드 실행 (별도 터미널)
cd frontend
npm run dev

# 또는 루트에서 동시 실행:
npm run dev
```

**포트 충돌 시:**
다른 프로젝트가 기본 포트를 사용 중이라면 `.env`에서 포트를 변경할 수 있습니다:

```bash
# .env
BACKEND_PORT=4002         # 기본: 4000
FRONTEND_PORT=3002        # 기본: 3000

# docker-compose.yml 또는 .env에서 DB/Redis 포트도 변경 가능
DB_PORT=5435              # 기본: 5432
REDIS_PORT=6382           # 기본: 6379
```

### 초기 계정 생성

시드 데이터가 없으므로 회원가입 API로 첫 번째 계정을 생성합니다:

```bash
# 회원가입 (API)
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin1234!","name":"관리자"}'

# 또는 웹 UI에서 직접 회원가입
# http://localhost:3000/register
```

> **비밀번호 요구사항:** 8자 이상, 대문자/소문자/숫자/특수문자 각 1개 이상 포함

---

### 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `DATABASE_URL` | O | - | PostgreSQL 연결 URL |
| `REDIS_URL` | O | - | Redis 연결 URL |
| `JWT_SECRET` | O | - | JWT 서명 키 |
| `ENCRYPTION_KEY` | O | - | 데이터 암호화 키 (32자 이상) |
| `OPENAI_API_KEY` | - | - | OpenAI API 키 (AI 기능 사용 시) |
| `NODE_ENV` | - | development | 실행 환경 |
| `BACKEND_PORT` | - | 4000 | 백엔드 포트 |
| `FRONTEND_PORT` | - | 3000 | 프론트엔드 포트 |
| `FRONTEND_URL` | - | http://localhost:3000 | CORS 허용 출처 |
| `NEXT_PUBLIC_API_URL` | - | http://localhost:4000 | 프론트엔드 → 백엔드 API URL |
| `UPLOAD_MAX_SIZE_MB` | - | 10 | 파일 업로드 최대 크기 |
| `RATE_LIMIT_TTL` | - | 60 | Rate Limit 기간 (초) |
| `RATE_LIMIT_MAX` | - | 100 | Rate Limit 최대 요청 수 |

---

## 프로젝트 구조

```
BizPilot/
├── backend/                         # NestJS API 서버
│   ├── prisma/
│   │   └── schema.prisma           # 25개 모델 + 10개 enum
│   ├── src/
│   │   ├── auth/                   # 인증/인가
│   │   │   ├── auth.controller.ts  #   POST register/login/refresh/logout
│   │   │   ├── auth.service.ts     #   JWT 발급, 비밀번호 검증
│   │   │   ├── refresh-token.service.ts  # Refresh Token Rotation
│   │   │   ├── guards/             #   JwtAuthGuard, RolesGuard, CsrfGuard
│   │   │   ├── strategies/         #   JwtStrategy, LocalStrategy
│   │   │   └── dto/                #   RegisterDto, LoginDto
│   │   ├── business-profile/       # 업종 프로필
│   │   │   ├── business-profile.controller.ts
│   │   │   └── business-profile.service.ts
│   │   ├── reservation/            # 예약/스케줄링
│   │   │   ├── reservation.controller.ts  # 서비스/슬롯/예약 CRUD
│   │   │   └── reservation.service.ts     # 가용 슬롯 계산
│   │   ├── crm/                    # 고객 CRM
│   │   │   ├── crm.controller.ts   #   고객/접촉이력 CRUD
│   │   │   └── crm.service.ts      #   고객 히스토리 통합
│   │   ├── invoice/                # 견적서/세금계산서
│   │   │   ├── invoice.controller.ts
│   │   │   └── invoice.service.ts  #   자동 번호, 세액 계산
│   │   ├── report/                 # 매출/지출 리포트
│   │   │   ├── report.controller.ts
│   │   │   └── report.service.ts   #   요약/카테고리/추세 분석
│   │   ├── hr/                     # 직원 근태/휴가
│   │   │   ├── hr.controller.ts    #   출퇴근, 휴가 CRUD
│   │   │   └── hr.service.ts       #   근무시간 계산, 근태 요약
│   │   ├── cs/                     # 고객 지원 (OmniDesk)
│   │   │   ├── brain/              #   자가 학습 패턴 시스템
│   │   │   ├── channel/            #   채널 관리
│   │   │   ├── conversation/       #   대화 관리
│   │   │   ├── credit/             #   크레딧 결제
│   │   │   ├── knowledge/          #   RAG 지식 베이스
│   │   │   │   ├── embedding.service.ts  # OpenAI 임베딩
│   │   │   │   ├── rag.service.ts       # 하이브리드 검색
│   │   │   │   └── knowledge.service.ts # 문서 관리
│   │   │   ├── queue/              #   BullMQ 작업 큐
│   │   │   │   ├── message-processor.ts  # 메시지 처리
│   │   │   │   ├── document-processor.ts # 문서 처리
│   │   │   │   └── brain-learner.ts     # 자동 학습
│   │   │   ├── tenant/             #   테넌트 관리
│   │   │   └── widget/             #   웹챗 위젯 + WebSocket
│   │   ├── common/                 # 공통 유틸
│   │   │   ├── config/             #   환경변수 검증, Winston 설정
│   │   │   ├── filters/            #   전역 예외 필터
│   │   │   ├── guards/             #   테넌트/IP 가드
│   │   │   └── services/           #   보안 감사 서비스
│   │   ├── health/                 # 헬스체크 (DB + 메모리)
│   │   ├── prisma/                 # Prisma 서비스
│   │   ├── app.module.ts           # 루트 모듈
│   │   └── main.ts                 # 엔트리 포인트
│   ├── Dockerfile                  # 멀티 스테이지 빌드
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                        # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                    # App Router 페이지
│   │   │   ├── page.tsx            #   랜딩 페이지 (9개 기능 소개)
│   │   │   ├── login/page.tsx      #   로그인
│   │   │   ├── register/page.tsx   #   회원가입
│   │   │   ├── dashboard/          #   대시보드 (통계 카드 + 차트)
│   │   │   ├── reservations/       #   예약 관리 (목록 + 설정)
│   │   │   ├── customers/          #   고객 CRM (목록 + 상세)
│   │   │   ├── invoices/           #   견적서 (목록 + 생성 + 상세)
│   │   │   ├── reports/            #   매출 리포트
│   │   │   ├── hr/                 #   직원 관리 (목록 + 휴가)
│   │   │   ├── cs/                 #   고객 지원 (대화 + 지식 + 패턴)
│   │   │   ├── settings/           #   설정 (프로필/채널/위젯/빌링)
│   │   │   └── admin/              #   관리자
│   │   ├── components/
│   │   │   ├── layout/             #   Sidebar, AuthLayout, Header
│   │   │   └── ui/                 #   Card, Badge, Button 등
│   │   ├── hooks/
│   │   │   └── use-auth.ts         #   인증 훅 (로그인/로그아웃/토큰 갱신)
│   │   ├── lib/
│   │   │   ├── api.ts              #   Axios 인스턴스 (인터셉터)
│   │   │   └── utils.ts            #   cn() 유틸
│   │   └── types/                  #   TypeScript 타입 정의
│   ├── Dockerfile                  # 멀티 스테이지 빌드 (standalone)
│   ├── next.config.ts
│   ├── tailwind.config.ts          # 브랜드 컬러 (#4F46E5)
│   └── package.json
│
├── docs/
│   └── spec/
│       └── bizpilot-prd.md         # 제품 요구사항 문서
├── docker-compose.yml              # PostgreSQL + Redis + Backend + Frontend
├── .env.example                    # 환경 변수 템플릿
├── package.json                    # Monorepo 루트 (npm workspaces)
└── README.md
```

---

## API 엔드포인트

총 **93개+** API 엔드포인트를 제공합니다. 개발 모드에서 Swagger UI(`/api/docs`)로 전체 API를 확인할 수 있습니다.

### 인증 (Auth)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/refresh` | 토큰 갱신 (Refresh Token Rotation) |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/logout-all` | 모든 세션 로그아웃 |
| GET | `/api/auth/profile` | 내 프로필 조회 |

### 예약 관리 (Reservation)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tenants/:tid/services` | 서비스 생성 |
| GET | `/api/tenants/:tid/services` | 서비스 목록 |
| PATCH | `/api/tenants/:tid/services/:id` | 서비스 수정 |
| DELETE | `/api/tenants/:tid/services/:id` | 서비스 삭제 |
| GET | `/api/tenants/:tid/reservation-slots` | 예약 슬롯 조회 |
| PUT | `/api/tenants/:tid/reservation-slots` | 예약 슬롯 설정 |
| POST | `/api/tenants/:tid/reservations` | 예약 생성 |
| GET | `/api/tenants/:tid/reservations` | 예약 목록 |
| GET | `/api/tenants/:tid/reservations/available` | 가용 시간 조회 |
| GET | `/api/tenants/:tid/reservations/:id` | 예약 상세 |
| PATCH | `/api/tenants/:tid/reservations/:id` | 예약 수정 |
| PATCH | `/api/tenants/:tid/reservations/:id/status` | 예약 상태 변경 |

### 고객 CRM

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tenants/:tid/customers` | 고객 등록 |
| GET | `/api/tenants/:tid/customers` | 고객 목록 |
| GET | `/api/tenants/:tid/customers/:id` | 고객 상세 |
| PATCH | `/api/tenants/:tid/customers/:id` | 고객 수정 |
| DELETE | `/api/tenants/:tid/customers/:id` | 고객 삭제 |
| GET | `/api/tenants/:tid/customers/:id/history` | 고객 통합 이력 |
| POST | `/api/tenants/:tid/customers/:cid/contact-logs` | 접촉 이력 추가 |
| GET | `/api/tenants/:tid/customers/:cid/contact-logs` | 접촉 이력 조회 |

### 견적서/세금계산서 (Invoice)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tenants/:tid/invoices` | 견적서 생성 |
| GET | `/api/tenants/:tid/invoices` | 견적서 목록 |
| GET | `/api/tenants/:tid/invoices/:id` | 견적서 상세 |
| PATCH | `/api/tenants/:tid/invoices/:id` | 견적서 수정 |
| DELETE | `/api/tenants/:tid/invoices/:id` | 견적서 삭제 |
| PATCH | `/api/tenants/:tid/invoices/:id/status` | 상태 변경 |

### 매출 리포트 (Report)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tenants/:tid/transactions` | 거래 등록 |
| GET | `/api/tenants/:tid/transactions` | 거래 목록 |
| DELETE | `/api/tenants/:tid/transactions/:id` | 거래 삭제 |
| GET | `/api/tenants/:tid/reports/summary` | 수입/지출 요약 |
| GET | `/api/tenants/:tid/reports/category` | 카테고리별 분석 |
| GET | `/api/tenants/:tid/reports/trend` | 월별 추세 |
| GET | `/api/tenants/:tid/reports/dashboard` | 대시보드 통계 |

### 직원 HR

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tenants/:tid/employees` | 직원 등록 |
| GET | `/api/tenants/:tid/employees` | 직원 목록 |
| GET | `/api/tenants/:tid/employees/:id` | 직원 상세 |
| PATCH | `/api/tenants/:tid/employees/:id` | 직원 수정 |
| DELETE | `/api/tenants/:tid/employees/:id` | 직원 비활성화 |
| POST | `/api/tenants/:tid/employees/:eid/clock-in` | 출근 체크 |
| POST | `/api/tenants/:tid/employees/:eid/clock-out` | 퇴근 체크 |
| GET | `/api/tenants/:tid/attendance` | 근태 목록 |
| GET | `/api/tenants/:tid/attendance/summary` | 근태 요약 |
| POST | `/api/tenants/:tid/leaves` | 휴가 신청 |
| GET | `/api/tenants/:tid/leaves` | 휴가 목록 |
| PATCH | `/api/tenants/:tid/leaves/:id/approve` | 휴가 승인/거절 |

### 고객 지원 CS (OmniDesk)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/omnidesk/tenants/:tid/conversations` | 대화 목록 |
| GET | `/api/omnidesk/tenants/:tid/conversations/:id` | 대화 상세 |
| PATCH | `/api/omnidesk/tenants/:tid/conversations/:id/status` | 대화 상태 변경 |
| PATCH | `/api/omnidesk/tenants/:tid/conversations/:id/assign` | 상담원 배정 |
| POST | `/api/omnidesk/tenants/:tid/conversations/:id/messages` | 메시지 전송 |
| POST | `/api/omnidesk/tenants/:tid/knowledge/documents` | 문서 업로드 |
| GET | `/api/omnidesk/tenants/:tid/knowledge/documents` | 문서 목록 |
| DELETE | `/api/omnidesk/tenants/:tid/knowledge/documents/:id` | 문서 삭제 |
| POST | `/api/omnidesk/tenants/:tid/brain/patterns` | 학습 패턴 생성 |
| GET | `/api/omnidesk/tenants/:tid/brain/patterns` | 패턴 목록 |
| GET | `/api/omnidesk/tenants/:tid/brain/insights` | 학습 인사이트 |

### 웹챗 위젯 (Public API)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/omnidesk/.../widget/public/:token/config` | 위젯 설정 |
| POST | `/api/omnidesk/.../widget/public/:token/conversations` | 대화 시작 |
| POST | `/api/omnidesk/.../widget/public/:token/conversations/:id/messages` | 메시지 전송 |

---

## 데이터베이스 스키마

### 모델 개요 (25개)

| 영역 | 모델 | 설명 |
|------|------|------|
| **인증** | User | 사용자 계정 |
| | RefreshToken | JWT 리프레시 토큰 (Family 기반 로테이션) |
| **테넌트** | OdTenant | 멀티테넌트 (업종별 설정) |
| | OdTenantMember | 테넌트 멤버 (역할 기반) |
| **채널** | OdChannel | 채팅 채널 (WEB_CHAT 등) |
| | OdWidget | 웹챗 위젯 (임베드 토큰, 색상, 위치) |
| **대화** | OdConversation | 대화 (상태, 우선순위, 배정) |
| | OdMessage | 메시지 (발신 유형, 신뢰도) |
| **지식** | OdDocument | 업로드 문서 (PDF/TXT/MD) |
| | OdKnowledgeChunk | 문서 청크 (벡터 임베딩, pgvector) |
| **학습** | OdBrainPattern | AI 학습 패턴 (성공/실패, 신뢰도) |
| **결제** | OdCreditAccount | 크레딧 잔액 |
| | OdCreditTransaction | 크레딧 거래 내역 |
| **프로필** | BpBusinessProfile | 업종 프로필 (영업시간, 휴무일) |
| **예약** | BpService | 서비스/메뉴 (가격, 소요시간) |
| | BpReservationSlot | 예약 슬롯 (요일, 시간, 동시 예약) |
| | BpReservation | 예약 건 (날짜, 상태, 출처) |
| **CRM** | BpCustomer | 고객 (태그, 방문횟수, 총결제) |
| | BpContactLog | 접촉 이력 (방문/전화/메시지) |
| **견적** | BpInvoice | 견적서/세금계산서 (번호, 세액) |
| | BpInvoiceItem | 견적 품목 (수량, 단가) |
| **매출** | BpTransaction | 수입/지출 거래 |
| **HR** | BpEmployee | 직원 (급여타입, 단가) |
| | BpAttendance | 출퇴근 기록 (근무시간 자동계산) |
| | BpLeave | 휴가 (유형, 승인상태) |

### Enum 목록 (10개)

| Enum | 값 | 사용처 |
|------|----|--------|
| BusinessType | RESTAURANT, SALON, ACADEMY, CLINIC, RETAIL, SERVICE, GENERAL | 업종 분류 |
| ReservationStatus | PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW | 예약 상태 |
| ContactType | VISIT, CALL, MESSAGE, EMAIL, NOTE | 접촉 유형 |
| InvoiceType | ESTIMATE, TAX_INVOICE, RECEIPT | 문서 유형 |
| InvoiceStatus | DRAFT, SENT, PAID, OVERDUE, CANCELLED | 문서 상태 |
| TransactionType | INCOME, EXPENSE | 거래 유형 |
| PayType | HOURLY, MONTHLY | 급여 유형 |
| AttendanceStatus | PRESENT, ABSENT, LATE, HALF_DAY | 근태 상태 |
| LeaveType | ANNUAL, SICK, PERSONAL, OTHER | 휴가 유형 |
| LeaveStatus | PENDING, APPROVED, REJECTED | 휴가 승인 |

---

## 인증 시스템

### JWT Access + Refresh Token Rotation

```
로그인 성공
    │
    ├─→ Access Token (Bearer, 7일)     → Authorization 헤더
    └─→ Refresh Token (httpOnly 쿠키, 30일) → 자동 갱신
         │
         ├─→ 토큰 갱신 시 Token Family 기반 로테이션
         │   (이전 토큰 폐기 + 새 토큰 발급)
         │
         └─→ 토큰 재사용 감지 시 → 해당 Family 전체 폐기 (탈취 방지)
```

### 보안 레이어

| 레이어 | 기술 | 설명 |
|--------|------|------|
| 비밀번호 | bcryptjs (12 라운드) | 단방향 해싱 |
| HTTP 헤더 | Helmet | CSP, X-Frame-Options 등 |
| CORS | NestJS CORS | 허용 출처 제한 |
| Rate Limiting | @nestjs/throttler | DDoS 방어 (분당 100회) |
| CSRF | Custom Guard | CSRF 토큰 검증 |
| IP 제한 | IpThrottleGuard | IP별 요청 제한 |
| 로그인 보호 | SecurityAuditService | Brute-force 감지 (5회 실패 시 잠금) |
| 민감 데이터 | 마스킹 처리 | 비밀번호, 토큰 등 로그 마스킹 |

### Guard 체계

| Guard | 적용 대상 | 기능 |
|-------|----------|------|
| JwtAuthGuard | 인증 필요 엔드포인트 | JWT 토큰 검증 |
| RolesGuard | 관리자 기능 | 역할 기반 접근 제어 |
| TenantMemberGuard | 테넌트 API | 테넌트 멤버 검증 |
| TenantOwnerGuard | 테넌트 설정 | 소유자만 접근 |
| WidgetTokenGuard | 위젯 Public API | 임베드 토큰 검증 |
| CsrfGuard | 상태 변경 API | CSRF 토큰 검증 |

---

## 테스트

### 테스트 실행

```bash
# 백엔드 단위 테스트
cd backend && npm test

# 특정 모듈만 테스트
cd backend && npx jest --testPathPattern="auth"
cd backend && npx jest --testPathPattern="reservation"
cd backend && npx jest --testPathPattern="invoice"

# 커버리지 리포트
cd backend && npm run test:cov

# 워치 모드 (파일 변경 시 자동 재실행)
cd backend && npm run test:watch
```

### 테스트 현황

| Test Suite | 테스트 수 | 주요 검증 항목 |
|------------|----------|---------------|
| auth.controller.spec | 8 | 회원가입, 로그인, 토큰 갱신, 로그아웃 |
| auth.service.spec | 12 | 비밀번호 해싱, JWT 발급, 중복 검증 |
| refresh-token.service.spec | 8 | Token Rotation, Family 폐기, 재사용 감지 |
| security-audit.service.spec | 9 | Brute-force 감지, IP 독립 카운팅, 로그 마스킹 |
| reservation.service.spec | 25+ | 슬롯 가용성, 테넌트 격리, 상태 전이, 동시 예약 한도 |
| crm.service.spec | 10 | 고객 CRUD, 태그 관리, 히스토리 통합 |
| invoice.service.spec | 14+ | 세액 계산, 자동 번호, 견적→계산서 전환, 소수점 반올림 |
| report.service.spec | 8 | 기간별 요약, 카테고리 분석, 추세 데이터 |
| hr.service.spec | 18+ | 출퇴근 시간 계산, 휴식 차감, 중복 방지, 휴가 일수, 비활성화 |
| business-profile.spec | 5 | Upsert, 기본값 적용 |
| **합계** | **115+** | |

---

## 라이선스

Private
