import prisma from './src/config/db';

async function seed() {
    const client = await prisma.client.create({
        data: { name: 'Globex Corporation', company: 'Globex Inc.', email: 'hello@globex.com' }
    });

    const project = await prisma.project.create({
        data: { name: 'Website Redesign 2026', clientId: client.id }
    });

    const intro = await prisma.reusableSection.create({
        data: {
            name: 'Introduction',
            content: '<p>Thank you for giving us the opportunity to present this proposal for <strong>{{client_name}}</strong>.</p><p>We are excited to help you achieve your goals through this project.</p>'
        }
    });

    const scope = await prisma.reusableSection.create({
        data: {
            name: 'Scope of Work',
            content: '<ul><li>UI/UX Design</li><li>Frontend Architecture</li><li>Backend API</li></ul>'
        }
    });

    const legal = await prisma.reusableSection.create({
        data: {
            name: 'Legal Terms',
            content: '<p>This document is highly confidential and intended solely for the use of the individual or entity to whom it is addressed.</p>'
        }
    });

    const template = await prisma.proposalTemplate.create({
        data: {
            name: 'Standard Software Proposal',
            description: 'The default full-stack web application proposal template.',
            sections: {
                create: [
                    { sectionId: intro.id, order: 1, isDefault: true },
                    { sectionId: scope.id, order: 2, isDefault: true },
                    { sectionId: legal.id, order: 3, isDefault: false },
                ]
            }
        }
    });

    const data = {
        client, project, intro, scope, legal, template
    };

    // Hack for React UI simplicity: Output the Project ID to use
    console.log('Project ID for React App.tsx hardcode:', project.id);
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
