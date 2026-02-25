import { z } from 'zod';

export const CreateClientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional(),
    company: z.string().optional(),
});

export const CreateProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    clientId: z.string().uuid(),
});

export const CreateTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    sections: z.array(
        z.object({
            sectionId: z.string().uuid(),
            order: z.number().int(),
            isDefault: z.boolean().default(true),
        })
    ).optional(),
});

export const CreateSectionSchema = z.object({
    name: z.string().min(1),
    content: z.string().min(1),
});

export const CreateProposalSchema = z.object({
    title: z.string().min(1),
    projectId: z.string().uuid(),
    templateId: z.string().uuid(),
    sections: z.array(
        z.object({
            sectionId: z.string().uuid(),
            order: z.number().int(),
            enabled: z.boolean(),
            content: z.string().optional(),
        })
    ).optional(),
    features: z.string().optional(),
    clientName: z.string().optional(),
    intro: z.string().optional(),
    techStack: z.string().optional(),
    deliverables: z.string().optional(),
    timeline: z.string().optional(),
    changeRequest: z.string().optional(),
    costItems: z.array(
        z.object({
            description: z.string(),
            quantity: z.number().min(1),
            unitPrice: z.number().min(0),
        })
    ).optional(),
});
