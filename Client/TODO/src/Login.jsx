import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    localStorage.setItem('username', fullname);
    navigate('/mytask');
  }

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Full Name" value={fullname} onChange={e => setFullname(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
