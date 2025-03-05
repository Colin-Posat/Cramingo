import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Landing />} /> 
        <Route path="/landing" element={<Landing />} /> {/* ✅ Explicitly add Landing route */}
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" />} /> {/* ✅ Redirect unknown routes */}
      </Routes>
  );
};

export default App;
