import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Landing />} /> 
        <Route path="/landing" element={<Landing />} /> 
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
};

export default App;
