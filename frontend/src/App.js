import './App.css';
import { Routes, Route } from 'react-router-dom';

import LoginPage from './components/LoginPage';
import FeedPage from './components/FeedPage';
import RegisterPage from './components/RegisterPage';
import PostPage from './components/PostPage';
import CreatePost from './components/CreatePost';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="*" element={<div>Page not found</div>} /> 
    </Routes>
  );
}

export default App;
