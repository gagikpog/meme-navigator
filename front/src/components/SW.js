import { useEffect } from 'react';
import runServiceWorker from '../utils/runServiceWorker';
import { useAuth } from '../context/AuthContext';

export function SW() {

    const { user } = useAuth();

    useEffect(() => {
        try {
            if (user?.id) {
                runServiceWorker()
            }
        } catch (error)  {
            console.log(error);
        }
    }, [user?.id]);
    return <></>;
}