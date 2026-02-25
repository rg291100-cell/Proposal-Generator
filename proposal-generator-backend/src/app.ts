import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import loggerMiddleware from './middlewares/loggerMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import apiRoutes from './routes';

const app: Application = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors()); // Enables CORS for React frontend connection
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middlewares
app.use(loggerMiddleware);

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware (must be after routes)
app.use(errorHandler);

export default app;
