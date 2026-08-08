import React, { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp, 
  limit, 
  isAdminEmail 
} from '../firebase';
import { Send, Heart, Trash2, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

export default function Guestbook({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const mockMessages = [
    {
      id: 'demo-1',
      authorName: '김민준',
      authorEmail: 'minjun@hmh.or.kr',
      authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      authorId: 'user-demo-1',
      content: '👋 HMH 학교 방명록 오픈을 축하합니다! 실시간으로 방명록이 남겨져서 너무 신기하네요.',
      likes: ['user-2'],
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'demo-2',
      authorName: '이서연 (선생님)',
      authorEmail: 'admin@hmh.or.kr',
      authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      authorId: 'admin-1',
      content: '학교 전용 구글 계정(@hmh.or.kr)으로 접속된 것을 확인했습니다. 클린한 게시판 문화를 만들어 갑시다!',
      likes: ['user-1', 'user-2'],
      createdAt: new Date(Date.now() - 7200000)
    }
  ];

  useEffect(() => {
    if (!db) {
      setMessages(mockMessages);
      return;
    }

    try {
      const q = query(
        collection(db, 'guestbook'), 
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setMessages(docs.length > 0 ? docs : mockMessages);
      }, (err) => {
        console.warn("Firestore snapshot query failed, using fallback data:", err);
        setMessages(mockMessages);
      });

      return () => unsubscribe();
    } catch (e) {
      setMessages(mockMessages);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    if (inputContent.length > 140) {
      setStatusMsg({ type: 'error', text: '방명록은 140자 이내로 작성해 주세요.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    const newMsgObj = {
      content: inputContent.trim(),
      authorId: currentUser?.uid || 'guest-uid',
      authorName: currentUser?.displayName || '익명 학생',
      authorEmail: currentUser?.email || 'student@hmh.or.kr',
      authorPhoto: currentUser?.photoURL || '',
      likes: [],
      createdAt: serverTimestamp()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'guestbook'), newMsgObj);
      } else {
        setMessages(prev => [
          { ...newMsgObj, id: 'local-' + Date.now(), createdAt: new Date() },
          ...prev
        ]);
      }
      setInputContent('');
      setStatusMsg({ type: 'success', text: '⚡ 방명록이 실시간으로 등록되었습니다!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: `등록 실패: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (msg) => {
    const userId = currentUser?.uid || 'guest-uid';
    const isLiked = msg.likes?.includes(userId);

    if (db && !msg.id.startsWith('demo-') && !msg.id.startsWith('local-')) {
      const msgRef = doc(db, 'guestbook', msg.id);
      try {
        await updateDoc(msgRef, {
          likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
        });
      } catch (e) {
        console.error("Like update failed:", e);
      }
    } else {
      setMessages(prev => prev.map(m => {
        if (m.id === msg.id) {
          const currentLikes = m.likes || [];
          return {
            ...m,
            likes: isLiked ? currentLikes.filter(id => id !== userId) : [...currentLikes, userId]
          };
        }
        return m;
      }));
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('이 방명록을 삭제하시겠습니까?')) return;

    if (db && !msg.id.startsWith('demo-') && !msg.id.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'guestbook', msg.id));
      } catch (e) {
        alert('삭제 실패: ' + e.message);
      }
    } else {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  };

  const isAdmin = isAdminEmail(currentUser?.email);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <MessageSquare color="#06b6d4" size={22} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>실시간 방명록 남기기</h3>
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'rgba(6,182,212,0.15)', 
            color: '#38bdf8', 
            padding: '4px 8px', 
            borderRadius: '12px',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={12} /> 실시간(onSnapshot) 동기화 중
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <textarea
              rows={3}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="HMH 학교 친구들에게 응원이나 자유로운 인사를 남겨주세요 (최대 140자)"
              maxLength={140}
              style={{ width: '100%', resize: 'none' }}
            />
            <span style={{ 
              position: 'absolute', 
              bottom: '12px', 
              right: '14px', 
              fontSize: '0.75rem',
              color: inputContent.length >= 130 ? '#f87171' : 'var(--text-dim)'
            }}>
              {inputContent.length}/140자
            </span>
          </div>

          {statusMsg && (
            <div style={{ 
              marginBottom: '12px', 
              fontSize: '0.85rem', 
              color: statusMsg.type === 'error' ? '#f87171' : '#34d399' 
            }}>
              {statusMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src={currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email || 'guest'}`} 
                alt="Profile" 
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-glass)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {currentUser?.displayName || 'HMH 학생'} ({currentUser?.email})
              </span>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !inputContent.trim()}
              className="btn-primary" 
              style={{ padding: '8px 18px', fontSize: '0.9rem' }}
            >
              <Send size={16} />
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => {
          const isOwner = currentUser && (currentUser.uid === msg.authorId || currentUser.email === msg.authorEmail);
          const isLiked = msg.likes?.includes(currentUser?.uid || 'guest-uid');
          const isMsgAdmin = isAdminEmail(msg.authorEmail);

          return (
            <div 
              key={msg.id} 
              className="glass-panel glass-panel-hover animate-enter" 
              style={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={msg.authorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.authorEmail}`} 
                    alt="avatar" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{msg.authorName}</strong>
                      {isMsgAdmin && (
                        <span style={{ 
                          background: 'rgba(139, 92, 246, 0.2)', 
                          color: '#c084fc', 
                          fontSize: '0.7rem', 
                          padding: '2px 6px', 
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <ShieldCheck size={12} /> 관리자
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {msg.authorEmail} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '방금 전'}
                    </span>
                  </div>
                </div>

                {(isOwner || isAdmin) && (
                  <button 
                    onClick={() => handleDelete(msg)}
                    className="btn-danger"
                    title={isAdmin && !isOwner ? "관리자 권한으로 삭제" : "삭제하기"}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <p style={{ fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '14px', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                {msg.content}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                <button 
                  onClick={() => handleToggleLike(msg)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isLiked ? '#ec4899' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0
                  }}
                >
                  <Heart size={16} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'var(--text-muted)'} />
                  <span>{msg.likes?.length || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
