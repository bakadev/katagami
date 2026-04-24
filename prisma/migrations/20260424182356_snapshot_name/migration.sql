-- AlterTable
ALTER TABLE "snapshots" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE INDEX "snapshots_document_id_name_idx" ON "snapshots"("document_id", "name");
