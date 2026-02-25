import { Router } from 'express';
import healthRouter from './health';
import { createClient, getClients, createSection, getSections, createTemplate, getTemplates } from '../controllers/api.controller';
import { createProposal, getProposal, generateProposalDoc } from '../controllers/proposal.controller';

const router = Router();

router.use('/health', healthRouter);

router.post('/clients', createClient);
router.get('/clients', getClients);

router.post('/sections', createSection);
router.get('/sections', getSections);

router.post('/templates', createTemplate);
router.get('/templates', getTemplates);

router.post('/proposals', createProposal);
router.get('/proposals/:id', getProposal);
router.post('/proposals/:id/generate', generateProposalDoc);

export default router;
