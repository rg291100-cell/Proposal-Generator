import { Request, Response, NextFunction } from 'express';
import { ProposalService } from '../services/proposal.service';
import prisma from '../config/db';
import { CreateProposalSchema } from '../utils/schemas';

const proposalService = new ProposalService();

export const createProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = CreateProposalSchema.parse(req.body);

        const proposal = await prisma.proposal.create({
            data: {
                title: data.title,
                features: data.features,
                clientName: data.clientName,
                intro: data.intro,
                techStack: data.techStack,
                deliverables: data.deliverables,
                timeline: data.timeline,
                changeRequest: data.changeRequest,
                projectId: data.projectId,
                templateId: data.templateId,
                sections: {
                    create: data.sections?.map(s => ({
                        sectionId: s.sectionId,
                        order: s.order,
                        enabled: s.enabled,
                        content: s.content, // Optionally overridden
                    }))
                },
                costItems: {
                    create: data.costItems?.map(c => ({
                        description: c.description,
                        quantity: c.quantity,
                        unitPrice: c.unitPrice,
                        total: c.quantity * c.unitPrice,
                    }))
                }
            },
            include: { sections: true, costItems: true }
        });
        res.status(201).json(proposal);
    } catch (error) {
        next(error);
    }
};

export const getProposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id: req.params.id as string },
            include: { sections: true, costItems: true }
        });
        if (!proposal) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        res.json(proposal);
    } catch (error) {
        next(error);
    }
};

export const generateProposalDoc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await proposalService.generateProposal(req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
