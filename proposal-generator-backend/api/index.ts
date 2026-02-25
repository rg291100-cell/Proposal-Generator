import app from '../src/app';

// Vercel serverless handler — exports the Express app directly.
// @vercel/node automatically wraps Express apps exported as default.
export default app;
