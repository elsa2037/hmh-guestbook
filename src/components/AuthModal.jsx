import React from 'react';
import { LogIn, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';
import { ALLOWED_DOMAIN, ENABLE_TEST_MODE } from '../firebase';

export default function AuthModal({ onSignIn, errorMsg, isSigningIn }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(5, 7, 12, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-enter" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 32px',
        textAlign: 'center',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.15)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.2) 100%)',
          border: '1px solid rgba(6,182,212,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <Sparkles size={32} color="#06b6d4" />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
          HMH 학교 서비스
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
          학교 구성원 전용 실시간 방명록 & 게시판입니다.<br />
          보안을 위해 학교 인증 계정으로 로그인해 주세요.
        </p>

        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          textAlign: 'left',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
            <CheckCircle2 size={16} />
            허용 도메인: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>@{ALLOWED_DOMAIN}</code>
          </div>
          {ENABLE_TEST_MODE ? (
            <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '4px' }}>
              ⚡ 로컬 테스트 모드 활성화됨: 모든 이메일 계정으로 테스트 가능합니다.
            </div>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '4px' }}>
              외부 Gmail 계정은 백엔드 보안 규칙에 의해 접속이 차단됩니다.
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#f87171',
            fontSize: '0.88rem',
            textAlign: 'left',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <ShieldAlert size={20} style={{ shrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <button 
          onClick={onSignIn}
          disabled={isSigningIn}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
        >
          <LogIn size={20} />
          {isSigningIn ? '구글 인증 진행 중...' : 'Google 계정으로 계속하기'}
        </button>
      </div>
    </div>
  );
}
