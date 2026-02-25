import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { SectionService } from '../services/section.service';
import { TemplateDbService } from '../services/template-db.service';
import { CreateClientSchema, CreateSectionSchema, CreateTemplateSchema } from '../utils/schemas';

const clientService = new ClientService();
const sectionService = new SectionService();
const templateDbService = new TemplateDbService();

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = CreateClientSchema.parse(req.body);
        const client = await clientService.createClient(data);
        res.status(201).json(client);
    } catch (error) { next(error); }
};

export const getClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clients = await clientService.getClients();
        res.json(clients);
    } catch (error) { next(error); }
};

export const createSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = CreateSectionSchema.parse(req.body);
        const section = await sectionService.createSection(data);
        res.status(201).json(section);
    } catch (error) { next(error); }
};

export const getSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sections = await sectionService.getSections();
        res.json(sections);
    } catch (error) { next(error); }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = CreateTemplateSchema.parse(req.body);
        const template = await templateDbService.createTemplate(data);
        res.status(201).json(template);
    } catch (error) { next(error); }
};

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await templateDbService.getTemplates();
        res.json(templates);
    } catch (error) { next(error); }
};
