import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LogInForm from './Components/LogIn/LogInForm';
import HomeForm from './Components/Home/HomeForm';
import PatientForm from './Components/Patient/PatientForm';
import SessionForm from './Components/Session/SessionForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/LogIn" />} />

        <Route path="/LogIn" element={<LogInForm/>}/>
        <Route path="/Home" element={<HomeForm/>}/>
        <Route path="/Patient" element={<PatientForm/>}/>
        <Route path="/Session" element={<SessionForm/>}/>
      </Routes>
    </Router>
  );
}

export default App;
