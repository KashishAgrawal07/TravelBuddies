
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register  from './pages/register';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Iternary from './pages/Iternary'
import Expenses from './pages/Expenses';

function App() {
 

  return (
    <Router>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<Home />} />
      <Route path="/iternary" element={<Iternary />} />
      <Route path="/expenses" element={<Expenses />} />
      </Routes>
    </Router>
  )
}

export default App
