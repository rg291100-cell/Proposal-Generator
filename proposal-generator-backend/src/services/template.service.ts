import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { marked } from 'marked';

export interface TemplateData {
    client_name: string;
    project_name: string;
    modules?: any[];
    cost_table: any[];
    grand_total: number;
    sla_table?: string;
    current_date?: string;
    amc_details?: string;
    company_details?: string;
    features?: string;
    clientName?: string;
    intro?: string;
    techStack?: string;
    deliverables?: string;
    timeline?: string;
    changeRequest?: string;
    sections: Array<{
        name: string;
        enabled: boolean;
        content: string;
    }>;
}

export class TemplateService {
    async loadTemplate(templateName: string): Promise<string> {
        const templatePath = path.join(__dirname, '../../src/templates', `${templateName}.hbs`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        return fs.readFileSync(templatePath, 'utf8');
    }

    async renderHtml(templateName: string, data: TemplateData): Promise<string> {
        const rawTemplate = await this.loadTemplate(templateName);

        // Parse internal markdown/handlebars embedded within section constraints dynamically
        const processedSections = data.sections.map((sec) => {
            if (!sec.enabled) return sec;
            const sectionTemplateCompiled = Handlebars.compile(sec.content);
            return {
                ...sec,
                content: sectionTemplateCompiled(data),
            };
        });

        const parsedData = { ...data, sections: processedSections };

        // Compile main scaffold with fully nested data
        const template = Handlebars.compile(rawTemplate);
        return template(parsedData);
    }
}
