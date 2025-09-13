import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MemeProvider } from './context/MemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import routes from "./router";

function App() {
  return (
    <div className="App">
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
