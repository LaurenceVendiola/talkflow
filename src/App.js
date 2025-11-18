import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LogInForm from './Components/LogIn/LogInForm';
import HomeForm from './Components/Home/HomeForm';
import PatientForm from './Components/Patient/PatientForm';
import SessionForm from './Components/Session/SessionForm';
import SessionOptionsForm from './Components/Session/SessionOptionsForm';
import PatientProfileForm from './Components/Patient/PatientProfileForm';
import SignUpForm from './Components/SignUp/SignUpForm';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './Components/ProtectedRoute';
import ForgotPasswordForm from './Components/ForgotPassword/ForgotPasswordForm';
import RecordingForm from './Components/Session/RecordingForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/LogIn" />} />

          <Route path="/LogIn" element={<LogInForm/>}/>
          <Route path="/SignUp" element={<SignUpForm/>}/>
          <Route path="/ForgotPassword" element={<ForgotPasswordForm/>}/>

          <Route path="/Home" element={<ProtectedRoute><HomeForm/></ProtectedRoute>}/>
          <Route path="/Patient" element={<ProtectedRoute><PatientForm/></ProtectedRoute>}/>
          <Route path="/Session" element={<ProtectedRoute><SessionForm/></ProtectedRoute>}/>
          <Route path="/SessionOptions" element={<ProtectedRoute><SessionOptionsForm/></ProtectedRoute>}/>
          <Route path="/Recording" element={<ProtectedRoute><RecordingForm/></ProtectedRoute>}/>
          <Route path="/PatientProfile" element={<ProtectedRoute><PatientProfileForm/></ProtectedRoute>}/>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
