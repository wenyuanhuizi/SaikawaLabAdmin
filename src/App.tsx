import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import CreatePost from "./pages/CreatePost";
import ViewForms from "./pages/ViewForms";
import ManagePosts from "./pages/ManagePosts";
import logoImg from "./assets/logo.png";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <span className="logo">
              <img src={logoImg} alt="Saikawa Lab" className="logo-img" />
              <span className="logo-text">Saikawa Lab Admin</span>
            </span>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Create Post
              </NavLink>
              <NavLink to="/posts" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Manage Posts
              </NavLink>
              <NavLink to="/forms" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                View Forms
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<CreatePost />} />
            <Route path="/forms" element={<ViewForms />} />
            <Route path="/posts" element={<ManagePosts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
