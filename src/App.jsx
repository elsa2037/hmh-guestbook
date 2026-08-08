import React, { useState, useEffect } from 'react';
import { subscribeAuth, signInWithGoogle, logout, isAllowedEmail, isAdminEmail, ALLOWED_DOMAIN, isConfigValid } from './firebase';
import Guestbook from './components/Guestbook';
import Board from './components/Board';
import AuthModal from './components/AuthModal';
import { Sparkles, MessageSquare, LayoutGrid, LogOut, ShieldCheck, Key, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('guestbook');
  const [authError, setAuthError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showConfigNotice, setShowConfigNotice] = useState(!isConfigValid);

  useEffect(() => {
    const unsubscribe = subscribeAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err.message || '구글 로그인 실패');
    } finally {
      setIsSigningIn(false);
    }
  };

  const isAdmin = isAdminEmail(user?.email);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showConfigNotice && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '10px 20px',
          textAlign: 'center',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span>
            <b>데모/시연 모드 동작 중:</b> 실제 파이어베이스 연동을 위해 <code>.env.example</code>을 참고해 <code>.env</code> 파일에 본인의 Firebase API 키를 설정해 주세요.
          </span>
          <button 
            onClick={() => setShowConfigNotice(false)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '16px 32px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles color="#ffffff" size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }} className="gradient-text">
                HMH 학교 커뮤니티
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                @{ALLOWED_DOMAIN} 전용 서비스
              </span>
            </div>
          </div>

          {user && (
            <div style={{
              display: 'flex',
              background: 'rgba(10, 14, 23, 0.8)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--border-glass)'
            }}>
              <button
                onClick={() => setActiveTab('guestbook')}
                style={{
                  background: activeTab === 'guestbook' ? 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))' : 'transparent',
                  color: activeTab === 'guestbook' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={16} /> 실시간 방명록
              </button>
              <button
                onClick={() => setActiveTab('board')}
                style={{
                  background: activeTab === 'board' ? 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))' : 'transparent',
                  color: activeTab === 'board' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutGrid size={16} /> 자유 게시판
              </button>
            </div>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
                  alt="avatar" 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-glow)' }}
                />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {user.displayName || 'HMH 구성원'}
                    {isAdmin && (
                      <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '6px' }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</span>
                </div>
              </div>

              <button 
                onClick={logout}
                className="btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleSignIn}
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Google 로그인
            </button>
          )}
        </div>
      </header>

      <main style={{ flex: 1, padding: '32px 20px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {!user ? (
          <AuthModal 
            onSignIn={handleGoogleSignIn} 
            errorMsg={authError} 
            isSigningIn={isSigningIn}
          />
        ) : (
          <>
            {activeTab === 'guestbook' ? (
              <Guestbook currentUser={user} />
            ) : (
              <Board currentUser={user} />
            )}
          </>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            HMH High School Guestbook & Board • Firebase Authentication & Firestore real-time sync
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <Key size={14} /> Security: @{ALLOWED_DOMAIN} Domain Enforced
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
