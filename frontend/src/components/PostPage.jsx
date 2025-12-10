import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosInstance';
import Navbar from './Navbar';
import './PostPage.css';

function PostPage() {
  const { id } = useParams(); // post id from URL
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState('');

  // ---- Post editing state ----
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingPost, setSavingPost] = useState(false);

  // ---- Replies state (now backed by backend) ----
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

  // editing a single reply
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState('');

  // ====== Fetch post and replies ======
  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        setError('Error fetching post');
      } finally {
        setLoadingPost(false);
      }
    }

    async function fetchReplies() {
      try {
        const res = await api.get(`/posts/${id}/replies`);
        setReplies(res.data);
      } catch (err) {
        console.error(err);
        setReplyError('Error fetching replies');
      } finally {
        setLoadingReplies(false);
      }
    }

    fetchPost();
    fetchReplies();
  }, [id]);

  // ====== Local post edit handlers ======
  function startEditPost() {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditingPost(true);
  }

  async function handleSavePost() {
    if (!editTitle.trim() || !editContent.trim()) return;

    try {
      setSavingPost(true);
      const res = await api.put(`/posts/${id}`, {
        title: editTitle,
        content: editContent,
      });
      setPost(res.data);
      setIsEditingPost(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating post');
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost() {
    const ok = window.confirm('Are you sure you want to delete this post?');
    if (!ok) return;

    try {
      await api.delete(`/posts/${id}`);
      navigate('/feed');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting post');
    }
  }

  // ====== Reply CRUD handlers ======

  // Create reply
  async function handleAddReply() {
    if (!replyText.trim()) return;
    setReplyError('');

    try {
      const res = await api.post(`/posts/${id}/replies`, {
        content: replyText,
      });
      
      const newReply = res.data; // {_id, postId, content, createdAt,...}
      setReplies((prev) => [newReply, ...prev]);
      setReplyText('');
    } catch (err) {
      console.error(err);
      setReplyError(err.response?.data?.message || 'Error creating reply');
    }
  }

  // Start editing a reply
  function startEditReply(reply) {
    setEditingReplyId(reply._id);
    setEditingReplyText(reply.content);
  }

  // Save edited reply
  async function handleSaveReply(replyId) {
    if (!editingReplyText.trim()) return;

    try {
      const res = await api.put(`/posts/${id}/replies/${replyId}`, {
        content: editingReplyText,
      });
      const updated = res.data;

      setReplies((prev) =>
        prev.map((r) => (r._id === replyId ? updated : r))
      );
      setEditingReplyId(null);
      setEditingReplyText('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating reply');
    }
  }

  // Delete reply
  async function handleDeleteReply(replyId) {
    const ok = window.confirm('Delete this reply?');
    if (!ok) return;

    try {
      await api.delete(`/posts/${id}/replies/${replyId}`);
      setReplies((prev) => prev.filter((r) => r._id !== replyId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error deleting reply');
    }
  }

  // ====== Render states ======

  if (loadingPost) {
    return (
      <div className="page">
        <Navbar />
        <div className="content">
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page">
        <Navbar />
        <div className="content">
          <p style={{ color: 'red' }}>{error || 'Post not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className="post-page">
        <Link to="/feed" className="back-link">
          ← Back to Feed
        </Link>

        {/* ===== Post detail & edit ===== */}
        <div className="post-detail">
          <div className="post-detail-header">
            <div>
              {isEditingPost ? (
                <input
                  className="edit-title-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              ) : (
                <h1 id="post-detail-title">{post.title}</h1>
              )}

              <p id="post-detail-meta" className="post-meta">
                {post.author?.username || 'Unknown'} -{' '}
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="post-actions">
              {isEditingPost ? (
                <>
                  <button
                    className="icon-btn edit-btn"
                    onClick={handleSavePost}
                    disabled={savingPost}
                  >
                    {savingPost ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => setIsEditingPost(false)}
                    disabled={savingPost}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="icon-btn edit-btn" onClick={startEditPost}>
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={handleDeletePost}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditingPost ? (
            <textarea
              className="edit-content-textarea"
              rows={10}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : (
            <p id="post-detail-content" className="post-detail-content">
              {post.content}
            </p>
          )}
        </div>

        {/* ===== Replies section ===== */}
        <div className="replies-section">
          <h3>
            Replies (
            <span id="reply-count">{replies.length}</span>
            )
          </h3>

          <div className="reply-form">
            <textarea
              id="reply-input"
              placeholder="Write a reply..."
              rows="3"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleAddReply}>
              Post Reply
            </button>
            {replyError && (
              <p style={{ color: 'red', marginTop: '0.5rem' }}>{replyError}</p>
            )}
          </div>

          {loadingReplies ? (
            <p>Loading replies...</p>
          ) : (
            <div id="replies-container" className="replies-container">
              {replies.length === 0 && <p>No replies yet.</p>}
              {replies.map((reply) => (
                <div key={reply._id} className="reply-card">
                  <div className="reply-header">
                    <p className="reply-meta">
                     {reply.author?.username || 'Unknown'} - 
                      {new Date(reply.createdAt).toLocaleString()}
                    </p> 
                    <div className="reply-actions">
                      {editingReplyId === reply._id ? (
                        <>
                          <button
                            className="icon-btn-small edit-btn"
                            onClick={() => handleSaveReply(reply._id)}
                          >
                            Save
                          </button>
                          <button
                            className="icon-btn-small delete-btn"
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditingReplyText('');
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="icon-btn-small edit-btn"
                            onClick={() => startEditReply(reply)}
                          >
                            Edit
                          </button>
                          <button
                            className="icon-btn-small delete-btn"
                            onClick={() =>
                              handleDeleteReply(reply._id)
                            }
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingReplyId === reply._id ? (
                    <textarea
                      className="edit-content-textarea"
                      rows={3}
                      value={editingReplyText}
                      onChange={(e) =>
                        setEditingReplyText(e.target.value)
                      }
                    />
                  ) : (
                    <p className="reply-content">{reply.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostPage;
