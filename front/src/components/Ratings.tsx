import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMemes } from '../context/MemeContext';

interface RatingsProps {
  memeId: number;
}

interface RatingStatsResponse {
  likesCount?: number;
  dislikesCount?: number;
}

const Ratings = ({ memeId }: RatingsProps) => {
  const { authFetch } = useAuth();
  const { refreshMemes } = useMemes();

  const [userRating, setUserRating] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const loadRating = useCallback(async () => {
    if (!memeId) return;
    try {
      const [ratingRes, statsRes] = await Promise.all([
        authFetch(`/api/ratings/meme/${memeId}`),
        authFetch(`/api/ratings/meme/${memeId}/stats`)
      ]);

      if (ratingRes.ok) {
        const ratingData: { rating?: number } = await ratingRes.json();
        setUserRating(ratingData.rating ?? 0);
      }

      if (statsRes.ok) {
        const stats: RatingStatsResponse = await statsRes.json();
        setLikesCount(stats.likesCount ?? 0);
        setDislikesCount(stats.dislikesCount ?? 0);
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  }, [authFetch, memeId]);

  useEffect(() => {
    if (memeId) {
      void loadRating();
    }
  }, [memeId, loadRating]);

  const handleRating = async (rating: number) => {
    if (!memeId || isRatingLoading) return;
    setIsRatingLoading(true);
    try {
      const newRating = userRating === rating ? 0 : rating;
      const res = await authFetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meme_id: memeId, rating: newRating })
      });
      if (res.ok) {
        setUserRating(newRating);
        await loadRating();
        await refreshMemes();
      }
    } catch (error) {
      console.error('Error setting rating:', error);
    } finally {
      setIsRatingLoading(false);
    }
  };

  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => void handleRating(5)}
          disabled={isRatingLoading}
          className={`flex items-center gap-1 px-3 py-2 rounded transition-colors ${
            userRating === 5
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isRatingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Нравится"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{likesCount}</span>
        </button>
        <button
          onClick={() => void handleRating(-5)}
          disabled={isRatingLoading}
          className={`flex items-center gap-1 px-3 py-2 rounded transition-colors ${
            userRating === -5
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isRatingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Не нравится"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 rotate-180">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{dislikesCount}</span>
        </button>
      </div>
    </div>
  );
};

export default Ratings;
