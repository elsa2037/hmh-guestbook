/**
 * =========================================================
 * 효명고등학교 실시간 방명록 (app.js)
 * [3단계: Firebase 구글 로그인 + 실시간 Firestore 연동]
 * =========================================================
 */

// 1. Firebase 모듈러 SDK 가져오기 (CDN 방식 - 빌드 도구 불필요)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. 선생님의 파이어베이스 설정값 (주방 열쇠)
const firebaseConfig = {
  apiKey: "AIzaSyB11sCFf1tNcAp2ceusTDa_ZoQsQPIDPvg",
  authDomain: "hmh-guestbook.firebaseapp.com",
  projectId: "hmh-guestbook",
  storageBucket: "hmh-guestbook.firebasestorage.app",
  messagingSenderId: "1048113101148",
  appId: "1:1048113101148:web:9397c55410f35287a9e999",
  measurementId: "G-ME6YCE3CKN"
};

// 3. 파이어베이스 서비스 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// 4. 상태 변수 (현재 로그인한 사용자)
let currentUser = null;

// 5. DOM 요소 참조
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userDisplayName = document.getElementById('user-display-name');
const userAvatar = document.getElementById('user-avatar');

const guestbookForm = document.getElementById('guestbook-form');
const authorNameInput = document.getElementById('author-name');
const messageContent = document.getElementById('message-content');
const charCount = document.getElementById('char-count');
const btnSubmit = document.getElementById('btn-submit');
const messagesContainer = document.getElementById('messages-container');
const messageCountEl = document.getElementById('message-count');

// 6. 애플리케이션 초기화
function init() {
  setupEventListeners();
  observeAuthState();
  listenToGuestbookMessages();

  // 리디렉션 로그인 결과 확인 (팝업 차단 시 대비)
  getRedirectResult(auth).catch((error) => {
    console.error("리디렉션 로그인 결과 오류:", error);
  });
}

// 7. 이벤트 리스너 등록
function setupEventListeners() {
  // 글자 수 실시간 카운터
  messageContent.addEventListener('input', () => {
    charCount.textContent = messageContent.value.length;
  });

  // [구글 로그인 버튼 클릭]
  btnLogin.addEventListener('click', handleGoogleLogin);

  // [로그아웃 버튼 클릭]
  btnLogout.addEventListener('click', handleLogout);

  // [방명록 폼 전송]
  guestbookForm.addEventListener('submit', handleFormSubmit);
}

// 8. 로그인 상태 감지 (Firebase onAuthStateChanged)
function observeAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const email = user.email || '';

      // ★ [핵심 보안 규칙]: 효명고 도메인(@hmh.or.kr) 검증
      if (!email.toLowerCase().endsWith('@hmh.or.kr')) {
        alert(
          `⚠️ 효명고등학교 공식 계정(@hmh.or.kr)으로만 로그인하실 수 있습니다.\n\n` +
          `현재 시도하신 계정: ${email}\n` +
          `학교 구글 계정으로 다시 로그인해 주세요.`
        );
        await signOut(auth);
        return;
      }

      // 정식 효명고 승인 사용자
      currentUser = user;
      updateAuthUI(true);
    } else {
      currentUser = null;
      updateAuthUI(false);
    }
  });
}

// 9. 구글 팝업 로그인 실행
async function handleGoogleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    if (result && result.user) {
      alert(`🎉 반갑습니다, ${result.user.displayName || '효명인'}님! 로그인이 완료되었습니다.`);
    }
  } catch (error) {
    console.error("로그인 중 오류 발생:", error);
    if (error.code === 'auth/popup-blocked') {
      alert(
        "🚫 브라우저가 구글 로그인 팝업창을 차단했습니다!\n\n" +
        "주소창 맨 오른쪽 끝의 [🚫 팝업 차단됨] 아이콘을 누르고\n" +
        "['항상 허용']을 선택하신 후 다시 로그인 버튼을 눌러주세요."
      );
    } else if (error.code === 'auth/popup-closed-by-user') {
      // 사용자가 팝업을 직접 닫음
    } else {
      alert("로그인 처리 중 문제가 발생했습니다:\n[" + error.code + "] " + error.message);
    }
  }
}

// 10. 로그아웃 실행
async function handleLogout() {
  try {
    await signOut(auth);
    alert("로그아웃되었습니다.");
  } catch (error) {
    console.error("로그아웃 오류:", error);
    alert("로그아웃 중 오류가 발생했습니다: " + error.message);
  }
}

// 11. 인증 상태에 따른 UI 갱신
function updateAuthUI(isLoggedIn) {
  if (isLoggedIn && currentUser) {
    loggedOutView.classList.add('is-hidden');
    loggedInView.classList.remove('is-hidden');

    const name = currentUser.displayName || '효명인';
    userDisplayName.textContent = name;
    authorNameInput.value = name;
    authorNameInput.placeholder = "효명고 공식 성명이 자동 입력되었습니다";

    // 프로필 사진이 있으면 표시
    if (currentUser.photoURL) {
      userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="${escapeHtml(name)}" referrerpolicy="no-referrer">`;
    } else {
      userAvatar.textContent = name.charAt(0);
    }
  } else {
    loggedOutView.classList.remove('is-hidden');
    loggedInView.classList.add('is-hidden');
    userAvatar.textContent = '👤';
    authorNameInput.value = '';
    authorNameInput.placeholder = "상단에서 효명고 계정(@hmh.or.kr)으로 로그인해 주세요";
  }
}

// 12. 방명록 제출 및 Firestore 저장
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!currentUser) {
    alert("⚠️ 방명록을 작성하시려면 먼저 효명고 계정(@hmh.or.kr)으로 로그인해 주세요!");
    return;
  }

  const content = messageContent.value.trim();
  if (!content) {
    alert("메시지 내용을 입력해 주세요.");
    return;
  }

  try {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>등록 중... ⏳</span>`;

    // Firestore 'guestbook' 컬렉션에 새 문서 추가
    await addDoc(collection(db, "guestbook"), {
      authorName: currentUser.displayName || '효명인',
      authorEmail: currentUser.email,
      authorPhoto: currentUser.photoURL || null,
      message: content,
      createdAt: serverTimestamp()
    });

    // 폼 초기화
    messageContent.value = '';
    charCount.textContent = '0';
    alert("✨ 따뜻한 방명록이 성공적으로 등록되었습니다!");
  } catch (error) {
    console.error("방명록 저장 오류:", error);
    alert("방명록 저장 중 오류가 발생했습니다: " + error.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>방명록 남기기 ✨</span>`;
  }
}

// 13. 실시간 방명록 목록 구독 (onSnapshot)
function listenToGuestbookMessages() {
  messagesContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>방명록을 불러오는 중입니다...</p>
    </div>
  `;

  try {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      renderMessages(messages);
    }, (error) => {
      console.error("실시간 방명록 수신 오류:", error);
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p>방명록을 불러오지 못했습니다.<br>Firebase Firestore 보안 규칙 설정을 확인해 주세요.</p>
        </div>
      `;
    });
  } catch (error) {
    console.error("쿼리 설정 오류:", error);
  }
}

// 14. 방명록 카드 렌더링
function renderMessages(messages) {
  messageCountEl.textContent = `(${messages.length})`;

  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>아직 남겨진 이야기가 없습니다.<br>효명고 계정으로 첫 번째 따뜻한 한마디를 남겨보세요!</p>
      </div>
    `;
    return;
  }

  messagesContainer.innerHTML = messages.map(msg => {
    const timeString = formatTimestamp(msg.createdAt);
    const authorName = msg.authorName || '효명인';
    const initial = authorName.charAt(0);

    const avatarHtml = msg.authorPhoto 
      ? `<img src="${msg.authorPhoto}" alt="${escapeHtml(authorName)}" referrerpolicy="no-referrer">` 
      : escapeHtml(initial);

    return `
      <article class="message-card">
        <div class="card-top">
          <div class="author-info">
            <div class="author-avatar">${avatarHtml}</div>
            <div class="author-title-group">
              <span class="card-author-name">${escapeHtml(authorName)}</span>
              <span class="card-badge">효명인</span>
            </div>
          </div>
          <time class="card-time">${timeString}</time>
        </div>
        <div class="card-text">${escapeHtml(msg.message)}</div>
      </article>
    `;
  }).join('');
}

// 15. 타임스탬프 변환 함수
function formatTimestamp(timestamp) {
  if (!timestamp) return '방금 전';

  // Firestore Timestamp 객체거나 일반 Date 객체 대응
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 16. XSS 보안 방지 이스케이프
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 브라우저 로드 시 시작
document.addEventListener('DOMContentLoaded', init);
