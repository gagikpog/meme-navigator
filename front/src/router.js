import Home from './pages/Home';
import MemeDetail from './pages/MemeDetail';
import MemeCreate from './pages/MemeCreate';
import Timeline from './pages/Timeline';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';

const router = [
    {
        path: '/',
        element: <ProtectedRoute><Home /></ProtectedRoute>,
    },
    {
        path: '/admin/users',
        element: <ProtectedRoute requireAdmin={true}><Users /></ProtectedRoute>
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
        path: '/timeline',
        element: <ProtectedRoute><Timeline /></ProtectedRoute>,
    },
    {
        path: '/login',
        element: <Login />
    },
];

export default router;