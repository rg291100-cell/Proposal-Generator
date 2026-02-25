import prisma from '../config/db';

export class SectionService {
    async createSection(data: { name: string; content: string }) {
        return prisma.reusableSection.create({ data });
    }

    async getSections() {
        return prisma.reusableSection.findMany({ where: { deletedAt: null } });
    }
}
