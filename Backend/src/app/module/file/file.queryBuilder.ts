import { FileQueryParams } from "./file.querySchema";

interface FileModelDelegate {
  findMany(args: any): Promise<any[]>;
  count(args: any): Promise<number>;
}

interface FileQueryResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const SEARCHABLE_FIELDS = ["name", "extension", "mimeType"] as const;

export class FileQueryBuilder<T = unknown> {
  private where: Record<string, any>;
  private orderBy: Record<string, any> = {};

  constructor(
    private model: FileModelDelegate,
    private params: FileQueryParams,

    baseWhere: Record<string, any> = {}
  ) {
    this.where = { ...baseWhere };
  }

  build(): this {
    this.applySearch();
    this.applyDirectFilters();
    this.applyProviderFilter();
    this.applySizeRange();
    this.applyDateRange();
    this.applySort();
    return this;
  }

  private applySearch() {
    const { search } = this.params;
    if (!search) return;

    this.where.OR = SEARCHABLE_FIELDS.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }

  private applyDirectFilters() {
    const { mimeType, extension, isTrash, isFavorite, connectedAccountId, folderId } =
      this.params;

    if (mimeType) this.where.mimeType = mimeType;
    if (extension) this.where.extension = extension;
    if (isTrash !== undefined) this.where.isTrash = isTrash;
    if (isFavorite !== undefined) this.where.isFavorite = isFavorite;
    if (connectedAccountId) this.where.connectedAccountId = connectedAccountId;

    // folderId: if provided, show files in that folder
    // if not provided, don't filter by folder (show all files)
    if (folderId) this.where.folderId = folderId;
  }

  private applyProviderFilter() {
    const { provider } = this.params;
    if (!provider) return;
    this.where.connectedAccount = {
      ...(this.where.connectedAccount ?? {}),
      provider,
    };
  }

  private applySizeRange() {
    const { minSize, maxSize } = this.params;
    if (minSize === undefined && maxSize === undefined) return;


    this.where.size = {
      ...(minSize !== undefined && { gte: BigInt(minSize) }),
      ...(maxSize !== undefined && { lte: BigInt(maxSize) }),
    };
  }

  private applyDateRange() {
    const { createdAfter, createdBefore } = this.params;
    if (!createdAfter && !createdBefore) return;

    this.where.createdAt = {
      ...(createdAfter && { gte: createdAfter }),
      ...(createdBefore && { lte: createdBefore }),
    };
  }

  private applySort() {
    this.orderBy = { [this.params.sortBy]: this.params.sortOrder };
  }

  private get skip() {
    return (this.params.page - 1) * this.params.limit;
  }

  async execute(): Promise<FileQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count({ where: this.where }),
      this.model.findMany({
        where: this.where,
        orderBy: this.orderBy,
        skip: this.skip,
        take: this.params.limit,
        include: {
          connectedAccount: { select: { provider: true, email: true } },
        },
      }),
    ]);

    return {
      data: data as T[],
      meta: {
        page: this.params.page,
        limit: this.params.limit,
        total,
        totalPages: Math.ceil(total / this.params.limit),
      },
    };
  }
}
