import { RouterProvider } from 'react-router-dom';
import './App.css';
import { router } from './router';
import { MemeProvider } from './context/MemeContext';

function App() {
  return (
    <div className="App">
      <MemeProvider>
        <RouterProvider router={router} />
      </MemeProvider>
    </div>
  );
}

export default App;
