-- AlterTable
ALTER TABLE "SiteConfig" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "footerDescEn" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "footerDescEs" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "heroDescEn" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "heroDescEs" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "heroHighlightEn" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "heroHighlightEs" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "instagramUrl" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN "twitterUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MODIFIER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "role") SELECT "createdAt", "email", "id", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
