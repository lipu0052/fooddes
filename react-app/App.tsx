import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "./pages/Home";
import RecipeDetail from "./pages/RecipeDetail";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </Router>
  );
}
