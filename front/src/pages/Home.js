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
import IconWeb from '../icons/Web';
import IconPrivate from '../icons/Private';
import IconModeration from '../icons/Moderation';

const Home = () => {
  const { memes, loading } = useMemes();
  const [search, setSearch] = useSearch();
  const { user, canFilter, canCreateMeme } = useAuth();
  const [filterContent, permFilter] = usePermFilter();

  const canFilterFlag = canFilter();

  const filteredImages = useMemo(() => {
    const permissionFiltered = (() => {
      if (!canFilterFlag) return memes;

      switch (permFilter) {
        case 'all':
          return memes;
        case 'public':
        case 'private':
        case 'moderate':
          return memes.filter((m) => m.permissions === permFilter);
        case 'self':
          return memes.filter((meme) => meme.user_id === user.id);
        default:
          return memes;
      }
    })();
    return permissionFiltered.filter((img) => compareText(img.tags, search));
  }, [memes, permFilter, canFilterFlag, search, user]);

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

        {filterContent}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredImages.map((img) => (
          <Link
            key={img.fileName}
            to={`/meme/${img.fileName}`}
            className="group relative border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
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
                {canFilterFlag && (
                  <>
                    {img.permissions === 'public' && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200" title="Публичный мем">
                        <IconWeb size={16}/> Опубликован
                      </span>
                    )}
                    {img.permissions === 'private' && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-200" title="Только для администраторов">
                        <IconPrivate size={16}/> Не опубликован
                      </span>
                    )}
                    {img.permissions === 'moderate' && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-600 border border-red-200" title="Только для администраторов">
                        <IconModeration size={16}/> Модерация
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Автор {img.authorName} {img.authorSurname} {formatDate(img.created_at)}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {Array.isArray(img.tags) && img.tags.length > 0 ? `#${img.tags.slice(0, 3).join(' #')}${img.tags.length > 3 ? ' …' : ''}` : 'Без тегов'}
              </p>
              {/* Иконки с количеством лайков и комментариев */}
              {(img.likesCount > 0 || img.dislikesCount > 0 || img.commentsCount > 0) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  {img.likesCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-green-600"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{img.likesCount}</span>
                    </div>
                  )}
                  {img.dislikesCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                         <svg
                          width="16"
                          height="16"
                          viewBox="0 0 58 46"
                          fill="#804030"
                          >
                            <g transform="translate(-44,-33)">
                              <path d="m 45.721003,79.34202 c -0.789057,-1.747601 0.98767,-5.786855 2.983929,-3.808161 1.369797,1.436615 5.448352,3.15971 4.423651,-0.324119 -2.36819,0.06188 -4.855086,-2.3925 -2.400141,-4.416076 0.877446,-1.091197 2.814204,-2.672639 2.938774,-0.401251 0.461259,1.046615 0.42579,2.594398 1.973405,2.518898 2.450266,0.583053 4.869928,3.100277 3.832602,5.733802 -0.447884,1.667277 -2.241846,1.662665 -3.633295,1.579135 -3.260127,0 -6.520255,0 -9.780382,0 -0.112848,-0.294076 -0.225695,-0.588152 -0.338543,-0.882228 z m 20.735153,-1.361413 c -1.644635,-1.300122 -4.446172,-2.384694 -4.452505,-4.788483 0.320722,-1.764579 0.641445,-3.529158 0.962167,-5.293737 -2.98519,-2.033788 -6.088025,-4.075205 -9.672173,-4.839631 -2.22326,-1.10315 -5.084968,-1.885376 -6.233531,-4.262168 -0.945255,-1.774312 -2.46789,-3.406472 -2.398623,-5.525661 -0.16435,-1.592392 -0.328699,-3.184785 -0.493049,-4.777178 1.126342,-2.284121 4.728093,-3.587283 6.274902,-1.11868 1.713907,2.249006 0.328853,5.721696 2.817427,7.425083 1.199029,1.203015 3.361916,3.021928 3.250882,0.05542 1.600416,-6.101283 5.546565,-12.383418 11.998288,-14.052342 3.448578,-1.061415 7.343441,-0.909379 10.341688,-3.167211 1.279611,-0.346266 3.46334,-3.044793 3.984408,-0.730826 1.118449,2.708956 2.236897,5.417913 3.355346,8.126869 1.501658,1.040391 4.042659,1.525034 5.36834,0.01275 1.667716,-3.046793 3.463567,-6.032845 5.183338,-9.055822 0.841417,2.744414 4.589349,1.972495 5.896429,4.084794 0.39594,2.051393 -1.12823,3.823933 -1.75674,5.697605 -0.3714,0.83283 -0.55548,1.953313 -1.721818,1.565377 -1.984982,0 -3.969964,0 -5.954946,0 -2.563933,4.082514 -5.237927,8.095822 -7.733416,12.221245 -0.946046,4.25145 -2.143138,8.449844 -2.856443,12.750933 1.636226,1.451672 4.521259,1.979164 4.047273,4.965608 -0.04684,1.808962 -2.443245,3.168235 -4.187942,2.946191 -2.044772,-0.09671 -4.089544,-0.193425 -6.134316,-0.290137 0.663421,-2.312158 1.700719,-4.829405 -0.935342,-6.213696 -0.841058,-1.365234 -1.045931,-3.914316 0.507304,-4.986339 0.988466,-0.988465 1.976931,-1.976931 2.965397,-2.965396 0.03492,-2.115663 1.306439,-4.424056 0.334753,-6.408671 -0.855407,-2.142372 -1.898922,-4.236106 -4.282329,-4.953282 -1.393914,-1.402354 -6.250191,-1.493377 -3.87537,1.024045 2.499254,-0.03055 4.163272,1.63401 5.507164,3.542221 1.729479,2.762513 0.02547,7.579495 -3.235704,8.528601 -1.478613,0.612434 -1.599614,2.460231 -2.38413,3.691867 -1.337071,1.649207 1.972403,1.520191 2.635823,2.812867 1.422089,0.552096 1.390315,1.794859 1.294243,3.08026 0.412498,1.580944 -1.309124,2.434482 -2.528125,2.947296 -2.111324,0.487403 -4.143374,-1.092614 -5.88867,-2.049776 z"/>
                              <path d="m 69.097586,37.99907 -3.912173,-6.297997 -3.912173,-6.297997 7.410313,-0.239043 7.410311,-0.239042 -3.498139,6.53704 z" transform="matrix(0.54992929,0.03843532,-0.04432574,0.6342089,52.873368,16.03678)" />
                            </g>
                        </svg>
                      <span>{img.dislikesCount}</span>
                    </div>
                  )}
                  {img.commentsCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{img.commentsCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {canCreateMeme() && (
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
