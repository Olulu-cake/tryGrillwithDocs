import { Router } from 'express';
import { getOrderById, createOrder, getOrdersByUser, trackOrder } from './order.controller';

const router = Router();

router.post('/', createOrder);
router.get('/user', getOrdersByUser);
router.get('/track', trackOrder);
router.get('/:id', getOrderById);

export default router;
