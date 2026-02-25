import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import loggerMiddleware from './middlewares/loggerMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import apiRoutes from './routes';

const app: Application = express();

app.use(helmet({
    contentSecurityPolicy: false, // Needed for Puppeteer PDF rendering in some cases
}));
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://proposal-generator-busy.vercel.app',
        /\.vercel\.app$/,   // Any vercel preview deployment
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middlewares
app.use(loggerMiddleware);

// Root Route (to avoid Cannot GET / on Vercel)
app.get('/', (req, res) => {
    res.send('ArgosMob Proposal Generator API is running!');
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware (must be after routes)
app.use(errorHandler);

export default app;
