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
import SetViewingPage from "./pages/set_using/SetViewing";
import FlashcardViewMode from "./pages/set_using/FlashcardViewMode";
import QuizViewMode from "./pages/set_using/QuizViewMode";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/details" element={<Details />} />
      <Route path="/login" element={<Login />} />
      <Route path="/created-sets" element={<CreatedSets />} />
      <Route path="/profile" element={<ProfilePage/>} />
      <Route path="/search-sets" element={<SearchSetsPage/>} />
      <Route path="/saved-sets" element={<SavedSets/>} />
      <Route path="/set-creator" element={<SetCreator/>} />
      <Route path="/study/:setId" element={<SetViewingPage/>} />
      <Route path="/study/:setId/flashcards" element={<FlashcardViewMode/>} />
      <Route path="/study/:setId/quiz" element={<QuizViewMode/>} />
      <Route path="/quiz/:setId/text" element={<QuizViewMode quizType="text-input" />} />
      <Route path="/quiz/:setId/multiple-choice" element={<QuizViewMode quizType="multiple-choice" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;