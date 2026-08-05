import { Router } from 'express';
import { catalogController } from './catalog.controller';

const router = Router();

router.get('/', (req, res) => catalogController.listProducts(req, res));
router.get('/:id', (req, res) => catalogController.getProductById(req, res));

export default router;