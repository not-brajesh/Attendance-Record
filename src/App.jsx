import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Downloads from "./pages/Downloads";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/downloads" element={<Downloads />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;