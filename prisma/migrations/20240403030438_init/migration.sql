-- CreateEnum
CREATE TYPE "runpod_status" AS ENUM ('NotStarted', 'Starting', 'Running', 'Stopped', 'Error');

-- CreateEnum
CREATE TYPE "gpu_source" AS ENUM ('Runpod');

-- CreateTable
CREATE TABLE "gpu_mint" (
    "id" SERIAL NOT NULL,
    "mint" TEXT NOT NULL,
    "gpu_source" "gpu_source" NOT NULL,
    "owner" TEXT NOT NULL,
    "minted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gpu_mint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bond_mint" (
    "id" SERIAL NOT NULL,
    "mint" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "minted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bond_mint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runpod_mint" (
    "id" SERIAL NOT NULL,
    "sig" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "runpod_id" TEXT,
    "runpod_host_id" TEXT,
    "runpod_private_key" TEXT,
    "runpod_public_key" TEXT,
    "runpod_status" "runpod_status" NOT NULL DEFAULT 'NotStarted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3),

    CONSTRAINT "runpod_mint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mint_transfer" (
    "id" SERIAL NOT NULL,
    "sig" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "from_addr" TEXT NOT NULL,
    "to_addr" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ssh_pubkey_updated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mint_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gpu_mint_mint_key" ON "gpu_mint"("mint");

-- CreateIndex
CREATE UNIQUE INDEX "bond_mint_mint_key" ON "bond_mint"("mint");

-- CreateIndex
CREATE INDEX "bond_mint_owner_idx" ON "bond_mint"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "runpod_mint_mint_key" ON "runpod_mint"("mint");

-- CreateIndex
CREATE INDEX "runpod_mint_sig_idx" ON "runpod_mint"("sig");

-- CreateIndex
CREATE INDEX "runpod_mint_mint_idx" ON "runpod_mint"("mint");

-- CreateIndex
CREATE INDEX "mint_transfer_sig_idx" ON "mint_transfer"("sig");

-- CreateIndex
CREATE INDEX "mint_transfer_mint_idx" ON "mint_transfer"("mint");

-- CreateIndex
CREATE INDEX "mint_transfer_from_addr_idx" ON "mint_transfer"("from_addr");

-- CreateIndex
CREATE INDEX "mint_transfer_to_addr_idx" ON "mint_transfer"("to_addr");

-- CreateIndex
CREATE INDEX "mint_transfer_slot_idx" ON "mint_transfer"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "mint_transfer_sig_mint_key" ON "mint_transfer"("sig", "mint");

-- AddForeignKey
ALTER TABLE "runpod_mint" ADD CONSTRAINT "runpod_mint_mint_fkey" FOREIGN KEY ("mint") REFERENCES "gpu_mint"("mint") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mint_transfer" ADD CONSTRAINT "mint_transfer_mint_fkey" FOREIGN KEY ("mint") REFERENCES "gpu_mint"("mint") ON DELETE RESTRICT ON UPDATE CASCADE;
