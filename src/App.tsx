import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import CreatePost from "./pages/CreatePost";
import ViewForms from "./pages/ViewForms";
import ManagePosts from "./pages/ManagePosts";
import PasswordGate from "./components/PasswordGate";
import logoImg from "./assets/logo.png";
import "./App.css";

export default function App() {
  return (
    <PasswordGate>
    <BrowserRouter basename="/SaikawaLabAdmin">
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <span className="logo">
              <img src={logoImg} alt="Saikawa Lab" className="logo-img" />
              <span className="logo-text">Saikawa Lab Admin</span>
            </span>
            <nav className="nav">
              <NavLink to="/create-post" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Create Post
              </NavLink>
              <NavLink to="/manage-posts" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Manage Posts
              </NavLink>
              <NavLink to="/view-forms" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                View Forms
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/create-post" replace />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/manage-posts" element={<ManagePosts />} />
            <Route path="/view-forms" element={<ViewForms />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </PasswordGate>
  );
}
