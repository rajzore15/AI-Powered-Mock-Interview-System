import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewCheck from "./pages/InterviewCheck";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewComplete from "./pages/InterviewComplete";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/interview"
          element={<InterviewSetup />}
        />

        <Route
          path="/interview-room"
          element={<InterviewRoom />}
        />

        <Route
          path="/interview-check"
          element={<InterviewCheck />}
        />

        <Route
          path="/interview-complete"
          element={<InterviewComplete />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;