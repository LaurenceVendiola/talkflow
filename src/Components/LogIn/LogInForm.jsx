import React, { useState } from 'react';
import './LogIn.css';
import logo from './talkflow_logo.png';

export default function LogInForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = (e) => {
		e.preventDefault();
		// TODO: hook up real auth
		console.log('Log in with', { email, password });
		alert('Demo submit — check console');
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
							<a className="forgot-link" href="#">Forgot Password?</a>
						</div>

						<button className="btn-primary" type="submit">LOG IN</button>
					</form>

					<div className="divider">OR</div>
					<p className="signup">Don't have an account? <a href="#">Sign Up</a></p>
				</div>
			</div>
		</div>
	);
}

