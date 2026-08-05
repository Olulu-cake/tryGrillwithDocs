import { Request, Response } from 'express';
import { catalogService } from './catalog.service';

export class CatalogController {
  async listProducts(req: Request, res: Response) {
    try {
      const { search, category, minPrice, maxPrice, sortBy } = req.query;

      let products = await catalogService.getProducts({
        search: search as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        sortBy: sortBy as string,
      });

      const keyword = search ? String(search).trim().toLowerCase() : '';
      if (keyword) {
        products = products.filter((p: any) => 
          (p.title && p.title.toLowerCase().includes(keyword)) ||
          (p.description && p.description.toLowerCase().includes(keyword))
        );
      }

      return res.json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      console.error('[CatalogController] listProducts error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const product = await catalogService.getProductById(id);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.json(product);
    } catch (error) {
      console.error('[CatalogController] getProductById error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const catalogController = new CatalogController();