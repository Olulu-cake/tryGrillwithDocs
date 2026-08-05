import { Router, Request, Response } from 'express';
import { authRbacGuard } from './shared/auth-rbac.guard';
import { catalogService } from './modules/catalog/catalog.service';
import { reconciliationService } from './modules/fulfillment/services/reconciliation.service'; // Assuming an instance is exported

const router = Router();
const adminGuard = authRbacGuard('admin:all');

// Product Management
router.post('/products', adminGuard, async (req: Request, res: Response) => {
  const product = await catalogService.createProduct(req.body);
  res.status(201).json(product);
});

router.put('/products/:id', adminGuard, async (req: Request, res: Response) => {
  const product = await catalogService.updateProduct(String(req.params.id), req.body);
  res.json(product);
});

router.delete('/products/:id', adminGuard, async (req: Request, res: Response) => {
  // await catalogService.deleteProduct(String(req.params.id));
  res.status(501).json({message: 'Not implemented'});
});

// Reconciliation Inspection
router.get('/reconciliation/mismatches', adminGuard, async (req: Request, res: Response) => {
  const mismatches = await reconciliationService.getUnresolvedMismatches();
  res.json(mismatches);
});

export const adminRouter = router;
