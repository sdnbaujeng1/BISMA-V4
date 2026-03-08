import serverless from 'serverless-http';
import express from 'express';
import { app } from '../../server';

const netlifyApp = express();
netlifyApp.use('/.netlify/functions', app);
netlifyApp.use(app); // Fallback

export const handler = serverless(netlifyApp);
