import { relations } from "drizzle-orm/relations";
import { users, favorites, bids, reminders, provinces, cities, searchHistory } from "./schema";

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	bid: one(bids, {
		fields: [favorites.bidId],
		references: [bids.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	favorites: many(favorites),
	reminders: many(reminders),
	searchHistories: many(searchHistory),
}));

export const bidsRelations = relations(bids, ({many}) => ({
	favorites: many(favorites),
	reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({one}) => ({
	user: one(users, {
		fields: [reminders.userId],
		references: [users.id]
	}),
	bid: one(bids, {
		fields: [reminders.bidId],
		references: [bids.id]
	}),
}));

export const citiesRelations = relations(cities, ({one}) => ({
	province: one(provinces, {
		fields: [cities.provinceId],
		references: [provinces.id]
	}),
}));

export const provincesRelations = relations(provinces, ({many}) => ({
	cities: many(cities),
}));

export const searchHistoryRelations = relations(searchHistory, ({one}) => ({
	user: one(users, {
		fields: [searchHistory.userId],
		references: [users.id]
	}),
}));