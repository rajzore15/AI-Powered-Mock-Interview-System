import React from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar" aria-label="Primary navigation">
      <NavLink className="logo" to="/" end>AI Mock Interview</NavLink>

      <div className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/interview">Start Interview</NavLink>
        <NavLink to="/interview-history">Interview History</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;