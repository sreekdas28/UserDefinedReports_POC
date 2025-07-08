import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="p-4 bg-gray-800 text-white flex gap-4">
      <Link to="/" className="hover:underline">
        Viewer
      </Link>
      <Link to="/designer" className="hover:underline">
        Designer
      </Link>
    </nav>
  );
}
