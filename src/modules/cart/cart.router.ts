import { Router } from 'express';
import { cartController } from './cart.controller';

const router = Router();
router.use('/', cartController);
export default router;
