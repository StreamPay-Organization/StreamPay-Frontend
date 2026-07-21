import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RouteLoader from './components/RouteLoader.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateStream from './pages/CreateStream.jsx';
import StreamDetail from './pages/StreamDetail.jsx';
import NotFound from './pages/NotFound.jsx';
import './App.css';

/**
 * Root application component: wires up the provider, layout and routes.
 */
export default function App() {
  return (
    <AppProvider>
      <RouteLoader />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="app-main" tabIndex="-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateStream />} />
            <Route path="/streams/:id" element={<StreamDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </AppProvider>
  );
}
