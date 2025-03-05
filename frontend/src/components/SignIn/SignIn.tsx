import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../supabaseClient';
import './SignIn.css';

const SignIn: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error || !data.user) {
        setError(error?.message || 'Sign-in failed. Please try again.');
        return;
      }
  
      // Update user metadata with first and last name
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: { 
          firstName, 
          lastName 
        }
      });
  
      if (updateError) {
        console.error('Error updating user metadata', updateError);
      }
  
      // Store names in local storage for App.tsx to use
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);
  
      // Navigate to the main app
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    }
  };
  

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://gpessmjaqgyaxuxpylmd.supabase.co/auth/v1/callback', // Your redirect URL
      },
    });

    if (error) {
      console.error('Error logging in with Google', error);
    }
  };

  return (
    <div className="sign-in-wrapper">
      <div className="sign-in-container">
        {/* Replacing logo div with the custom logo */}
        <div className="veritasso-logo">
          <div className="veritasso-infinity">
            <div className="veritasso-left"></div>
            <div className="veritasso-right"></div>
            <div className="veritasso-bridge"></div>
          </div>
        </div>
        <h2 className="welcome-text">Sign In</h2>
        <p className="subtitle">Welcome back to Opennote!</p>

        <button
          type="button"
          className="google-signin"
          onClick={handleGoogleSignIn}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
          Sign in with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSignIn}>
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

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

          <div className="success-message">
            <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Success!
          </div>

          <button type="submit" className="signin-button">
            Sign In
          </button>

          <div className="signup-link">
            No account?{' '}
            <Link to="/signup">Sign Up</Link>
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

export default SignIn;