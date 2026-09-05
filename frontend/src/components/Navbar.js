import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        AI Mock Interview
      </div>

      <div className="nav-links">
        <Link to="/">
          Home
        </Link>

        <Link to="/interview">
          Start Interview
        </Link>

        <Link to="/interview-history">
          Interview History
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;