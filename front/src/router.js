import Home from './pages/Home';
import MemeDetail from './pages/MemeDetail';
import MemeCreate from './pages/MemeCreate';

const router = [
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/meme/new',
        element: <MemeCreate />
    },
    {
        path: '/meme/:fileName',
        element: <MemeDetail />,
    },
];

export default router;