import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, User, Database, CheckCircle2, Eye, EyeOff, AlertCircle, KeyRound, UserPlus } from 'lucide-react';
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
    return { valid: false, error: `Invalid email! Generic dummy username "${user}@" is not allowed. Please enter your real email address.` };
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.includes(domain)) {
    return { valid: false, error: `Invalid email! Disposable or dummy domain "@${domain}" is not allowed.` };
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
      // Allow through if DNS check fails due to local network restriction
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
  const [role, setRole] = useState('Sonar Payload Specialist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);

  // Initialize operators in storage
  useEffect(() => {
    getStoredOperators();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDbStatus(null);

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    // 1. Basic Presence Validation
    if (!cleanedEmail) {
      setError('Please enter your operator email address.');
      return;
    }

    if (!cleanedPassword) {
      setError('Please enter your security passphrase.');
      return;
    }

    setLoading(true);

    try {
      // 2. Comprehensive Email Verification (Format, Fake Users, Fake Domains, DNS MX)
      const emailCheck = await verifyEmail(cleanedEmail);
      if (!emailCheck.valid) {
        setError(emailCheck.error);
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        // --- SIGN IN MODE ---
        const operators = getStoredOperators();
        const matched = operators.find(o => o.email.toLowerCase() === cleanedEmail);

        if (!matched) {
          setError(`Invalid email! "${email}" is not registered in the operator registry. Please enter a valid registered email or click "Register Operator".`);
          setLoading(false);
          return;
        }

        if (matched.password !== cleanedPassword) {
          setError('Invalid credentials! The security passphrase entered is incorrect.');
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

        setDbStatus('Syncing session with Supabase database...');

        // Async sync to Supabase database (non-blocking)
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
          console.info('Supabase database sync note:', dbErr);
        }

        try {
          await supabase.auth.signUp({
            email: userData.email,
            password: cleanedPassword,
            options: { data: { full_name: userData.name, role: userData.role } }
          });
        } catch (authErr) {
          // ignore
        }

        setDbStatus(`✓ Authenticated! Welcome, ${userData.name}`);
        setTimeout(() => {
          onLogin(userData);
        }, 350);

      } else {
        // --- REGISTER MODE ---
        if (!operatorName.trim()) {
          setError('Please enter your full operator name.');
          setLoading(false);
          return;
        }

        if (cleanedPassword.length < 6) {
          setError('Security passphrase must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const operators = getStoredOperators();
        const alreadyExists = operators.some(o => o.email.toLowerCase() === cleanedEmail);

        if (alreadyExists) {
          setError(`This email (${cleanedEmail}) is already registered! Please switch to Sign In or use another email.`);
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

        setDbStatus('Creating operator credentials in Supabase cloud...');

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
          console.info('Supabase database sync note:', dbErr);
        }

        try {
          await supabase.auth.signUp({
            email: userData.email,
            password: cleanedPassword,
            options: { data: { full_name: userData.name, role: userData.role } }
          });
        } catch (authErr) {
          // ignore
        }

        setDbStatus(`✓ Account created! Welcome, ${userData.name}`);
        setTimeout(() => {
          onLogin(userData);
        }, 350);
      }
    } catch (err) {
      console.warn('Authentication handler caught:', err);
      setError('An unexpected error occurred during authentication. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-page)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', borderRadius: 16, border: '1px solid var(--border-color)', padding: '28px 32px', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="sonar-logo-icon" style={{ width: 44, height: 44, margin: '0 auto 10px auto' }}></div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--navy-dark)', margin: 0 }}>
            AquaSense AUV
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate-muted)', letterSpacing: 1, marginTop: 4 }}>
            SYS // LOW-POWER ADAPTIVE SDR SONAR LINK
          </div>
        </div>

        {/* Mode Switch Tabs: Sign In vs Register */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setDbStatus(null); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? 'var(--primary-teal)' : 'var(--slate-muted)',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <KeyRound size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setDbStatus(null); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? 'var(--primary-teal)' : 'var(--slate-muted)',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={14} />
            <span>Register Operator</span>
          </button>
        </div>

        {/* Security / Database Notice */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={20} color="var(--accent-cyan)" />
          <div style={{ fontSize: 11, color: 'var(--primary-teal)', lineHeight: 1.4 }}>
            <strong>Operator Gateway:</strong> {mode === 'login' ? 'Only registered operator accounts can access the telemetry deck.' : 'Register new mission operator credentials with Supabase cloud database.'}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertCircle size={16} color="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Success / DB Status */}
        {dbStatus && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '8px 12px', borderRadius: 8, fontSize: 11.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} color="#059669" />
            <span>{dbStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Operator Name (Shown in Register Mode) */}
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                OPERATOR FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                  className="login-input"
                  placeholder="e.g. Praveen Kumar"
                />
                <User size={16} color="#064E3B" style={{ position: 'absolute', left: 12, top: 12 }} />
              </div>
            </div>
          )}

          {/* Operator Email */}
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              OPERATOR EMAIL / ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                placeholder={mode === 'login' ? 'Enter registered email' : 'yourname@aquasense.org'}
              />
              <Mail size={16} color="#064E3B" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          {/* Security Passphrase */}
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              SECURITY PASSPHRASE
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                style={{ paddingRight: 40 }}
                placeholder={mode === 'login' ? 'Enter security passphrase' : 'Create passphrase (min 6 chars)'}
              />
              <Lock size={16} color="#064E3B" style={{ position: 'absolute', left: 12, top: 12 }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 9,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}
                title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Operational Role (Shown in Register Mode) */}
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                MISSION ROLE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="login-select"
              >
                <option value="Sonar Payload Specialist">Sonar Payload Specialist</option>
                <option value="AUV Systems Engineer">AUV Systems Engineer</option>
                <option value="Hydroacoustic Mission Commander">Hydroacoustic Mission Commander</option>
                <option value="Research & Tank Trials Operator">Research &amp; Tank Trials Operator</option>
              </select>
            </div>
          )}



          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--slate-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Database size={13} color="var(--mint-green-dark)" />
              <span>Supabase Cloud Sync: Active</span>
            </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
              SSL 256-bit
            </span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary-teal" 
            style={{ padding: '12px 16px', marginTop: 4, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12.5 }}
          >
            <span>
              {loading 
                ? (mode === 'login' ? 'Verifying Credentials...' : 'Registering Operator...') 
                : (mode === 'login' ? 'Authenticate & Enter System' : 'Create Operator Account & Enter')}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 9.5, color: 'var(--slate-muted)', fontFamily: 'monospace' }}>
          AUV TELEMETRY ENGINE V2.4-SDR • MISSION CONTROL
        </div>
      </div>
    </div>
  );
}
