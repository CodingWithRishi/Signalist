'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const getAuthenticatedUserId = async (): Promise<string> => {
    if (!auth) {
        throw new Error('Auth not initialized');
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error('Unauthorized');
    }

    return userId;
};

export async function getCurrentUserWatchlist(): Promise<WatchlistItem[]> {
    try {
        const userId = await getAuthenticatedUserId();
        await connectToDatabase();

        const items = await Watchlist.find({ userId })
            .sort({ addedAt: -1 })
            .lean();

        return items.map((item) => ({
            userId: String(item.userId),
            symbol: String(item.symbol),
            company: String(item.company),
            addedAt: item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt),
        }));
    } catch (err) {
        console.error('getCurrentUserWatchlist error:', err);
        return [];
    }
}

export async function getCurrentUserWatchlistSymbols(): Promise<string[]> {
    const items = await getCurrentUserWatchlist();
    return items.map((item) => item.symbol.toUpperCase());
}

export async function isInCurrentUserWatchlist(symbol: string): Promise<boolean> {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return false;

    const symbols = await getCurrentUserWatchlistSymbols();
    return symbols.includes(normalized);
}

export async function addStockToWatchlist({
    symbol,
    company,
}: {
    symbol: string;
    company: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await getAuthenticatedUserId();
        await connectToDatabase();

        const normalizedSymbol = symbol.trim().toUpperCase();
        const normalizedCompany = company.trim() || normalizedSymbol;

        if (!normalizedSymbol) {
            return { success: false, message: 'Symbol is required' };
        }

        await Watchlist.findOneAndUpdate(
            { userId, symbol: normalizedSymbol },
            {
                $setOnInsert: {
                    userId,
                    symbol: normalizedSymbol,
                    addedAt: new Date(),
                },
                $set: {
                    company: normalizedCompany,
                },
            },
            { upsert: true, new: true }
        );

        return { success: true, message: `${normalizedSymbol} saved to watchlist` };
    } catch (err) {
        console.error('addStockToWatchlist error:', err);
        return { success: false, message: 'Failed to add stock to watchlist' };
    }
}

export async function updateWatchlistItem({
    symbol,
    company,
}: {
    symbol: string;
    company: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await getAuthenticatedUserId();
        await connectToDatabase();

        const normalizedSymbol = symbol.trim().toUpperCase();
        const normalizedCompany = company.trim();

        if (!normalizedSymbol || !normalizedCompany) {
            return { success: false, message: 'Symbol and company are required' };
        }

        const updated = await Watchlist.findOneAndUpdate(
            { userId, symbol: normalizedSymbol },
            { $set: { company: normalizedCompany } },
            { new: true }
        );

        if (!updated) {
            return { success: false, message: 'Watchlist item not found' };
        }

        return { success: true, message: `${normalizedSymbol} updated` };
    } catch (err) {
        console.error('updateWatchlistItem error:', err);
        return { success: false, message: 'Failed to update watchlist item' };
    }
}

export async function removeStockFromWatchlist(symbol: string): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await getAuthenticatedUserId();
        await connectToDatabase();

        const normalizedSymbol = symbol.trim().toUpperCase();
        if (!normalizedSymbol) {
            return { success: false, message: 'Symbol is required' };
        }

        const deleted = await Watchlist.findOneAndDelete({
            userId,
            symbol: normalizedSymbol,
        });

        if (!deleted) {
            return { success: false, message: 'Stock not found in your watchlist' };
        }

        return { success: true, message: `${normalizedSymbol} removed from watchlist` };
    } catch (err) {
        console.error('removeStockFromWatchlist error:', err);
        return { success: false, message: 'Failed to remove stock from watchlist' };
    }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}