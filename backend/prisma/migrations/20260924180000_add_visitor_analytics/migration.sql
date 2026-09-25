-- CreateTable Visitor
CREATE TABLE IF NOT EXISTS "Visitor" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstAuthenticatedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable VisitorSession
CREATE TABLE IF NOT EXISTS "VisitorSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "entryPage" TEXT,
    "exitPage" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable PageView
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Visitor_visitorId_key" ON "Visitor"("visitorId");
CREATE INDEX IF NOT EXISTS "Visitor_userId_idx" ON "Visitor"("userId");
CREATE INDEX IF NOT EXISTS "Visitor_firstSeenAt_idx" ON "Visitor"("firstSeenAt");
CREATE INDEX IF NOT EXISTS "Visitor_firstAuthenticatedAt_idx" ON "Visitor"("firstAuthenticatedAt");
CREATE INDEX IF NOT EXISTS "Visitor_lastSeenAt_idx" ON "Visitor"("lastSeenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VisitorSession_visitorId_idx" ON "VisitorSession"("visitorId");
CREATE INDEX IF NOT EXISTS "VisitorSession_userId_idx" ON "VisitorSession"("userId");
CREATE INDEX IF NOT EXISTS "VisitorSession_startedAt_idx" ON "VisitorSession"("startedAt");
CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeenAt_idx" ON "VisitorSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageView_visitorId_idx" ON "PageView"("visitorId");
CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId");
CREATE INDEX IF NOT EXISTS "PageView_userId_idx" ON "PageView"("userId");
CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path");
CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Visitor_userId_fkey'
    ) THEN
        ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VisitorSession_visitorId_fkey'
    ) THEN
        ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("visitorId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VisitorSession_userId_fkey'
    ) THEN
        ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PageView_visitorId_fkey'
    ) THEN
        ALTER TABLE "PageView" ADD CONSTRAINT "PageView_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("visitorId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PageView_sessionId_fkey'
    ) THEN
        ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PageView_userId_fkey'
    ) THEN
        ALTER TABLE "PageView" ADD CONSTRAINT "PageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
