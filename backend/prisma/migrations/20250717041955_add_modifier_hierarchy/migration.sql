-- AlterTable
ALTER TABLE `modifier` ADD COLUMN `parentId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `modifier` ADD CONSTRAINT `modifier_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `modifier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
