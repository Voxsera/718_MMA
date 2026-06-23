import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Home from './pages/Home.jsx';
import Courses from './pages/Courses.jsx';
import PersonalTraining from './pages/PersonalTraining.jsx';
import Memberships from './pages/Memberships.jsx';
import Events from './pages/Events.jsx';
import Food from './pages/Food.jsx';
import Collaboration from './pages/Collaboration.jsx';
import Trial from './pages/Trial.jsx';
import About from './pages/About.jsx';
import Merchandise from './pages/Merchandise.jsx';
import Physio from './pages/Physio.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/personal-training" element={<PersonalTraining />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/events" element={<Events />} />
          <Route path="/food" element={<Food />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/trial" element={<Trial />} />
          <Route path="/about" element={<About />} />
          <Route path="/merchandise" element={<Merchandise />} />
          <Route path="/physio" element={<Physio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  );
}
