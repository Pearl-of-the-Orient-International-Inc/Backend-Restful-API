-- CreateEnum
CREATE TYPE "ChaplainProductCategory" AS ENUM ('PIN', 'PATCH', 'STICKER', 'ACCESSORY', 'APPAREL', 'OTHER');

-- CreateTable
CREATE TABLE "ChaplainProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ChaplainProductCategory" NOT NULL DEFAULT 'OTHER',
    "price" DECIMAL(10,2) NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "imageUrl" TEXT NOT NULL,
    "imageFileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaplainProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChaplainProduct_slug_key" ON "ChaplainProduct"("slug");
CREATE INDEX "ChaplainProduct_name_idx" ON "ChaplainProduct"("name");
CREATE INDEX "ChaplainProduct_category_idx" ON "ChaplainProduct"("category");
CREATE INDEX "ChaplainProduct_isActive_idx" ON "ChaplainProduct"("isActive");
CREATE INDEX "ChaplainProduct_sortOrder_idx" ON "ChaplainProduct"("sortOrder");
CREATE INDEX "ChaplainProduct_stockQuantity_idx" ON "ChaplainProduct"("stockQuantity");
