import { supabaseServer } from '@/lib/supabase';

/**
 * Abstract base repository for Supabase data access
 * Implements common CRUD operations and query building
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected supabase = supabaseServer();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      return null;
    }
  }

  /**
   * Find records by filter criteria
   */
  async find(filter: Partial<T> = {}): Promise<T[]> {
    try {
      let query = this.supabase.from(this.tableName).select();

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error finding ${this.tableName}:`, error);
      return [];
    }
  }

  /**
   * Find records with advanced filtering
   */
  async findWithFilters(filters: {
    eq?: Record<string, any>;
    neq?: Record<string, any>;
    gt?: Record<string, any>;
    gte?: Record<string, any>;
    lt?: Record<string, any>;
    lte?: Record<string, any>;
    like?: Record<string, any>;
    ilike?: Record<string, any>;
    in?: Record<string, any[]>;
    orderBy?: { column: string; ascending?: boolean }[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    try {
      let query = this.supabase.from(this.tableName).select();

      // Apply equality filters
      if (filters.eq) {
        Object.entries(filters.eq).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply not-equal filters
      if (filters.neq) {
        Object.entries(filters.neq).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.neq(key, value);
          }
        });
      }

      // Apply greater-than filters
      if (filters.gt) {
        Object.entries(filters.gt).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.gt(key, value);
          }
        });
      }

      // Apply greater-than-or-equal filters
      if (filters.gte) {
        Object.entries(filters.gte).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.gte(key, value);
          }
        });
      }

      // Apply less-than filters
      if (filters.lt) {
        Object.entries(filters.lt).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.lt(key, value);
          }
        });
      }

      // Apply less-than-or-equal filters
      if (filters.lte) {
        Object.entries(filters.lte).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.lte(key, value);
          }
        });
      }

      // Apply like filters
      if (filters.like) {
        Object.entries(filters.like).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.like(key, value);
          }
        });
      }

      // Apply case-insensitive like filters
      if (filters.ilike) {
        Object.entries(filters.ilike).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.ilike(key, value);
          }
        });
      }

      // Apply in-clause filters
      if (filters.in) {
        Object.entries(filters.in).forEach(([key, values]) => {
          if (values && values.length > 0) {
            query = query.in(key, values);
          }
        });
      }

      // Apply ordering
      if (filters.orderBy) {
        filters.orderBy.forEach(({ column, ascending = true }) => {
          query = query.order(column, { ascending });
        });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error finding ${this.tableName} with filters:`, error);
      return [];
    }
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Create multiple records
   */
  async createMany(dataArray: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(dataArray)
        .select();

      if (error) throw error;
      return result || [];
    } catch (error) {
      console.error(`Error creating multiple ${this.tableName}:`, error);
      return [];
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  /**
   * Update multiple records by filter
   */
  async updateMany(
    filter: Partial<T>,
    data: Partial<T>
  ): Promise<{ count: number | null }> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() });

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query.select('id');

      if (error) throw error;
      return { count };
    } catch (error) {
      console.error(`Error updating multiple ${this.tableName}:`, error);
      return { count: null };
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple records by filter
   */
  async deleteMany(filter: Partial<T>): Promise<{ count: number | null }> {
    try {
      let query = this.supabase.from(this.tableName).delete();

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query.select('id');

      if (error) throw error;
      return { count };
    } catch (error) {
      console.error(`Error deleting multiple ${this.tableName}:`, error);
      return { count: null };
    }
  }

  /**
   * Count records by filter
   */
  async count(filter: Partial<T> = {}): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return 0;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(filter: Partial<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  /**
   * Get paginated results
   */
  async paginate(
    page: number = 1,
    pageSize: number = 10,
    filter: Partial<T> = {},
    orderBy?: { column: string; ascending?: boolean }
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      // Get total count
      const total = await this.count(filter);

      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const totalPages = Math.ceil(total / pageSize);

      // Get data
      const data = await this.findWithFilters({
        eq: filter as Record<string, any>,
        orderBy: orderBy ? [orderBy] : undefined,
        limit: pageSize,
        offset,
      });

      return {
        data,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error(`Error paginating ${this.tableName}:`, error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async executeQuery<R = any>(
    query: string,
    params: any[] = []
  ): Promise<R[]> {
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query,
        params,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error executing query on ${this.tableName}:`, error);
      return [];
    }
  }
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}