-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT,
    "yjs_state" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "document_id" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("document_id","level")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "creator_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "yjs_state" BYTEA NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taken_by_name" TEXT,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_project_id_idx" ON "documents"("project_id" ASC);

-- CreateIndex
CREATE INDEX "permissions_token_idx" ON "permissions"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_token_key" ON "permissions"("token" ASC);

-- CreateIndex
CREATE INDEX "projects_creator_token_idx" ON "projects"("creator_token" ASC);

-- CreateIndex
CREATE INDEX "snapshots_document_id_taken_at_idx" ON "snapshots"("document_id" ASC, "taken_at" ASC);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
