import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../utils/axiosInstance';

function LoginPage() {

    const [emailOrUserName, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        try{
            const res = await api.post('/auth/login', { emailOrUsername, password });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);

            navigate('/feed');
        }catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    }

    return (
    <div className="page auth-page">
      <h1>DigitalDiary</h1>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label>Username or Email</label>
          <input
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>
        Don&apos;t have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default LoginPage;