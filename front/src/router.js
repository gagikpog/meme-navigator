
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import MemeDetail from './pages/MemeDetail';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/meme/:fileName',
        element: <MemeDetail />,
    },
]);
