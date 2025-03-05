import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient'; // Adjust the import path as needed
import './SignUp.css'; // Add the appropriate CSS file if needed

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Navigate to main app after successful sign up
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://gpessmjaqgyaxuxpylmd.supabase.co/auth/v1/callback', // Use your callback URL here
      },
    });
  
    if (error) {
      console.error('Error logging in with Google', error);
    }
  };
  

  return (
    <div className="sign-in-wrapper">
      <div className="sign-in-container">
      <div className="veritasso-logo">
          <div className="veritasso-infinity">
            <div className="veritasso-left"></div>
            <div className="veritasso-right"></div>
            <div className="veritasso-bridge"></div>
          </div>
        </div>
        <h2 className="welcome-text">Sign Up</h2>
        <p className="subtitle">Create a new account</p>

        <button 
          type="button" 
          className="google-signin"
          onClick={handleGoogleSignUp}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          Sign up with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSignUp}>
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="signin-button">
            Sign Up
          </button>

          <div className="signup-link">
            Already have an account? {' '}
            <Link to="/signin">Sign In</Link>
          </div>
        </form>

        <div className="cloudflare-info">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
