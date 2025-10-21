import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, stories, Story, InsertStory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Story queries
export async function createStory(story: InsertStory): Promise<Story | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create story: database not available");
    return null;
  }

  try {
    await db.insert(stories).values(story);
    const result = await db.select().from(stories).where(eq(stories.id, story.id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create story:", error);
    return null;
  }
}

export async function getUserStories(userId: string): Promise<Story[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get stories: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get stories:", error);
    return [];
  }
}

export async function getStory(id: string): Promise<Story | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get story: database not available");
    return null;
  }

  try {
    const result = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get story:", error);
    return null;
  }
}

export async function deleteStory(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete story: database not available");
    return false;
  }

  try {
    await db.delete(stories).where(eq(stories.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete story:", error);
    return false;
  }
}

