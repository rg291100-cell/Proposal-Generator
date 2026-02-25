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
    let inNumberedSection = false;

    const flushBullets = () => {
        if (bulletBuffer.length) {
            html += '<ul class="feat-list">' + bulletBuffer.map(b => `<li>${b}</li>`).join('') + '</ul>';
            bulletBuffer = [];
        }
    };

    for (const rawLine of rawLines) {
        const line = rawLine.trim();

        if (!line) {
            // Blank lines only flush bullets between sections
            flushBullets();
            continue;
        }

        // ── NUMBERED HEADING: "1. SECTION NAME", "2. Another Section" ──
        // Matches optional prefix spaces, a number, a dot, and at least one non-digit char after
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            flushBullets();
            inNumberedSection = true;
            html += `<div class="feat-heading">${line}</div>`;
            continue;
        }

        // ── EXPLICIT BULLET: lines starting with - * • ──
        if (/^[-*•]\s+/.test(line)) {
            bulletBuffer.push(line.replace(/^[-*•]\s+/, ''));
            inNumberedSection = false;
            continue;
        }

        // ── KEY: VALUE pairs (like "Frontend: React Native") ──
        const kvMatch = line.match(/^([A-Za-z][A-Za-z\s/&]+):\s+(.+)/);
        if (kvMatch && !inNumberedSection && line.length < 120) {
            flushBullets();
            html += `<div class="kv-row"><span class="kv-key">${kvMatch[1]}:</span> <span>${kvMatch[2]}</span></div>`;
            continue;
        }

        // ── Short standalone lines → auto bullet ──
        // But NOT if they look like they could be a key-value without value
        if (line.length < 100 && !line.endsWith(':') && !/^(Phase|Step|Stage)\s*\d/.test(line)) {
            bulletBuffer.push(line);
            continue;
        }

        // ── Long descriptive text → paragraph ──
        flushBullets();
        html += `<p>${line}</p>`;
        inNumberedSection = false;
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
            project_name: (proposal as any).title || proposal.project.name,
            current_date: (proposal as any).proposalDate ||
                new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            company_details: 'ArgosMob Tech & AI',
            features: smartFormat((proposal as any).features),
            intro: (proposal as any).intro ? marked.parse((proposal as any).intro as string) as string : '',
            aboutCompany: (proposal as any).aboutCompany
                ? marked.parse((proposal as any).aboutCompany as string) as string
                : undefined,
            techStack: smartFormat((proposal as any).techStack),
            deliverables: smartFormat((proposal as any).deliverables),
            timeline: smartFormat((proposal as any).timeline),
            changeRequest: (proposal as any).changeRequest ? marked.parse((proposal as any).changeRequest as string) as string : '',
            cost_table: costTable,
            grand_total: grandTotal,
            amc_details: '',
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
