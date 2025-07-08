import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Viewer from "./components/Viewer";
import Designer from "./components/Designer";
import React from "react";
import Employees from "./pages/Employees";

import '@progress/kendo-theme-material/dist/all.css';
import './assets/css/style.css';
// import '@progress/kendo-theme-default/dist/all.css';
// import '@progress/kendo-theme-material/dist/all.css';
import '@progress/kendo-theme-bootstrap/scss/all.scss'
import './assets/scss/main.scss';


export default function App() {
  return (
    <Router>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Employees />} />
        <Route path="/employee" element={<Employees />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/designer" element={<Designer />} />
      </Routes>
    </Router>
  );
}
