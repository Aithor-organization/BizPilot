import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            odTenantMembers: {
                include: {
                    tenant: true
                }
            }
        }
    });

    console.log('List of users and their tenants:');
    for (const user of users) {
        console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);
        for (const member of user.odTenantMembers) {
            console.log(`  Tenant: ${member.tenant.name} [ID: ${member.tenantId}]`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
