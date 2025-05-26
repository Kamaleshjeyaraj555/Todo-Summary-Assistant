import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div className="home-page">
    <h1>Welcome &nbsp;
        To
         <br />  Todo 
   
    Summary &nbsp;Assistant</h1>
    <Link to="/login"><button>Login</button></Link>
    <Link to="/register"><button>Register</button></Link>
  </div>
);

export default Home;
