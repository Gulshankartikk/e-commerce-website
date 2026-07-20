/**
 * Chainable query builder for list endpoints.
 * Supports: keyword search, field filters (category/brand/color/size/rating/price/stock),
 * sorting presets, and pagination.
 */
export default class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;        // Mongoose query
    this.queryString = queryString; // req.query
    this.filterConditions = {};
  }

  /** Full-text keyword search on name/description/tags with regex fallback. */
  search() {
    if (this.queryString.keyword) {
      const kw = String(this.queryString.keyword).trim();
      this.filterConditions.$or = [
        { name: { $regex: kw, $options: 'i' } },
        { tags: { $regex: kw, $options: 'i' } },
        { description: { $regex: kw, $options: 'i' } },
      ];
    }
    return this;
  }

  /** Apply category/brand/color/size/rating/price/availability filters. */
  filter() {
    const q = this.queryString;
    if (q.category) this.filterConditions.category = { $in: String(q.category).split(',') };
    if (q.brand) this.filterConditions.brand = { $in: String(q.brand).split(',') };
    if (q.color) this.filterConditions.colors = { $in: String(q.color).split(',').map((c) => new RegExp(`^${c}$`, 'i')) };
    if (q.size) this.filterConditions.sizes = { $in: String(q.size).split(',') };
    if (q.rating) this.filterConditions.ratingsAverage = { $gte: Number(q.rating) };
    if (q.minPrice || q.maxPrice) {
      this.filterConditions.price = {};
      if (q.minPrice) this.filterConditions.price.$gte = Number(q.minPrice);
      if (q.maxPrice) this.filterConditions.price.$lte = Number(q.maxPrice);
    }
    if (q.inStock === 'true') this.filterConditions.stock = { $gt: 0 };
    if (q.flashSale === 'true') this.filterConditions.isFlashSale = true;
    if (q.featured === 'true') this.filterConditions.isFeatured = true;
    this.query = this.query.find(this.filterConditions);
    return this;
  }

  /** Sorting presets matching the storefront dropdown. */
  sort() {
    const map = {
      'price-asc': 'price',
      'price-desc': '-price',
      newest: '-createdAt',
      'best-selling': '-sold',
      'most-rated': '-ratingsCount -ratingsAverage',
      rating: '-ratingsAverage',
    };
    this.query = this.query.sort(map[this.queryString.sort] || '-createdAt');
    return this;
  }

  /** Page/limit pagination (limit capped at 48). */
  paginate() {
    const page = Math.max(1, Number(this.queryString.page) || 1);
    const limit = Math.min(48, Number(this.queryString.limit) || 12);
    this.page = page;
    this.limit = limit;
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    return this;
  }
}
