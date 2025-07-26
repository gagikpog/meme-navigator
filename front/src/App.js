import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MemeProvider } from './context/MemeContext';
import Header from './components/Header';
import routes from "./router";

function App() {
  return (
    <div className="App">
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
    </div>
  );
}

export default App;
