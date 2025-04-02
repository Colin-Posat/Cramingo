import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/login_signup/Landing";
import Signup from "./pages/login_signup/Signup";
import Details from "./pages/login_signup/Details"; 
import Login from "./pages/login_signup/Login"; 
import CreatedSets from "./pages/dashboard/CreatedSets";
import ProfilePage from "./pages/dashboard/Profile";
import SearchSetsPage from "./pages/dashboard/SearchSets";
import SavedSets from "./pages/dashboard/SavedSets";
import SetCreator from "./pages/set_creation/SetCreator";


const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/details" element={<Details />} /> 
        <Route path="/login" element={<Login />} /> 
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/created-sets" element={<CreatedSets />} /> 
        <Route path="/profile" element={<ProfilePage/>} /> 
        <Route path="/search-sets" element={<SearchSetsPage/>} /> 
        <Route path="/saved-sets" element={<SavedSets/>} /> 
        <Route path="/set-creator" element={<SetCreator/>} /> 
      </Routes>
  );
};

export default App;
