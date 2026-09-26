-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "last_edited_by_color" TEXT,
ADD COLUMN     "last_edited_by_name" TEXT,
ADD COLUMN     "open_comments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "open_suggestions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "owner_id" UUID;

-- CreateIndex
CREATE INDEX "projects_owner_id_idx" ON "projects"("owner_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
