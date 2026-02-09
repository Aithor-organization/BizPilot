import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            BP
          </div>
          <span className="text-xl font-bold">BizPilot</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            로그인
          </Link>
          <Link href="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            무료 시작
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          AI가 운영하는<br />
          <span className="text-brand-600">나의 비즈니스 파트너</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          고객 응대, 예약, CRM, 견적서, 매출 리포트, 직원 관리까지.
          BizPilot이 당신의 비즈니스를 함께 운영합니다.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-brand-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-brand-700 transition-all">
            무료로 시작하기
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {[
            { icon: '🤖', title: 'AI 고객 응대', desc: '24시간 자동 상담, 매 대화에서 학습하여 점점 더 정확해집니다. 지식 베이스(RAG) 기반으로 비즈니스에 맞는 답변을 제공합니다.' },
            { icon: '📅', title: '예약 관리', desc: '캘린더 뷰로 한눈에. 고객이 채팅으로 예약하면 자동 등록됩니다. 슬롯별 예약 한도와 상태 관리를 지원합니다.' },
            { icon: '👥', title: '고객 CRM', desc: '고객 등록, 태그 분류, 접촉 이력 관리. 타임라인으로 모든 상호작용을 추적합니다.' },
            { icon: '📄', title: '견적서 / 세금계산서', desc: '자동 번호 생성, 10% 세액 자동 계산. 견적서에서 세금계산서로 원클릭 전환됩니다.' },
            { icon: '📊', title: '매출 리포트', desc: '매출/지출 실시간 추적. 월별 트렌드, 카테고리 분석, 기간별 비교 리포트를 제공합니다.' },
            { icon: '👔', title: '직원 HR 관리', desc: '출퇴근 기록, 휴가 신청/승인, 근태 요약. 근무 시간 자동 계산과 휴식 시간 차감을 지원합니다.' },
            { icon: '💬', title: '옴니채널 CS', desc: '웹챗 위젯, 이메일, 전화 등 모든 채널의 고객 문의를 한 곳에서 관리합니다. 티켓 자동 분류와 우선순위 설정.' },
            { icon: '📚', title: '지식 베이스', desc: 'AI가 학습할 FAQ와 매뉴얼을 관리합니다. 벡터 임베딩 기반 RAG로 정확한 답변을 생성합니다.' },
            { icon: '🏪', title: '업종별 맞춤 설정', desc: '카페, 미용실, 병원 등 업종별 프로필 설정. 비즈니스에 맞는 용어와 워크플로우를 제공합니다.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-brand-600 p-10 text-white text-center">
          <h2 className="text-2xl font-bold">모든 기능을 무료로 시작하세요</h2>
          <p className="mt-3 text-brand-100">신용카드 없이 바로 시작. 30일 무료 체험 후 합리적인 요금제를 선택하세요.</p>
          <Link href="/register" className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-lg font-semibold text-brand-600 hover:bg-brand-50 transition-all">
            무료로 시작하기
          </Link>
        </div>
      </main>
    </div>
  );
}
