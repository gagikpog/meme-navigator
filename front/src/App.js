import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MemeProvider } from './context/MemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import routes from "./router";
import { useEffect } from 'react';
import { ensureDeviceId } from './utils/deviceId';

function App() {
  useEffect(() => {
    ensureDeviceId();
  }, []);
  return (
    <div className="App min-h-screen bg-gray-50 text-gray-800">
      <AuthProvider>
        <MemeProvider>
            <Router>
              <Header />
              <Routes>
                {routes.map(({ path, element }, idx) => (
                  <Route key={idx} path={path} element={element} />
                ))}
              </Routes>
            </Router>
        </MemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
