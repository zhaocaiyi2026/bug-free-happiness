import { pgTable, serial, timestamp, unique, varchar, text, integer, foreignKey, numeric, boolean, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	phone: varchar({ length: 20 }),
	password: varchar({ length: 255 }),
	nickname: varchar({ length: 100 }),
	avatar: text(),
	vipLevel: integer("vip_level").default(0),
	vipExpireAt: timestamp("vip_expire_at", { mode: 'string' }),
	points: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_phone_key").on(table.phone),
]);

export const favorites = pgTable("favorites", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	bidId: integer("bid_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bidId],
			foreignColumns: [bids.id],
			name: "favorites_bid_id_fkey"
		}).onDelete("cascade"),
	unique("favorites_user_id_bid_id_key").on(table.userId, table.bidId),
]);

export const bids = pgTable("bids", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text(),
	budget: numeric({ precision: 15, scale:  2 }),
	province: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	industry: varchar({ length: 100 }),
	bidType: varchar("bid_type", { length: 50 }),
	publishDate: timestamp("publish_date", { mode: 'string' }),
	deadline: timestamp({ mode: 'string' }),
	source: varchar({ length: 200 }),
	sourceUrl: text("source_url"),
	isUrgent: boolean("is_urgent").default(false),
	status: varchar({ length: 20 }).default('active'),
	viewCount: integer("view_count").default(0),
	// 新增联系人信息字段
	contactPerson: varchar("contact_person", { length: 100 }),
	contactPhone: varchar("contact_phone", { length: 50 }),
	contactEmail: varchar("contact_email", { length: 200 }),
	contactAddress: varchar("contact_address", { length: 500 }),
	// 新增详细信息字段
	projectLocation: varchar("project_location", { length: 500 }),
	requirements: text(),
	openBidTime: timestamp("open_bid_time", { mode: 'string' }),
	openBidLocation: varchar("open_bid_location", { length: 500 }),
	// 数据源标识字段
	sourcePlatform: varchar("source_platform", { length: 50 }),
	sourceId: varchar("source_id", { length: 100 }),
	dataType: varchar("data_type", { length: 20 }).default('crawl'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// 中标信息表
export const winBids = pgTable("win_bids", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text(),
	// 中标金额
	winAmount: numeric("win_amount", { precision: 15, scale: 2 }),
	province: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	industry: varchar({ length: 100 }),
	// 招标方式
	bidType: varchar("bid_type", { length: 50 }),
	// 中标单位信息
	winCompany: varchar("win_company", { length: 200 }),
	winCompanyAddress: varchar("win_company_address", { length: 500 }),
	winCompanyPhone: varchar("win_company_phone", { length: 50 }),
	// 项目信息
	projectLocation: varchar("project_location", { length: 500 }),
	// 中标日期
	winDate: timestamp("win_date", { mode: 'string' }),
	// 公告日期
	publishDate: timestamp("publish_date", { mode: 'string' }),
	// 数据来源
	source: varchar({ length: 200 }),
	sourceUrl: text("source_url"),
	viewCount: integer("view_count").default(0),
	// 数据源标识字段
	sourcePlatform: varchar("source_platform", { length: 50 }),
	sourceId: varchar("source_id", { length: 100 }),
	dataType: varchar("data_type", { length: 20 }).default('crawl'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const reminders = pgTable("reminders", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	bidId: integer("bid_id"),
	remindAt: timestamp("remind_at", { mode: 'string' }),
	isNotified: boolean("is_notified").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reminders_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bidId],
			foreignColumns: [bids.id],
			name: "reminders_bid_id_fkey"
		}).onDelete("cascade"),
]);

export const provinces = pgTable("provinces", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 10 }),
}, (table) => [
	unique("provinces_name_key").on(table.name),
	unique("provinces_code_key").on(table.code),
]);

export const cities = pgTable("cities", {
	id: serial().primaryKey().notNull(),
	provinceId: integer("province_id"),
	name: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [provinces.id],
			name: "cities_province_id_fkey"
		}).onDelete("cascade"),
	unique("cities_province_id_name_key").on(table.provinceId, table.name),
]);

export const industries = pgTable("industries", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }),
}, (table) => [
	unique("industries_name_key").on(table.name),
	unique("industries_code_key").on(table.code),
]);

export const searchHistory = pgTable("search_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	keyword: varchar({ length: 200 }),
	filters: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "search_history_user_id_fkey"
		}).onDelete("cascade"),
]);

// 同步日志表 - 用于追踪官方数据源同步状态
export const syncLogs = pgTable("sync_logs", {
	id: serial().primaryKey().notNull(),
	sourcePlatform: varchar("source_platform", { length: 50 }).notNull(),
	syncType: varchar("sync_type", { length: 50 }).notNull(), // 'full' | 'incremental' | 'realtime'
	startTime: timestamp("start_time", { mode: 'string' }).notNull().default(sql`CURRENT_TIMESTAMP`),
	endTime: timestamp("end_time", { mode: 'string' }),
	totalCount: integer("total_count").default(0),
	successCount: integer("success_count").default(0),
	errorCount: integer("error_count").default(0),
	errorMessage: text("error_message"),
	status: varchar({ length: 20 }).default('running'), // 'running' | 'completed' | 'failed'
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});
