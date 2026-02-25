import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'path';
import fs from 'fs';

export class PdfService {
    async generatePdf(html: string, proposalId: string): Promise<{ base64Pdf: string }> {
        // Optional tracking path
        const storageDir = path.resolve('/tmp', 'proposals');
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Let's resolve the executable
        const executablePath = await chromium.executablePath();

        let browser;
        try {
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: { width: 1920, height: 1080 },
                executablePath: executablePath || '/usr/bin/google-chrome', // Fallback
                headless: true,
            });
        } catch (e) {
            // Local fallback if Sparticuz fails on local windows/linux machine
            const standardPuppeteer = require('puppeteer');
            browser = await standardPuppeteer.launch({
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
                headerTemplate: '<div style="font-size:10px; width: 100%; padding: 0 40px; color:#aaa; display:flex; justify-content:space-between; align-items:flex-end;"><div style="display:flex; align-items:center; gap:8px;"><strong style="color: #334155; font-size:12px;">ARGOSMOB TECH &amp; AI</strong></div> <span style="font-family: sans-serif;">Formal Proposal</span></div>',
                footerTemplate: '<div style="font-size:10px; text-align:center; width: 100%; color:#aaa; font-family: sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
            });

            return { base64Pdf: Buffer.from(pdfBuffer).toString('base64') };
        } finally {
            if (browser) await browser.close();
        }
    }
}
