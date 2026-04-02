import { pgTable, serial, varchar, timestamp, text, index, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 学习会话表 - 记录每次学习活动
export const learningSessions = pgTable(
  "learning_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    student_id: varchar("student_id", { length: 100 }).notNull(), // 学生标识（匿名ID或用户ID）
    student_name: varchar("student_name", { length: 100 }), // 学生昵称（可选）
    module_type: varchar("module_type", { length: 20 }).notNull(), // 模块类型: planet/bottle/detective
    module_detail: varchar("module_detail", { length: 50 }), // 模块详情：如 bottle 的 water/land，detective 的病例ID
    status: varchar("status", { length: 20 }).notNull().default("active"), // active/completed
    score: integer("score"), // 评分（如生态瓶评分）
    started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    ended_at: timestamp("ended_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("learning_sessions_student_id_idx").on(table.student_id),
    index("learning_sessions_module_type_idx").on(table.module_type),
    index("learning_sessions_started_at_idx").on(table.started_at),
  ]
);

// 对话消息表 - 记录与AI的每条对话
export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    session_id: varchar("session_id", { length: 36 }).notNull().references(() => learningSessions.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // user/assistant
    content: text("content").notNull(), // 消息内容
    metadata: text("metadata"), // JSON格式的元数据（如环境数据等）
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversation_messages_session_id_idx").on(table.session_id),
    index("conversation_messages_created_at_idx").on(table.created_at),
  ]
);

// 生成图片表 - 记录AI生成的图片
export const generatedImages = pgTable(
  "generated_images",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    session_id: varchar("session_id", { length: 36 }).notNull().references(() => learningSessions.id, { onDelete: "cascade" }),
    image_url: text("image_url").notNull(), // 图片URL
    prompt: text("prompt"), // 生成图片的提示词
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("generated_images_session_id_idx").on(table.session_id),
    index("generated_images_created_at_idx").on(table.created_at),
  ]
);
