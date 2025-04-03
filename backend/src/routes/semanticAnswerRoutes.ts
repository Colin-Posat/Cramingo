import { Router } from 'express';
import { checkSemanticAnswer } from '../controllers/semanticAnswerController';

// Create a router using the explicit Router type
const semanticRouter = Router();

// Define the route with the correct handler
semanticRouter.post('/check', checkSemanticAnswer);

// Export the router
export default semanticRouter;
