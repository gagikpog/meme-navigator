
import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import Meme from './pages/Meme';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/meme/:name',
        element: <Meme />,
    },
]);
