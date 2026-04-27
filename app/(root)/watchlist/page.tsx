import { getCurrentUserWatchlist } from "@/lib/actions/watchlist.actions";
import WatchlistManager from "@/components/WatchlistManager";

const WatchlistPage = async () => {
    const watchlist = await getCurrentUserWatchlist();

    return (
        <div className="watchlist-container">
            <WatchlistManager initialWatchlist={watchlist} />
        </div>
    );
};

export default WatchlistPage;
