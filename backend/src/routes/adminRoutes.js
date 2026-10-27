import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'manager'));

router.get('/dashboard', admin.getDashboardStats);
router.get('/users', admin.getUsers);
router.put('/users/:id/block', authorize('admin'), admin.toggleBlockUser);
router.put('/users/:id/role', authorize('admin'), admin.changeUserRole);
router.delete('/users/:id', authorize('admin'), admin.deleteUser);

// RAG Knowledge Base & Automated Evaluation routes
router.get('/rag/documents', admin.getRagDocuments);
router.post('/rag/reindex', admin.reindexKnowledge);
router.get('/rag/evals', admin.getEvalRuns);
router.get('/rag/evals/:runId', admin.getEvalRunById);
router.post('/rag/evals/trigger', admin.triggerEvalRun);

export default router;
