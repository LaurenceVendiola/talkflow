import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import './LogIn.css';
import logo from './talkflow_logo.png';

export default function LogInForm() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const credentialErrorMessage = 'Invalid username or password.';

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			const cred = await auth.signInWithEmailAndPassword(email, password);
			const signedUser = cred && cred.user ? cred.user : auth.currentUser;
			if (signedUser) {
				navigate('/Home');
				return;
			}

			const unsub = auth.onAuthStateChanged((u) => {
				if (u) {
					unsub();
					navigate('/Home');
				}
			});
		} catch (e) {
			console.error('Login failed', e);
			setError(credentialErrorMessage);
		} finally {
			setIsSubmitting(false);
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
					{error && (
						<div className="form-error" role="alert" aria-live="polite">
							{error}
						</div>
					)}
					<h2 className="card-heading">Log In</h2>
					<p className="card-sub">Let's keep building confident voices together.</p>

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

						<label className="visually-hidden" htmlFor="password">Password</label>
						<input
							id="password"
							className="input"
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
					/>

					<div className="forgot-row">
						<a className="forgot-link" href="/" onClick={(e) => { e.preventDefault(); navigate('/ForgotPassword'); }}>Forgot Password?</a>
					</div>

					<button className="btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'LOGGING IN' : 'LOG IN'}</button>
				</form>

				<div className="divider">OR</div>
				<p className="signup">Don't have an account? <a href="/" onClick={(e) => { e.preventDefault(); navigate('/SignUp'); }}>Sign Up</a></p>
				</div>
			</div>
		</div>
	);
}

