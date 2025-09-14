import Home from './pages/Home';
import MemeDetail from './pages/MemeDetail';
import MemeCreate from './pages/MemeCreate';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const router = [
    {
        path: '/',
        element: <ProtectedRoute><Home /></ProtectedRoute>,
    },
    {
        path: '/meme/new',
        element: <ProtectedRoute requireEdit={true}><MemeCreate /></ProtectedRoute>
    },
    {
        path: '/meme/:fileName',
        element: <ProtectedRoute><MemeDetail /></ProtectedRoute>,
    },
    {
        path: '/login',
        element: <Login />
    },
];

export default router;