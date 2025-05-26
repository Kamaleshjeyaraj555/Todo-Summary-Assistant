import './App.css';
import TodoList from './TodoList'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import MyTask from './MyTask';
import Navbar from './Navbar';

function App() {
  

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mytask" element={<MyTask />} />
      </Routes>
    </Router>
  )
}

export default App
