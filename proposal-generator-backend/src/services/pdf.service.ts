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
                headerTemplate: '<div style="font-size:10px; width: 100%; padding: 0 40px; color:#aaa; display:flex; justify-content:space-between; align-items:flex-end;"><div style="display:flex; align-items:center; gap:8px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMDAgMjAwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InRvcEV5ZWxpZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWIzZjZiIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjMwJSIgc3RvcC1jb2xvcj0iIzJkNmE5YSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNmJjZGVlIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYm90dG9tRXllbGlkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxYjNmNmIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMzAlIiBzdG9wLWNvbG9yPSIjMmQ2YTlhIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2YmNkZWUiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJpcmlzIiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwJSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMiUiIHN0b3AtY29sb3I9IiNlM2YwZjciIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMjUlIiBzdG9wLWNvbG9yPSIjODBjNmU4IiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjYwJSIgc3RvcC1jb2xvcj0iIzQ2ODJiNCIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI5NSUiIHN0b3AtY29sb3I9IiMxYTQyNmYiIC8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogIDwvZGVmcz4KCiAgPCEtLSBUb3AgRXllbGlkIC0tPgogIDxwYXRoIGQ9Ik0gNzAgOTUgQyAxMDAgNTAsIDIwMCA2NSwgMjcwIDcwIEMgMjMwIDg1LCAxNzAgODAsIDE0MCA3MCBDIDExMCA2MCwgOTAgNzAsIDcwIDk1IFoiIGZpbGw9InVybCgjdG9wRXllbGlkKSIgLz4KCiAgPCEtLSBCb3R0b20gRXllbGlkIC0tPgogIDxwYXRoIGQ9Ik0gMzAgMTM1IEMgNjAgMTEwLCAxMTAgMTMwLCAyMDAgMTE1IEMgMTcwIDE0NSwgMTEwIDE1MCwgNjAgMTQwIEMgNDUgMTM3LCAzNSAxMzUsIDMwIDEzNSBaIiBmaWxsPSJ1cmwoI2JvdHRvbUV5ZWxpZCkiIC8+CgogIDwhLS0gSXJpcyAmIFB1cGlsIC0tPgogIDxjaXJjbGUgY3g9IjE0MCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9InVybCgjaXJpcykiIC8+CiAgPGNpcmNsZSBjeD0iMTQwIiBjeT0iMTAwIiByPSIxNCIgZmlsbD0iIzAwMDAwMCIgLz4KPC9zdmc+Cg==" width="50" height="auto" /><strong style="color: #0d2a5a; font-size:12px;">ArgosMob Tech &amp; AI</strong></div> <span style="font-family: sans-serif;">Formal Proposal</span></div>',
                footerTemplate: '<div style="font-size:10px; text-align:center; width: 100%; color:#aaa; font-family: sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
            });

            return { base64Pdf: Buffer.from(pdfBuffer).toString('base64') };
        } finally {
            if (browser) await browser.close();
        }
    }
}
