import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { createUserProfile } from '../../services/users';
import './SignUp.css';
import logo from '../LogIn/talkflow_logo.png';

export default function SignUpForm() {
	const navigate = useNavigate();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [confirmError, setConfirmError] = useState('');
	const [generalError, setGeneralError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// true when both password fields are non-empty and equal
	const passwordsMatch = password && confirmPassword && password === confirmPassword;

	const handleSubmit = async (e) => {
		e.preventDefault();
		// client-side mismatch check
		if (password !== confirmPassword) {
			setConfirmError('Passwords do not match');
			return;
		}
		setIsSubmitting(true);
		try {
			const cred = await auth.createUserWithEmailAndPassword(email, password);
			const uid = cred.user && cred.user.uid;
			await createUserProfile(uid, { firstName, lastName, email });
			// sign the user out so they can log in via the Log In page
			try {
				await auth.signOut();
			} catch (e) {
				console.warn('Sign out after signup failed', e);
			}
			setIsSubmitting(false);
			navigate('/LogIn');
		} catch (err) {
			console.error('Signup failed', err);
			// If email already exists, show inline tooltip on the email field.
			if (err && err.code === 'auth/email-already-in-use') {
				setEmailError('An account with this email already exists.');
			} else {
				setGeneralError(err && err.message ? err.message : 'Sign up failed.');
			}
			setIsSubmitting(false);
		}
	};

	// Check email availability when user leaves the email input
	const checkEmailAvailability = async () => {
		setEmailError('');
		if (!email) return;
		try {
			const methods = await auth.fetchSignInMethodsForEmail(email);
			if (methods && methods.length > 0) {
				setEmailError('An account with this email already exists.');
			} else {
				setEmailError('');
			}
		} catch (e) {
			// Network or service error while checking availability — log only.
			// Do not set a user-facing tooltip here so typing doesn't trigger an error
			// message; we'll surface server-side errors on submit instead.
			console.warn('Email availability check failed', e);
		}
	};

	// Debounced live check: run availability check ~500ms after user stops typing
	useEffect(() => {
		// clear any previous general error while typing
		setGeneralError('');
		// if empty, clear error and do nothing
		if (!email) {
			setEmailError('');
			return;
		}

		const id = setTimeout(() => {
			// call the same check used onBlur
			checkEmailAvailability();
		}, 500);

		return () => clearTimeout(id);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [email]);

	// Validate confirm password as the user types
	const handleConfirmChange = (val) => {
		setConfirmPassword(val);
		if (password && val && password !== val) {
			setConfirmError('Passwords do not match');
		} else {
			setConfirmError('');
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
					<h2 className="card-heading">Sign Up</h2>
					<p className="card-sub">Create an account to start tracking progress.</p>

					<form className="login-form" onSubmit={handleSubmit}>
						<div className="field">
							<label className="visually-hidden" htmlFor="firstName">First Name</label>
							<input
								id="firstName"
								className="input"
								type="text"
								placeholder="First Name"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
							/>
						</div>

						<div className="field">
							<label className="visually-hidden" htmlFor="lastName">Last Name</label>
							<input
								id="lastName"
								className="input"
								type="text"
								placeholder="Last Name"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
							/>
						</div>

						<div className="field">
							<label className="visually-hidden" htmlFor="email">Email</label>
							<input
								id="email"
								className="input"
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => { setEmail(e.target.value); setEmailError(''); setGeneralError(''); }}
								onBlur={checkEmailAvailability}
								required
							/>
							{emailError && <div className="field-tooltip" role="alert">{emailError}</div>}
						</div>

						<div className="field">
							<label className="visually-hidden" htmlFor="password">Password</label>
							<input
								id="password"
								className={`input ${passwordsMatch ? 'input-match' : ''}`}
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => { setPassword(e.target.value); if (confirmPassword && confirmPassword !== e.target.value) setConfirmError('Passwords do not match'); else setConfirmError(''); }}
								required
							/>
						</div>

						<div className="field">
							<label className="visually-hidden" htmlFor="confirmPassword">Confirm Password</label>
							<input
								id="confirmPassword"
								className={`input ${passwordsMatch ? 'input-match' : ''}`}
								type="password"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => handleConfirmChange(e.target.value)}
								required
							/>
							{confirmError && <div className="field-tooltip" role="alert">{confirmError}</div>}
						</div>
						{generalError && <div className="field-tooltip global" role="alert">{generalError}</div>}

						<button className="btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'SIGNING UP' : 'SIGN UP'}</button>
				</form>

				<div className="divider">OR</div>
				<p className="signup">Already have an account? <a href="/" onClick={(e) => { e.preventDefault(); navigate('/LogIn'); }}>Log In</a></p>
			</div>
			</div>
		</div>
	);
}
