import { SearchService } from './search.service.js';

const searchService = new SearchService();

export class SearchController {
  async omniSearch(req, res, next) {
    try {
      const { q, limit } = req.query;
      const results = await searchService.omniSearch(q, {
        shopId: req.shopId,
        role: req.role,
        limit,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }
}
