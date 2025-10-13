import useSearch from '../hooks/useSearch';
import usePermFilter from '../hooks/usePermFilter';
import { Link } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_URL } from '../config';
import ImageWithAuth from '../components/ImageWithAuth';
import compareText from '../utils/compareText';
import { useMemo } from 'react';
import formatDate from '../utils/formatDate';

const Home = () => {
  const { memes, loading } = useMemes();
  const [search, setSearch] = useSearch();
  const { canCreate } = useAuth();
  const [permFilter, setPermFilter] = usePermFilter();

  const canCreateFlag = canCreate();

  const filteredImages = useMemo(() => {
    const permissionFiltered = (() => {
      if (!canCreateFlag) return memes;
      if (permFilter === 'all') return memes;
      return memes.filter((m) => m.permissions === permFilter);
    })();
    return permissionFiltered.filter((img) => compareText(img.tags, search));
  }, [memes, permFilter, canCreateFlag, search]);

  // Top 10 popular tags
  const topTags = useMemo(() => {
    const counter = new Map();
    for (const m of memes) {
      const tags = Array.isArray(m.tags) ? m.tags : (typeof m.tags === 'string' ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      for (const t of tags) {
        counter.set(t, (counter.get(t) || 0) + 1);
      }
    }
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t, c]) => ({ tag: t, count: c }));
  }, [memes]);

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div>
      <div className='sticky  z-20 top-0 bg-white/80 backdrop-blur border-b p-3'>
        <div className="mb-2">
          <div className="relative" >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по тегам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 bg-white/90 rounded-full w-full pr-9 pl-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                title="Очистить поиск"
                aria-label="Очистить поиск"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-1 gap-3">
          {topTags.length > 0 && (
            <div className="-mx-3 px-3 overflow-x-auto whitespace-nowrap no-scrollbar">
              {topTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  title={`Добавить тег: ${tag} (повторений: ${count})`}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm mr-2 mb-1"
                  onClick={() => setSearch(tag)}
                >
                  #{tag}
                  <span className="text-gray-400">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {canCreate() && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Статус:</span>
            <div className="inline-flex rounded-full border bg-white p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setPermFilter('all')}
                className={`px-3 py-1 rounded-full ${permFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >Все</button>
              <button
                type="button"
                onClick={() => setPermFilter('public')}
                className={`px-3 py-1 rounded-full ${permFilter === 'public' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >Публичные</button>
              <button
                type="button"
                onClick={() => setPermFilter('private')}
                className={`px-3 py-1 rounded-full ${permFilter === 'private' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >Приватные</button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredImages.map((img) => (
          <Link
            key={img.fileName}
            to={`/meme/${img.fileName}`}
            className="group relative border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300"
            title={img.description}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
              <ImageWithAuth
                src={`${IMAGE_URL}/${img.fileName}`}
                alt={img.fileName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                {img.description ? (
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {img.description}
                  </p>
                ) : (
                  <div className="h-5" />
                )}
                {canCreateFlag && (
                  <>
                    {img.permissions === 'public' && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200" title="Публичный мем">
                        🌐 public
                      </span>
                    )}
                    {img.permissions === 'private' && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-200" title="Только для администраторов">
                        🔒 private
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatDate(img.created_at)}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {Array.isArray(img.tags) && img.tags.length > 0 ? `#${img.tags.slice(0, 3).join(' #')}${img.tags.length > 3 ? ' …' : ''}` : 'Без тегов'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {canCreate() && (
        <Link
          to="/meme/new"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center"
          title="Добавить мем"
          aria-label="Добавить мем"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 sm:w-8 sm:h-8">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      )}
    </div>
  );
};

export default Home;
