import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosInstance';
import Navbar from './Navbar';
import './CreatePost.css';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/posts', { title, content });
      // If backend returns created post
      const created = res.data;
      if (created && created._id) {
        navigate(`/post/${created._id}`);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post');
    }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="create-page">
        <div className="create-post-card">
          <h2>Create New Post</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <form id="create-post-form" className="create-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                type="text"
                placeholder="Enter post title..."
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="post-content">Content</label>
              <textarea
                id="post-content"
                placeholder="Share your thoughts..."
                rows="10"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Publish Post
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/feed')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
