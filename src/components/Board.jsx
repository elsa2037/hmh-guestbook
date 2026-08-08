import React, { useState, useEffect } from 'react';
import { 
  db, 
  storage, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  limit, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  isAdminEmail 
} from '../firebase';
import { FileText, Paperclip, Plus, Trash2, ShieldCheck, Download, AlertCircle } from 'lucide-react';

const CATEGORIES = ['전체', '공지', '자유수다', '질문', '정보공유'];

export default function Board({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('자유수다');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockPosts = [
    {
      id: 'board-demo-1',
      title: '📌 2026학년도 2학기 동아리 발표회 일정 안내',
      category: '공지',
      content: '안녕하세요, 학생회입니다! 이번 학기 동아리 발표회는 다음 달 15일 강당에서 진행될 예정입니다. 준비 관련 문의 사항은 자유 게시판 질문 탭을 활용해 주세요.',
      authorName: '학생회장',
      authorEmail: 'admin@hmh.or.kr',
      authorId: 'admin-1',
      attachmentUrl: '',
      attachmentName: '',
      attachmentSize: 0,
      createdAt: new Date(Date.now() - 14400000)
    },
    {
      id: 'board-demo-2',
      title: '방과후 프로그래밍 스터디원 모집합니다 (Vite & Firebase)',
      category: '정보공유',
      content: 'Vite와 Firebase를 활용한 웹 앱 만들기 프로젝트에 참여할 학생을 구합니다. 관심 있는 분들은 댓글이나 방명록 남겨주세요!',
      authorName: '박준호',
      authorEmail: 'junho@hmh.or.kr',
      authorId: 'user-demo-2',
      attachmentUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      attachmentName: 'study_poster.jpg',
      attachmentSize: 1420000,
      createdAt: new Date(Date.now() - 28800000)
    }
  ];

  useEffect(() => {
    if (!db) {
      setPosts(mockPosts);
      return;
    }

    try {
      const q = query(
        collection(db, 'posts'), 
        orderBy('createdAt', 'desc'), 
        limit(30)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setPosts(docs.length > 0 ? docs : mockPosts);
      }, (err) => {
        console.warn("Firestore posts listener error:", err);
        setPosts(mockPosts);
      });

      return () => unsubscribe();
    } catch (e) {
      setPosts(mockPosts);
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setFileError(null);
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setFileError(`파일 크기가 2MB를 초과했습니다 (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). 2MB 이하의 파일만 업로드할 수 있습니다.`);
      setFile(null);
      e.target.value = '';
    } else {
      setFileError(null);
      setFile(selectedFile);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    let downloadUrl = '';
    let uploadedFileName = '';
    let uploadedFileSize = 0;

    try {
      if (file && storage) {
        const fileRef = ref(storage, `attachments/${currentUser?.uid || 'guest'}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedFileName = file.name;
        uploadedFileSize = file.size;
      } else if (file) {
        downloadUrl = URL.createObjectURL(file);
        uploadedFileName = file.name;
        uploadedFileSize = file.size;
      }

      const newPostObj = {
        title: title.trim(),
        category,
        content: content.trim(),
        authorId: currentUser?.uid || 'guest-uid',
        authorName: currentUser?.displayName || 'HMH 학생',
        authorEmail: currentUser?.email || 'student@hmh.or.kr',
        attachmentUrl: downloadUrl,
        attachmentName: uploadedFileName,
        attachmentSize: uploadedFileSize,
        createdAt: serverTimestamp()
      };

      if (db) {
        await addDoc(collection(db, 'posts'), newPostObj);
      } else {
        setPosts(prev => [
          { ...newPostObj, id: 'post-local-' + Date.now(), createdAt: new Date() },
          ...prev
        ]);
      }

      setTitle('');
      setContent('');
      setFile(null);
      setShowCreateModal(false);
    } catch (err) {
      alert(`게시글 등록 실패: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    if (db && !post.id.startsWith('board-demo-') && !post.id.startsWith('post-local-')) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
      } catch (err) {
        alert('삭제 오류: ' + err.message);
      }
    } else {
      setPosts(prev => prev.filter(p => p.id !== post.id));
    }
  };

  const filteredPosts = selectedCategory === '전체' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  const isAdmin = isAdminEmail(currentUser?.email);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))' : 'rgba(255,255,255,0.05)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                border: '1px solid ' + (selectedCategory === cat ? 'transparent' : 'var(--border-glass)'),
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-primary"
          style={{ fontSize: '0.9rem', padding: '8px 16px' }}
        >
          <Plus size={18} /> 새 게시글 작성
        </button>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 7, 12, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-enter" style={{ maxWidth: '600px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText color="#06b6d4" /> 게시글 작성
            </h3>

            <form onSubmit={handleCreatePost}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>카테고리</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {CATEGORIES.filter(c => c !== '전체').map(c => (
                    <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>제목</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="게시글 제목을 입력하세요"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>내용</label>
                <textarea 
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 작성하세요..."
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  첨부파일 (최대 2MB 이하)
                </label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                />

                {fileError && (
                  <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>{fileError}</span>
                  </div>
                )}
                {file && (
                  <div style={{ color: '#34d399', fontSize: '0.82rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={14} />
                    <span>선택됨: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !!fileError || !title.trim()}
                  className="btn-primary"
                >
                  {isSubmitting ? '업로드 중...' : '게시하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredPosts.map((post) => {
          const isOwner = currentUser && (currentUser.uid === post.authorId || currentUser.email === post.authorEmail);
          const isPostAdmin = isAdminEmail(post.authorEmail);

          return (
            <div key={post.id} className="glass-panel glass-panel-hover animate-enter" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    background: post.category === '공지' ? 'rgba(236,72,153,0.2)' : 'rgba(6,182,212,0.15)',
                    color: post.category === '공지' ? '#f472b6' : '#38bdf8',
                    border: '1px solid ' + (post.category === '공지' ? 'rgba(236,72,153,0.3)' : 'rgba(6,182,212,0.3)'),
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {post.authorName} {isPostAdmin && <ShieldCheck size={14} inline color="#c084fc" />} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '오늘'}
                  </span>
                </div>

                {(isOwner || isAdmin) && (
                  <button 
                    onClick={() => handleDeletePost(post)}
                    className="btn-danger"
                    title={isAdmin && !isOwner ? "관리자 권한으로 삭제" : "삭제하기"}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>
                {post.title}
              </h3>

              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </p>

              {post.attachmentUrl && (
                <div style={{ 
                  background: 'rgba(10,14,23,0.5)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '12px', 
                  padding: '12px 16px',
                  marginBottom: '12px'
                }}>
                  {post.attachmentUrl.match(/\.(jpeg|jpg|png|gif|webp)/i) || post.attachmentName?.match(/\.(jpeg|jpg|png|gif|webp)/i) ? (
                    <div style={{ marginBottom: '8px' }}>
                      <img 
                        src={post.attachmentUrl} 
                        alt="attachment preview" 
                        style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Paperclip size={16} color="#06b6d4" />
                      <span>{post.attachmentName || '첨부파일'}</span>
                      {post.attachmentSize > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          ({(post.attachmentSize / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <a 
                      href={post.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      <Download size={14} /> 다운로드
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
