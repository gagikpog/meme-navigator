import useSearch from '../hooks/useSearch';
import { Link } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { useAuth } from '../context/AuthContext';
import { IMAGE_URL } from '../config';
import ImageWithAuth from '../components/ImageWithAuth';
import compareText from '../utils/compareText';

const fakeItem = Array.from({length: 10});

const Home = () => {
  const { memes, loading } = useMemes();
  const [search, setSearch] = useSearch();
  const { canCreate } = useAuth();

  const filteredImages = memes.filter((img) => compareText(img.tags, search));

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
        
        {canCreate() && (
          <Link to="/meme/new" className="mb-4 inline-block text-blue-600 hover:underline">
            + Добавить мем
          </Link>
        )}

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
              {img.permissions === 'admin' && (
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
