-- CreateTable
CREATE TABLE "Step" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Step_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("chatId") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Step_uuid_key" ON "Step"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Step_chatId_key" ON "Step"("chatId");
