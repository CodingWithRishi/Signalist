"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import {
    removeStockFromWatchlist,
    updateWatchlistItem,
} from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";

type WatchlistManagerProps = {
    initialWatchlist: WatchlistItem[];
};

const WatchlistManager = ({ initialWatchlist }: WatchlistManagerProps) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
    const [isPending, startTransition] = useTransition();

    const sortedWatchlist = useMemo(
        () =>
            [...watchlist].sort(
                (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
            ),
        [watchlist]
    );

    const handleDelete = (symbol: string) => {
        startTransition(async () => {
            const result = await removeStockFromWatchlist(symbol);
            if (!result.success) {
                toast.error(result.message);
                return;
            }

            setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
            toast.success(result.message);
        });
    };

    const handleUpdate = (symbol: string, company: string) => {
        startTransition(async () => {
            const result = await updateWatchlistItem({ symbol, company });
            if (!result.success) {
                toast.error(result.message);
                return;
            }

            setWatchlist((prev) =>
                prev.map((item) =>
                    item.symbol === symbol ? { ...item, company: company.trim() } : item
                )
            );
            toast.success(result.message);
        });
    };

    return (
        <section className="watchlist space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="watchlist-title">My Watchlist</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Your watchlist is private and scoped to your account.
                    </p>
                </div>
                <SearchCommand
                    renderAs="button"
                    label="Add stock"
                    initialStocks={[]}
                    onWatchlistChange={({ symbol, company, isAdded }) => {
                        setWatchlist((prev) => {
                            if (isAdded) {
                                const exists = prev.some((item) => item.symbol === symbol);
                                if (exists) return prev;
                                return [
                                    {
                                        symbol,
                                        company,
                                        userId: "current-user",
                                        addedAt: new Date(),
                                    },
                                    ...prev,
                                ];
                            }

                            return prev.filter((item) => item.symbol !== symbol);
                        });
                    }}
                />
            </div>

            {sortedWatchlist.length === 0 ? (
                <div className="watchlist-empty border border-gray-600 rounded-lg p-8 bg-gray-800">
                    <p className="empty-title">No stocks in your watchlist yet</p>
                    <p className="empty-description">
                        Search for a stock and add it to start tracking.
                    </p>
                </div>
            ) : (
                <div className="watchlist-table">
                    <table className="w-full">
                        <thead>
                        <tr className="table-header-row">
                            <th className="text-left px-4 py-3">Company</th>
                            <th className="text-left px-4 py-3">Symbol</th>
                            <th className="text-left px-4 py-3">Added</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedWatchlist.map((item) => (
                            <WatchlistRow
                                key={item.symbol}
                                item={item}
                                disabled={isPending}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

const WatchlistRow = ({
    item,
    onDelete,
    onUpdate,
    disabled,
}: {
    item: WatchlistItem;
    onDelete: (symbol: string) => void;
    onUpdate: (symbol: string, company: string) => void;
    disabled: boolean;
}) => {
    const [company, setCompany] = useState(item.company);

    return (
        <tr className="table-row">
            <td className="px-4 py-3">
                <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="form-input h-10"
                />
            </td>
            <td className="px-4 py-3 font-semibold">{item.symbol}</td>
            <td className="px-4 py-3 text-gray-400">
                {new Date(item.addedAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onUpdate(item.symbol, company)}
                        disabled={disabled}
                        className="add-alert"
                    >
                        Update
                    </button>
                    <button
                        onClick={() => onDelete(item.symbol)}
                        disabled={disabled}
                        className="watchlist-btn watchlist-remove h-9 px-3 w-fit"
                    >
                        Delete
                    </button>
                    <Link href={`/stocks/${item.symbol}`} className="add-alert">
                        View
                    </Link>
                </div>
            </td>
        </tr>
    );
};

export default WatchlistManager;
