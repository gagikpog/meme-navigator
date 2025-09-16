import useSearch from '../hooks/useSearch';
import { Link } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_URL } from '../config';
import ImageWithAuth from '../components/ImageWithAuth';
import compareText from '../utils/compareText';
import { useMemo } from 'react';

const fakeItem = Array.from({length: 10});

const Home = () => {
  const { memes, loading } = useMemes();
  const [search, setSearch] = useSearch();
  const { canCreate } = useAuth();

  const filteredImages = memes.filter((img) => compareText(img.tags, search));

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
      <div className='sticky top-0 bg-white p-4'>
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Поиск по тегам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          {canCreate() && (
            <Link to="/meme/new" className="inline-block text-blue-600 hover:underline whitespace-nowrap">
              + Добавить мем
            </Link>
          )}
          {topTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {topTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  title={`Добавить тег: ${tag} (повторений: ${count})`}
                  className="text-xs px-2 py-1 rounded-full border hover:bg-gray-100"
                  onClick={() => setSearch(tag)}
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TODO: Сюда добавить облоко тегов https://www.npmjs.com/package/react-wordcloud */}
      </div>

      <div className="flex flex-wrap gap-4 justify-start p-4">
        {filteredImages.map((img) => (
          <Link
            key={img.fileName}
            to={`/meme/${img.fileName}`}
            className="border p-2 rounded shadow-sm flex-grow"
            style={{ flexBasis: '400px', maxWidth: '100%' }}
            title={img.description}
          >
            <div className="w-full h-[300px] overflow-hidden rounded">
              <ImageWithAuth
                src={`${IMAGE_URL}/${img.fileName}`}
                alt={img.fileName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {img.permissions === 'public' && (
                <span className="text-green-600 text-xs" title="Публичный мем">
                  🌐
                </span>
              )}
              {img.permissions === 'private' && (
                <span className="text-red-600 text-xs" title="Только для администраторов">
                  🔒
                </span>
              )}
              <p className="text-sm text-gray-500">
                Теги: {img.tags?.join(", ") || "Без тегов"}
              </p>
            </div>
          </Link>
        ))}
        {fakeItem.map(() => (
            <div
              className=" flex-grow"
              style={{ flexBasis: '400px', maxWidth: '100%' }}
            ></div>
          )
        )}
      </div>
    </div>
  );
};

export default Home;
