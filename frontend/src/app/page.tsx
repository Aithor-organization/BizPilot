import Link from 'next/link';
import {
  Bot,
  CalendarCheck,
  Users,
  FileText,
  BarChart3,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  MessageCircle,
  Brain,
  Headphones,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI 고객 응대',
    desc: '24시간 자동 상담. 지식 베이스 기반으로 비즈니스에 맞는 답변을 제공합니다.',
    highlight: true,
  },
  {
    icon: CalendarCheck,
    title: '예약 관리',
    desc: '채팅 예약부터 캘린더 관리까지. 슬롯별 한도와 상태를 자동 처리합니다.',
  },
  {
    icon: Users,
    title: '고객 CRM',
    desc: '태그 분류, 접촉 이력, 타임라인으로 모든 상호작용을 추적합니다.',
  },
  {
    icon: FileText,
    title: '견적서 / 세금계산서',
    desc: '자동 번호 생성, 10% 세액 계산. 견적서에서 세금계산서로 원클릭 전환.',
  },
  {
    icon: BarChart3,
    title: '매출 리포트',
    desc: '매출/지출 실시간 추적. 월별 트렌드와 카테고리 분석 리포트.',
  },
  {
    icon: Briefcase,
    title: '직원 HR 관리',
    desc: '출퇴근 기록, 휴가 승인, 근태 요약. 근무 시간 자동 계산.',
  },
];

const stats = [
  { value: '2,400+', label: '등록 사업자' },
  { value: '15만+', label: '처리된 고객 문의' },
  { value: '98.5%', label: 'AI 응답 정확도' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-hero">
      {/* ── Header ── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
            BP
          </div>
          <span className="text-lg font-bold text-surface-900">BizPilot</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
          >
            로그인
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            무료로 시작하기
          </Link>
        </div>
      </header>

      {/* ── Hero Section (비대칭 60/40) ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
          {/* 좌측 60%: 콘텐츠 */}
          <div className="lg:col-span-3">
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3.5 py-1.5 text-sm font-medium text-accent-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI 기반 비즈니스 운영 플랫폼
            </div>

            <h1 className="animate-fade-up text-hero font-bold text-surface-900" style={{ animationDelay: '0.05s' }}>
              사장님의 일을
              <br />
              <span className="text-brand-800">AI가 함께</span> 합니다
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-surface-500"
              style={{ animationDelay: '0.1s' }}
            >
              고객 응대, 예약, CRM, 견적서, 매출 리포트, 직원 관리까지.
              BizPilot 하나로 비즈니스 운영의 80%를 자동화하세요.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
              style={{ animationDelay: '0.15s' }}
            >
              <Link href="/register" className="btn-primary px-8 py-3.5 text-base">
                30일 무료 체험 시작
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#features" className="btn-secondary px-8 py-3.5 text-base">
                기능 살펴보기
              </Link>
            </div>

            {/* 리스크 역전 */}
            <div
              className="animate-fade-up mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-400"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                신용카드 불필요
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                10분 안에 설정 완료
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                언제든 해지 가능
              </span>
            </div>
          </div>

          {/* 우측 40%: 시각 요소 */}
          <div className="relative lg:col-span-2">
            <div className="animate-fade-in relative rounded-xl border border-surface-200 bg-white p-6 shadow-elevated">
              {/* 대시보드 미리보기 */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-surface-400">실시간 대시보드</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                  <span className="text-sm text-surface-600">오늘 예약</span>
                  <span className="text-lg font-bold text-brand-800">12건</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-50 p-3">
                  <span className="text-sm text-surface-600">이번 달 매출</span>
                  <span className="text-lg font-bold text-brand-800">₩ 4,280만</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-accent-50 p-3">
                  <span className="text-sm text-accent-700">AI 자동 응답</span>
                  <span className="text-lg font-bold text-accent-700">98.5%</span>
                </div>
              </div>
            </div>

            {/* 플로팅 카드 */}
            <div className="animate-float absolute -bottom-4 -left-4 rounded-lg border border-surface-200 bg-white px-4 py-3 shadow-float">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-surface-400">응답 시간</div>
                  <div className="text-sm font-bold text-surface-900">0.8초</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-surface-200 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-6 py-8 sm:gap-16 lg:px-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-brand-800 sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-sm text-surface-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section (벤토 그리드) ── */}
      <section id="features" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-display font-bold text-surface-900">
              비즈니스 운영에 필요한
              <br />
              모든 것을 하나로
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              각각 따로 쓰던 도구들을 BizPilot 하나로 통합하세요. AI가 반복 업무를 대신합니다.
            </p>
          </div>

          {/* 벤토 그리드: 1 대형 + 5 소형 */}
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`card-interactive p-6 ${
                  feature.highlight
                    ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2 flex flex-col justify-between border-brand-100 bg-brand-50/30'
                    : ''
                }`}
              >
                <div>
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${
                      feature.highlight ? 'bg-brand-800 text-white' : 'bg-surface-100 text-surface-600'
                    }`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3
                    className={`text-lg font-bold ${feature.highlight ? 'text-brand-800' : 'text-surface-900'}`}
                  >
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500">{feature.desc}</p>
                </div>

                {feature.highlight && (
                  <a href="#ai-cs-detail" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors">
                    자세히 보기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CS Detail Section ── */}
      <section id="ai-cs-detail" className="bg-surface-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-14 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700">
              <Bot className="h-3.5 w-3.5" />
              AI 고객 응대 시스템
            </div>
            <h2 className="text-display font-bold text-surface-900">
              고객 문의의 80%를
              <br />
              AI가 자동으로 처리합니다
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              지식 베이스에 FAQ와 매뉴얼을 등록하면 AI가 학습하여 고객 질문에 즉시 답변합니다.
              복잡한 문의만 상담원에게 전달되어 업무 효율이 극대화됩니다.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 좌측: 채팅 데모 미리보기 */}
            <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-elevated">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-surface-400">실시간 채팅 미리보기</span>
              </div>

              <div className="space-y-3">
                {/* 고객 메시지 */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-surface-100 px-4 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-surface-400">
                      <Users className="h-3 w-3" /> 고객
                    </div>
                    <p className="text-sm text-surface-900">예약 변경은 어떻게 하나요?</p>
                  </div>
                </div>

                {/* AI 응답 */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-brand-600 px-4 py-3 text-white">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-white/70">
                      <Bot className="h-3 w-3" /> AI 자동 응답
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">98%</span>
                    </div>
                    <p className="text-sm">예약 변경은 마이페이지 &gt; 예약 내역에서 가능합니다. 예약일 24시간 전까지 무료로 변경할 수 있으며, 이후에는 변경 수수료가 발생할 수 있습니다.</p>
                  </div>
                </div>

                {/* 고객 추가 질문 */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-surface-100 px-4 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-surface-400">
                      <Users className="h-3 w-3" /> 고객
                    </div>
                    <p className="text-sm text-surface-900">취소 수수료는 얼마인가요?</p>
                  </div>
                </div>

                {/* AI 응답 2 */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-brand-600 px-4 py-3 text-white">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-white/70">
                      <Bot className="h-3 w-3" /> AI 자동 응답
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">95%</span>
                    </div>
                    <p className="text-sm">예약일 기준 48시간 전 취소 시 무료, 24~48시간 전 50%, 24시간 이내 전액 수수료가 부과됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2.5">
                <MessageCircle className="h-4 w-4 text-surface-300" />
                <span className="text-sm text-surface-300">메시지를 입력하세요...</span>
              </div>
            </div>

            {/* 우측: 주요 기능 카드들 */}
            <div className="space-y-4">
              {[
                {
                  icon: Brain,
                  title: 'RAG 기반 지식 검색',
                  desc: 'PDF, 매뉴얼, FAQ를 업로드하면 벡터 임베딩으로 변환하여 고객 질문에 가장 적합한 답변을 자동 검색합니다.',
                },
                {
                  icon: MessageCircle,
                  title: '실시간 웹챗 위젯',
                  desc: '웹사이트에 채팅 위젯을 설치하면 고객이 실시간으로 질문할 수 있습니다. 커스텀 색상과 인사말 설정 가능.',
                },
                {
                  icon: Headphones,
                  title: '상담원 에스컬레이션',
                  desc: 'AI가 답변하기 어려운 복잡한 문의는 자동으로 상담원에게 전달됩니다. 대화 이력이 함께 전달되어 맥락을 유지합니다.',
                },
                {
                  icon: BarChart3,
                  title: 'AI 성과 분석',
                  desc: 'AI 자동 응답률, 평균 응답 시간, 고객 만족도를 실시간 대시보드에서 확인할 수 있습니다.',
                },
              ].map((item) => (
                <div key={item.title} className="card-surface flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-surface-500">{item.desc}</p>
                  </div>
                </div>
              ))}

              <Link
                href="/register"
                className="btn-primary mt-2 inline-flex w-full justify-center px-8 py-3.5 text-base"
              >
                무료로 AI 고객 응대 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="bg-surface-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="text-display font-bold text-surface-900">
                왜 2,400개 사업장이
                <br />
                BizPilot을 선택했을까요?
              </h2>
              <p className="mt-4 text-lg text-surface-500">
                카페, 미용실, 병원, 학원 등 다양한 업종에서 검증된 플랫폼입니다.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Shield,
                  title: '엔터프라이즈급 보안',
                  desc: '데이터 암호화, 접근 권한 관리, 정기 보안 감사로 안전하게 운영합니다.',
                },
                {
                  icon: Zap,
                  title: '5분 안에 시작',
                  desc: '복잡한 설정 없이 업종만 선택하면 AI가 최적의 환경을 자동 구성합니다.',
                },
                {
                  icon: Bot,
                  title: 'AI가 학습하는 지식 베이스',
                  desc: 'FAQ와 매뉴얼을 등록하면 AI가 학습하여 점점 더 정확한 답변을 제공합니다.',
                },
              ].map((item) => (
                <div key={item.title} className="card-surface flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-surface-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-brand-gradient py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            지금 바로 비즈니스 운영을
            <br />
            자동화하세요
          </h2>
          <p className="mt-4 text-lg text-brand-200">
            신용카드 없이 30일 무료 체험. 설정은 10분이면 충분합니다.
          </p>
          <Link
            href="/register"
            className="btn-accent mt-8 inline-flex px-10 py-4 text-base font-semibold shadow-xl"
          >
            무료 체험 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800 text-xs font-bold text-white">
              BP
            </div>
            <span className="text-sm font-semibold text-surface-900">BizPilot</span>
          </div>
          <p className="text-sm text-surface-400">
            &copy; 2026 BizPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
