import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find demoAdmin user
    const user = await prisma.user.findFirst({
        where: { OR: [{ email: { contains: 'demo' } }, { email: { contains: 'admin' } }] },
        include: {
            odTenantMembers: {
                include: {
                    tenant: true
                }
            }
        }
    });

    if (!user) {
        console.error('Demo admin user not found');
        return;
    }

    console.log(`Found user: ${user.email}`);

    if (user.odTenantMembers.length === 0) {
        console.error('User has no tenants');
        return;
    }

    const tenantId = user.odTenantMembers[0].tenantId;
    console.log(`Using tenantId: ${tenantId}`);

    // 2. Add Knowledge Base Documents
    const knowledgeData = [
        {
            tenantId,
            title: '블룸 헤어살롱 영업 매뉴얼',
            fileName: '블룸_헤어살롱_영업_매뉴얼.pdf',
            fileType: 'pdf',
            fileSize: 1024500, // ~1MB
            status: 'READY',
            chunkCount: 15,
        },
        {
            tenantId,
            title: '2026 기본 시술 가격표',
            fileName: '2026_시술_가격표.pdf',
            fileType: 'pdf',
            fileSize: 450000,
            status: 'READY',
            chunkCount: 5,
        },
        {
            tenantId,
            title: '고객 응대 가이드라인',
            fileName: 'customer_service_guide.md',
            fileType: 'md',
            fileSize: 12000,
            status: 'READY',
            chunkCount: 8,
        }
    ];

    for (const doc of knowledgeData) {
        await prisma.odDocument.create({ data: doc });
    }

    // 3. Add AI Learning Patterns
    const patternData = [
        {
            tenantId,
            type: 'SUCCESS_PATTERN',
            context: '영업시간, 예약 문의 기본',
            content: '블룸 헤어살롱 영업시간 안내입니다 🕐\n\n📍 평일: 오전 10:00 ~ 오후 8:00\n📍 토요일: 오전 10:00 ~ 오후 7:00\n📍 일요일: 오전 11:00 ~ 오후 6:00\n📍 정기 휴무: 매주 월요일\n\n마지막 접수는 마감 1시간 전까지 가능합니다!',
            confidence: 0.95,
            hitCount: 142,
            tags: ['영업시간', '예약'],
        },
        {
            tenantId,
            type: 'SUCCESS_PATTERN',
            context: '주차장 위치 안내',
            content: '블룸 헤어살롱 오시는 길 안내입니다 📍\n\n주소: 서울시 강남구 역삼동 123-45 블룸빌딩 2층\n🚇 지하철: 역삼역 3번 출구에서 도보 3분\n🚗 주차: 건물 지하주차장 이용 가능 (2시간 무료)',
            confidence: 0.92,
            hitCount: 89,
            tags: ['위치', '주차'],
        },
        {
            tenantId,
            type: 'SUCCESS_PATTERN',
            context: '펌 시술 및 가격',
            content: '펌 시술 안내드립니다 💇‍♀️\n\n디지털 펌: 80,000원~\n셋팅 펌: 90,000원~\n볼륨 매직: 100,000원~\n다운 펌 (남성): 40,000원~\n\n모발 길이와 상태에 따라 가격이 달라질 수 있어요. 시술 시간은 약 2~3시간 소요됩니다.',
            confidence: 0.88,
            hitCount: 205,
            tags: ['가격', '펌'],
        },
        {
            tenantId,
            type: 'SUCCESS_PATTERN',
            context: '예약 취소 및 노쇼 규정',
            content: '예약 변경 및 취소 안내드립니다! 😊\n당일 취소 및 노쇼(No-show)는 다음 예약에 불이익이 있을 수 있습니다.\n예약 변경은 최소 1일 전까지 네이버 예약이나 매장으로 연락 부탁드립니다.',
            confidence: 0.85,
            hitCount: 56,
            tags: ['예약', '취소'],
        }
    ];

    for (const pattern of patternData) {
        await prisma.odBrainPattern.create({ data: pattern });
    }

    console.log('Dummy data inserted successfully for demo admin tenant.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
