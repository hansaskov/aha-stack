import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  isEmailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
});

export const oauthTable = sqliteTable(
  "oauth_account",
  {
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.providerId, table.provider] }),
    };
  },
);

export const sessionTable = sqliteTable("user_session", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer("expires_at").notNull(),
});

export type DatabaseUser = typeof userTable.$inferInsert;
export type DatabaseUserAttributes = Omit<DatabaseUser, "id">;
