import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AssistantApp from './components/AssistantApp/AssistantApp';
import LearningPage from './components/Incremental/LearningPage';
import './styles.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/assistant" element={<AssistantApp />} />
        <Route path="/learning" element={<LearningPage />} />
      </Routes>
    </Router>
  );
};

export default App;