// src/components/FeedPage.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosInstance';
import './FeedPage.css';
import Navbar from './Navbar';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await api.get('/posts');
        setPosts(res.data);
      } catch (err) {
        setError('Error fetching posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div className="page">
      <Navbar />

      {/* this wrapper will center the feed */}
      <div className="feed-container">
        <div className="feed-header">
          <div>
            <h2>Community Feed</h2>
            <p>See what others are sharing and join the conversation!</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/create')}
          >
            Create New Post
          </button>
        </div>

        {loading && <p>Loading posts...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="posts-container">
          {posts.length === 0 && !loading && (
            <p className="empty-state">No posts yet. Be the first!</p>
          )}

          {posts.map((post) => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-meta">
                    {post.author?.username || 'Unknown'} -{' '}
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="post-content">
                {post.content.length > 150
                  ? post.content.slice(0, 250) + '...'
                  : post.content}
              </p>

              <div className="post-footer">
                <Link to={`/post/${post._id}`} className="btn btn-secondary">
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FeedPage;
