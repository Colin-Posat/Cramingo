import { Router } from 'express';
import { upload, parsePdf } from '../controllers/fileController';

const router = Router();

router.post('/parse-pdf', upload.single('pdfFile'), parsePdf);

export default router;