import prisma from '../config/db';
import { TemplateService, TemplateData } from './template.service';
import { PdfService } from './pdf.service';
import { marked } from 'marked';

/**
 * Converts plain-text or markdown textarea input into clean HTML.
 * - Lines starting with '-' or '*' become <li> items
 * - Lines with 'Key: Value' (short value) become table rows
 * - Groups consecutive bullet lines into <ul>
 * - Remaining text becomes paragraphs via marked
 */
function smartFormat(text: string): string {
    if (!text || !text.trim()) return '';

    // Normalize line endings
    const rawLines = text.replace(/\r\n/g, '\n').split('\n');

    let html = '';
    let bulletBuffer: string[] = [];

    const flushBullets = () => {
        if (bulletBuffer.length) {
            html += '<ul>' + bulletBuffer.map(b => `<li>${b}</li>`).join('') + '</ul>';
            bulletBuffer = [];
        }
    };

    for (const rawLine of rawLines) {
        const line = rawLine.trim();

        if (!line) {
            flushBullets();
            continue;
        }

        // Explicit bullet point
        if (/^[-*•]\s+/.test(line)) {
            bulletBuffer.push(line.replace(/^[-*•]\s+/, ''));
            continue;
        }

        // Numbered list (1. Item)
        if (/^\d+\.\s+/.test(line)) {
            flushBullets();
            html += `<p><strong>${line}</strong></p>`;
            continue;
        }

        // Key: Value pairs (likely a table or definition)
        if (/^[A-Za-z ]+:\s*\S/.test(line) && line.length < 120) {
            flushBullets();
            const colonIdx = line.indexOf(':');
            const key = line.substring(0, colonIdx).trim();
            const value = line.substring(colonIdx + 1).trim();
            html += `<div style="margin-bottom:6px;"><strong>${key}:</strong> ${value}</div>`;
            continue;
        }

        // Short standalone lines (likely a list item without prefix)
        if (line.length < 80 && !line.endsWith('.') && !line.endsWith('?')) {
            bulletBuffer.push(line);
            continue;
        }

        // Long descriptive text — render as paragraph
        flushBullets();
        html += `<p>${line}</p>`;
    }

    flushBullets();
    return html || `<p>${text}</p>`;
}

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
            company_details: 'ArgosMob Tech & AI', // Always the proposing company, never the client
            features: smartFormat((proposal as any).features),
            intro: (proposal as any).intro ? marked.parse((proposal as any).intro as string) as string : '',
            techStack: smartFormat((proposal as any).techStack),
            deliverables: smartFormat((proposal as any).deliverables),
            timeline: smartFormat((proposal as any).timeline),
            changeRequest: (proposal as any).changeRequest ? marked.parse((proposal as any).changeRequest as string) as string : '',
            cost_table: costTable,
            grand_total: grandTotal,
            amc_details: '',
            // Filter out 'Introduction' sections when intro text is provided, to avoid duplication
            sections: (proposal as any).intro
                ? sections.filter((s: any) => s.name.toLowerCase() !== 'introduction')
                : sections,
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
