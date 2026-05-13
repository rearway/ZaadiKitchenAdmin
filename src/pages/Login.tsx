import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'Admin' | 'Ops';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      localStorage.setItem('userRole', selectedRole);
      if (selectedRole === 'Admin') {
        navigate('/dashboard');
      } else if (selectedRole === 'Ops') {
        navigate('/ops');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--blk3)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 200, 150, 0.15) 0%, rgba(26, 26, 26, 0) 70%)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.03,
        zIndex: 0
      }} />

      {/* Main Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Zaadi<span style={{ color: 'var(--err)' }}>.</span> Ops Portal
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Internal team access only</p>
        </div>

        {/* Content Box */}
        <div style={{
          backgroundColor: '#222222',
          border: '1px solid #333333',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Sign in as...</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5' }}>
              Select your role. Your dashboard and permissions will be set accordingly.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Role Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RoleCard 
                title="👑 Administrator" 
                desc="Full access — revenue, pricing, all reports, customer management, team roles."
                selected={selectedRole === 'Admin'}
                onClick={() => setSelectedRole('Admin')}
              />
              <RoleCard 
                title="🍳 Ops / Kitchen" 
                desc="Daily ops, production tracking, label printing. No access to revenue, menu, or customer data."
                selected={selectedRole === 'Ops'}
                onClick={() => setSelectedRole('Ops')}
              />
            </div>

            {/* Email & Password Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#D1D5DB', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@zaadikitchen.com"
                  style={{ width: '100%', fontSize: '16px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', color: '#D1D5DB', fontWeight: 500 }}>Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', fontSize: '16px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Sign in as {selectedRole === 'Admin' ? 'Administrator' : 'Ops / Kitchen'} &rarr;
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ title, desc, selected, onClick }: { title: string, desc: string, selected: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: `2px solid ${selected ? 'var(--err)' : '#374151'}`,
        backgroundColor: selected ? 'rgba(0, 200, 150, 0.05)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h3 style={{ fontSize: '16px', fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>{title}</h3>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--err)' : '#6B7280'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {selected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--err)' }} />}
        </div>
      </div>
      <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.4' }}>{desc}</p>
    </div>
  );
}
