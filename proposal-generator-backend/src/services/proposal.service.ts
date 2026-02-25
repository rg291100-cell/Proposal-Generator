import prisma from '../config/db';
import { TemplateService, TemplateData } from './template.service';
import { PdfService } from './pdf.service';
import { marked } from 'marked';

export class ProposalService {
    private templateService = new TemplateService();
    private pdfService = new PdfService();

    async generateProposal(proposalId: string): Promise<{ base64Pdf: string; jsonPreview: TemplateData }> {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                project: { include: { client: true } },
                template: true,
                sections: {
                    include: { section: true },
                    orderBy: { order: 'asc' },
                },
                costItems: true,
            },
        });

        if (!proposal) throw new Error('Proposal not found');

        // Prepare Cost Data
        let grandTotal = 0;
        const costTable = proposal.costItems.map((item: any) => {
            grandTotal += item.total;
            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            };
        });

        // Handle Sections
        const sections = proposal.sections.map((ps: any) => ({
            name: ps.section.name,
            enabled: ps.enabled,
            content: ps.content || ps.section.content, // Fallback to original content
        }));

        const data: TemplateData = {
            client_name: (proposal as any).clientName || proposal.project.client.name,
            project_name: proposal.project.name,
            current_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            company_details: proposal.project.client.company || 'ArgosMob Tech & AI',
            features: (proposal as any).features ? marked.parse((proposal as any).features as string) as string : '',
            intro: (proposal as any).intro ? marked.parse((proposal as any).intro as string) as string : '',
            techStack: (proposal as any).techStack ? marked.parse((proposal as any).techStack as string) as string : '',
            deliverables: (proposal as any).deliverables ? marked.parse((proposal as any).deliverables as string) as string : '',
            timeline: (proposal as any).timeline ? marked.parse((proposal as any).timeline as string) as string : '',
            changeRequest: (proposal as any).changeRequest ? marked.parse((proposal as any).changeRequest as string) as string : '',
            cost_table: costTable,
            grand_total: grandTotal,
            amc_details: 'The standard AMC incorporates 12 months ongoing support beginning from deployment sign-off.',
            sections: sections,
        };

        // Render HTML & generate PDF
        const html = await this.templateService.renderHtml('main', data);
        const { base64Pdf } = await this.pdfService.generatePdf(html, proposal.id);

        // Save generated status to db (we drop pdfPath tracking for active serverless)
        await prisma.proposal.update({
            where: { id: proposal.id },
            data: { status: 'generated' },
        });

        return { base64Pdf, jsonPreview: data };
    }
}
