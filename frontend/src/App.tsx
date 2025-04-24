import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Import your auth hook
import Landing from "./pages/login_signup/Landing";
import Signup from "./pages/login_signup/Signup";
import Login from "./pages/login_signup/Login";
import CreatedSets from "./pages/dashboard/CreatedSets";
import ProfilePage from "./pages/dashboard/Profile";
import SearchSetsPage from "./pages/dashboard/SearchSets";
import SavedSets from "./pages/dashboard/SavedSets";
import SetCreator from "./pages/set_creation/SetCreator";
import AIGeneratePage from "./pages/set_creation/AIGenerateCards";
import SetViewingPage from "./pages/set_using/SetViewing";
import FlashcardViewMode from "./pages/set_using/FlashcardViewMode";
import QuizViewMode from "./pages/set_using/QuizViewMode";
import EditProfile from "./pages/dashboard/EditProfile";
import SearchResultsPage from "./pages/dashboard/SearchResultsPage";
import ForgotPassword from "./pages/login_signup/ForgotPassword";
import React, { ReactNode } from 'react';

// Interface for route component props
interface RouteProps {
  children: ReactNode;
}

// Public route component that redirects to CreatedSets if already logged in
const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show nothing while checking authentication status
  if (loading) {
    return null; // Or a loading spinner
  }
  
  // Redirect to created-sets if authenticated
  if (isAuthenticated) {
    return <Navigate to="/created-sets" />;
  }
  
  // Otherwise, render the children (public route)
  return <>{children}</>;
};

// Protected route component that redirects to login if not authenticated
const PrivateRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show nothing while checking authentication status
  if (loading) {
    return null; // Or a loading spinner
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Otherwise, render the children (protected route)
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes - redirect to created-sets if already logged in */}
      <Route path="/" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      
      {/* Protected routes - redirect to login if not authenticated */}
      <Route path="/created-sets" element={
        <PrivateRoute>
          <CreatedSets />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      } />
      <Route path="/search-sets" element={
        <PrivateRoute>
          <SearchSetsPage />
        </PrivateRoute>
      } />
      <Route path="/saved-sets" element={
        <PrivateRoute>
          <SavedSets />
        </PrivateRoute>
      } />
      <Route path="/edit-profile" element={
        <PrivateRoute>
          <EditProfile />
        </PrivateRoute>
      } />
      <Route path="/set-creator" element={
        <PrivateRoute>
          <SetCreator />
        </PrivateRoute>
      } />
      <Route path="/ai-generate" element={
        <PrivateRoute>
          <AIGeneratePage />
        </PrivateRoute>
      } />
      <Route path="/study/:setId" element={
        <PrivateRoute>
          <SetViewingPage />
        </PrivateRoute>
      } />
      <Route path="/study/:setId/flashcards" element={
        <PrivateRoute>
          <FlashcardViewMode />
        </PrivateRoute>
      } />
      <Route path="/study/:setId/quiz" element={
        <PrivateRoute>
          <QuizViewMode />
        </PrivateRoute>
      } />
      <Route path="/quiz/:setId/text" element={
        <PrivateRoute>
          <QuizViewMode quizType="text-input" />
        </PrivateRoute>
      } />
      <Route path="/quiz/:setId/multiple-choice" element={
        <PrivateRoute>
          <QuizViewMode quizType="multiple-choice" />
        </PrivateRoute>
      } />
      <Route path="/search-results" element={
        <PrivateRoute>
          <SearchResultsPage />
        </PrivateRoute>
      } />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;