import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import './ForgotPassword.css';
import logo from '../LogIn/talkflow_logo.png';

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // send password reset email
      // include a continue URL so the link redirects back to our app's reset page
      const actionCodeSettings = {
        // Redirect back to the app's Log In page after the hosted reset completes.
        // Make sure this domain is in your Firebase Authorized domains.
        url: window.location.origin + '/LogIn',
      };
      await auth.sendPasswordResetEmail(email, actionCodeSettings);
      alert('Password reset email sent. Check your inbox.');
      navigate('/LogIn');
    } catch (err) {
      console.error('Reset failed', err);
      alert('Failed to send reset email: ' + (err.message || err));
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="logo-row">
          <img src={logo} alt="talkflow" className="login-left-logo" />
          <div className="logo-text">talkflow</div>
        </div>

        <h1 className="login-title">Helping You Build
          <br />Confident Voices</h1>
        <p className="login-sub">
          Discover speech patterns, celebrate progress, and
          empower every voice to grow with confidence.
        </p>
        <p className="login-note">Detect speech dysfluencies and track progress using AI.</p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2 className="card-heading">Forgot Password</h2>
          <p className="card-sub">Enter your account email and we'll send a password reset link.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="btn-primary" type="submit">SEND RESET EMAIL</button>
          </form>

          <div className="divider">OR</div>
          <p className="signup">Remembered your password? <a href="/" onClick={(e) => { e.preventDefault(); navigate('/LogIn'); }}>Log In</a></p>
        </div>
      </div>
    </div>
  );
}
