import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const DEFAULT_OPERATORS = [
  {
    name: 'Praveen Kumar',
    email: 'praveen@aquasense.org',
    password: 'Passphrase@123',
    role: 'Sonar Payload Specialist',
    callsign: 'AUV-PRA-01'
  },
  {
    name: 'AUV Mission Commander',
    email: 'admin@aquasense.navy',
    password: 'Passphrase@123',
    role: 'Hydroacoustic Mission Commander',
    callsign: 'AUV-ADM-01'
  }
];

function getStoredOperators() {
  try {
    const raw = localStorage.getItem('AQUASENSE_OPERATORS');
    if (!raw) {
      localStorage.setItem('AQUASENSE_OPERATORS', JSON.stringify(DEFAULT_OPERATORS));
      return DEFAULT_OPERATORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OPERATORS;
  } catch (e) {
    return DEFAULT_OPERATORS;
  }
}

function saveOperator(operator) {
  try {
    const list = getStoredOperators();
    const existingIndex = list.findIndex(o => o.email.toLowerCase() === operator.email.toLowerCase());
    if (existingIndex >= 0) {
      list[existingIndex] = operator;
    } else {
      list.push(operator);
    }
    localStorage.setItem('AQUASENSE_OPERATORS', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save operator locally', e);
  }
}

const DISPOSABLE_OR_FAKE_DOMAINS = [
  'test.com', 'fake.com', 'dummy.com', 'example.com', 'sample.com', 'xyz.com', 'abc.com', 'asdf.com',
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'throwawaymail.com', 'guerrillamail.com',
  'yopmail.com', 'sharklasers.com', 'dispostable.com', 'trashmail.com'
];

const DUMMY_USERNAMES = [
  'test', 'fake', 'dummy', 'asdf', 'sample', 'example', 'demo', '12345', 'temp', 'null', 'undefined'
];

async function verifyEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address format! Please enter a valid email (e.g. name@domain.com).' };
  }

  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email address format!' };
  }

  const [user, domain] = parts;

  if (user.length < 3) {
    return { valid: false, error: 'Invalid email! The username before "@" must be at least 3 characters.' };
  }

  if (DUMMY_USERNAMES.includes(user)) {
    return { valid: false, error: `Invalid email! Generic dummy username "${user}@" is not allowed. Please use your real email address.` };
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.includes(domain)) {
    return { valid: false, error: `Invalid email! Dummy or disposable domain "@${domain}" is not allowed.` };
  }

  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return { valid: false, error: 'Invalid email! Top-level domain is invalid.' };
  }

  const trustedDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'zoho.com', 
    'proton.me', 'protonmail.com', 'aquasense.org', 'aquasense.navy'
  ];

  if (!trustedDomains.includes(domain)) {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      if (res.ok) {
        const data = await res.json();
        if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
          return { valid: false, error: `Invalid email! Domain "@${domain}" does not exist or has no active mail server.` };
        }
      }
    } catch (e) {
      // Allow through if network DNS query fails
    }
  }

  return { valid: true };
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [operatorName, setOperatorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [role, setRole] = useState('Sonar Payload Specialist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    getStoredOperators();
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setDbStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDbStatus(null);

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    if (!cleanedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanedPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const emailCheck = await verifyEmail(cleanedEmail);
      if (!emailCheck.valid) {
        setError(emailCheck.error);
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        const operators = getStoredOperators();
        const matched = operators.find(o => o.email.toLowerCase() === cleanedEmail);

        if (!matched) {
          setError(`Invalid email! "${email}" is not registered. Please enter a valid registered email or click "Create an account".`);
          setLoading(false);
          return;
        }

        if (matched.password !== cleanedPassword) {
          setError('Invalid credentials! The password entered is incorrect.');
          setLoading(false);
          return;
        }

        const userData = {
          name: matched.name,
          email: matched.email,
          role: matched.role || role,
          callsign: matched.callsign || `AUV-${matched.name.slice(0, 3).toUpperCase()}-01`,
          loginTime: new Date().toISOString()
        };

        setDbStatus('Syncing credentials with cloud database...');

        try {
          await supabase.from('operator_logins').insert([
            {
              operator_name: userData.name,
              email: userData.email,
              role: userData.role,
              login_time: userData.loginTime
            }
          ]);
        } catch (dbErr) {
          // non-blocking
        }

        setDbStatus(`✓ Welcome back, ${userData.name}!`);
        setTimeout(() => {
          onLogin(userData);
        }, 350);

      } else {
        // Register Mode
        if (!operatorName.trim() || operatorName.trim().length < 2) {
          setError('Please enter your full name (at least 2 characters).');
          setLoading(false);
          return;
        }

        if (cleanedPassword.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const operators = getStoredOperators();
        const alreadyExists = operators.some(o => o.email.toLowerCase() === cleanedEmail);

        if (alreadyExists) {
          setError(`This email (${cleanedEmail}) is already registered! Please sign in.`);
          setLoading(false);
          return;
        }

        const newOperator = {
          name: operatorName.trim(),
          email: cleanedEmail,
          password: cleanedPassword,
          role: role,
          callsign: `AUV-${operatorName.trim().slice(0, 3).toUpperCase()}-01`,
          registeredAt: new Date().toISOString()
        };

        saveOperator(newOperator);

        const userData = {
          name: newOperator.name,
          email: newOperator.email,
          role: newOperator.role,
          callsign: newOperator.callsign,
          loginTime: new Date().toISOString()
        };

        setDbStatus('Registering operator in Supabase cloud...');

        try {
          await supabase.from('operator_logins').insert([
            {
              operator_name: userData.name,
              email: userData.email,
              role: userData.role,
              login_time: userData.loginTime
            }
          ]);
        } catch (dbErr) {
          // non-blocking
        }

        setDbStatus(`✓ Account created! Welcome, ${userData.name}`);
        setTimeout(() => {
          onLogin(userData);
        }, 350);
      }
    } catch (err) {
      console.warn('Auth handler error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="verso-auth-viewport" id="main-content" role="main">
      <div className={`verso-auth-card mode-${mode}`}>
        
        {/* Form Panel (Slides left/right smoothly) */}
        <div className="verso-panel-form">
          <h1 className="verso-title">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <div className="verso-title-bar"></div>

          {error && (
            <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '9px 12px', borderRadius: 8, fontSize: 12, marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={15} color="#991b1b" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          {dbStatus && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '9px 12px', borderRadius: 8, fontSize: 12, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} color="#059669" />
              <span>{dbStatus}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name (in Register mode) */}
            {mode === 'register' && (
              <div className="verso-input-group">
                <label className="verso-input-label" htmlFor="register-fullname">Full name</label>
                <input
                  id="register-fullname"
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                  className="verso-input"
                  placeholder="e.g. Praveen Kumar"
                />
                <span className="verso-input-icon" aria-hidden="true">
                  <User size={18} />
                </span>
              </div>
            )}

            {/* Email Address */}
            <div className="verso-input-group">
              <label className="verso-input-label" htmlFor="auth-email">
                {mode === 'login' ? 'Username or email' : 'Email address'}
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="verso-input"
                placeholder={mode === 'login' ? 'Enter your email' : 'yourname@aquasense.org'}
              />
              <span className="verso-input-icon" aria-hidden="true">
                {mode === 'login' ? <User size={18} /> : <Mail size={18} />}
              </span>
            </div>

            {/* Password */}
            <div className="verso-input-group" style={{ marginBottom: mode === 'register' ? 12 : 20 }}>
              <label className="verso-input-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="verso-input"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="verso-input-icon"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Register Password Hint & Role */}
            {mode === 'register' && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 2, background: password.length >= 6 ? '#064E3B' : '#dcd4c7', borderRadius: 2 }}></div>
                  <div style={{ flex: 1, height: 2, background: password.length >= 8 ? '#064E3B' : '#dcd4c7', borderRadius: 2 }}></div>
                  <div style={{ flex: 1, height: 2, background: password.length >= 10 ? '#064E3B' : '#dcd4c7', borderRadius: 2 }}></div>
                  <span style={{ fontSize: 11, color: '#4a433c', marginLeft: 4, whiteSpace: 'nowrap' }}>Use 6 characters or more.</span>
                </div>

                <div className="verso-input-group" style={{ marginBottom: 0 }}>
                  <label className="verso-input-label" htmlFor="register-role">Mission role</label>
                  <select
                    id="register-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="verso-input"
                    style={{ cursor: 'pointer', appearance: 'auto', background: 'transparent' }}
                  >
                    <option value="Sonar Payload Specialist">Sonar Payload Specialist</option>
                    <option value="AUV Systems Engineer">AUV Systems Engineer</option>
                    <option value="Hydroacoustic Mission Commander">Hydroacoustic Mission Commander</option>
                    <option value="Research & Tank Trials Operator">Research &amp; Tank Trials Operator</option>
                  </select>
                </div>
              </div>
            )}

            {/* Keep Signed In & Forgot Password (in Login mode) */}
            {mode === 'login' && (
              <div className="verso-checkbox-row">
                <label className="verso-checkbox-label" htmlFor="keep-signed-in" onClick={() => setKeepSignedIn(!keepSignedIn)}>
                  <input
                    type="checkbox"
                    id="keep-signed-in"
                    checked={keepSignedIn}
                    onChange={() => {}}
                    aria-label="Keep me signed in"
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />
                  <div className="verso-checkbox-custom" style={{ background: keepSignedIn ? '#064E3B' : '#dcd4c7' }} aria-hidden="true">
                    {keepSignedIn && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={() => setError('Password reset instructions sent to registered system administrator.')}
                  className="verso-link"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="verso-btn-pill"
            >
              <span>
                {loading
                  ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'login' ? 'Sign in' : 'Create account')}
              </span>
            </button>
          </form>

          {/* Switch Mode Footer Link */}
          <div className="verso-switch-footer">
            {mode === 'login' ? (
              <span>
                New to AQUASENSE? 
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="verso-switch-link"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account? 
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="verso-switch-link"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Brand Emerald Ink Panel (Slides left/right smoothly with organic slant) */}
        <div className="verso-panel-brand">
          <div className="verso-brand-tag">A Q U A S E N S E</div>

          {mode === 'login' ? (
            <div>
              <h2 className="verso-hero-heading">
                Welcome<br />
                <span className="verso-hero-italic">back.</span>
              </h2>
              <p className="verso-hero-desc">
                Your telemetry data, acoustic links and mission parameters are exactly where you left them.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="verso-hero-heading">
                Start the<br />
                <span className="verso-hero-italic">first ping.</span>
              </h2>
              <p className="verso-hero-desc">
                One account for every sonar trial, telemetry deck and adaptive mission you command.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
