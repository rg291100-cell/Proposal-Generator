import path from 'path';
import fs from 'fs';

export class PdfService {
    async generatePdf(html: string, proposalId: string): Promise<{ base64Pdf: string }> {
        // Lazy imports — only loaded when PDF is actually requested, NOT at startup.
        // This prevents Vercel from crashing when any other API route is called.
        const { default: puppeteer } = await import('puppeteer-core');
        const chromium = await import('@sparticuz/chromium').then(m => m.default);

        const storageDir = path.resolve('/tmp', 'proposals');
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        const executablePath = await chromium.executablePath();

        let browser: any;
        try {
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1280, height: 960 },
                executablePath: executablePath || '/usr/bin/google-chrome',
                headless: true,
            });
        } catch (e) {
            // Local fallback when Sparticuz can't find its binary (dev environment)
            const standardPuppeteer = await import('puppeteer' as any).catch(() => null);
            if (!standardPuppeteer) throw new Error('No Puppeteer binary available. Install puppeteer for local dev.');
            browser = await standardPuppeteer.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '60px',
                    bottom: '60px',
                    left: '40px',
                    right: '40px'
                },
                displayHeaderFooter: true,
                headerTemplate: '<div style="font-size:10px; width: 100%; padding: 0 40px; color:#aaa; display:flex; justify-content:space-between; align-items:flex-end;"><div><strong style="color: #334155; font-size:12px;">ARGOSMOB TECH &amp; AI</strong></div><span style="font-family: sans-serif;">Formal Proposal</span></div>',
                footerTemplate: '<div style="font-size:10px; text-align:center; width: 100%; color:#aaa; font-family: sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
            });

            return { base64Pdf: Buffer.from(pdfBuffer).toString('base64') };
        } finally {
            if (browser) await browser.close();
        }
    }
}
