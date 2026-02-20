import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const conversations = await prisma.odConversation.findMany({
        include: {
            messages: true,
        },
        take: 3,
    });
    console.log(JSON.stringify(conversations, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
