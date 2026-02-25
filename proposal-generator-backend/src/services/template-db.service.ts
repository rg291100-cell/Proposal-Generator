import prisma from '../config/db';

export class TemplateDbService {
    async createTemplate(data: {
        name: string;
        description?: string;
        sections?: Array<{ sectionId: string; order: number; isDefault: boolean }>;
    }) {
        return prisma.proposalTemplate.create({
            data: {
                name: data.name,
                description: data.description,
                sections: {
                    create: data.sections?.map(s => ({
                        sectionId: s.sectionId,
                        order: s.order,
                        isDefault: s.isDefault,
                    })),
                },
            },
            include: { sections: true },
        });
    }

    async getTemplates() {
        return prisma.proposalTemplate.findMany({
            where: { deletedAt: null },
            include: { sections: { include: { section: true } } },
        });
    }
}
