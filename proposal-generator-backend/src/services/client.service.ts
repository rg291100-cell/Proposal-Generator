import prisma from '../config/db';

export class ClientService {
    async createClient(data: { name: string; email?: string; company?: string }) {
        return prisma.client.create({ data });
    }

    async getClients() {
        return prisma.client.findMany({ where: { deletedAt: null } });
    }
}
