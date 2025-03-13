import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/login_signup/Landing";
import Signup from "./pages/login_signup/Signup";
import Details from "./pages/login_signup/Details"; 
import Login from "./pages/login_signup/Login"; 


const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/details" element={<Details />} /> 
        <Route path="/login" element={<Login />} /> 
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
};

export default App;
