// --- Import Modules ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ============================================
// ⚠️ KONFIGURASI (WAJIB DIISI)
// ============================================

// 1. Config Firebase (Paste Config Kamu Di Sini)
const firebaseConfig = {
    apiKey: "AIzaSyDnajbZduUkwavot9Wysx_4UdACLwWKrjo",
    authDomain: "student-task-manager-de5e5.firebaseapp.com",
    projectId: "student-task-manager-de5e5",
    storageBucket: "student-task-manager-de5e5.firebasestorage.app",
    messagingSenderId: "248132812112",
    appId: "1:248132812112:web:64bab4cbcff2cc59530055",
    measurementId: "G-JYDPZLDHB6"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'student-task-app';

// State Variables
let currentUser = null;
let tasks = [];
let isLoginMode = true;
let taskToDeleteId = null;

// --- Auth Functions ---

// Helper untuk environment Canvas/Local (Jangan dihapus)
const initAuth = async () => {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e) { console.error(e); }
    }
};
initAuth();

// Listener Status Login
onAuthStateChanged(auth, (user) => {
    document.getElementById('loading-screen').classList.add('hidden');
    currentUser = user;
    if (user) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-info').classList.add('flex');
        document.getElementById('user-email').innerText = user.email;
        loadTasks();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
        document.getElementById('user-info').classList.remove('flex');
        tasks = [];
    }
});

function getErrorMessage(code) {
    switch(code) {
        case 'auth/invalid-email': return 'Format email tidak valid.';
        case 'auth/user-disabled': return 'Akun ini telah dinonaktifkan.';
        case 'auth/user-not-found': return 'Email tidak ditemukan.';
        case 'auth/wrong-password': return 'Password salah.';
        case 'auth/email-already-in-use': return 'Email sudah terdaftar.';
        case 'auth/weak-password': return 'Password terlalu lemah (min 6 karakter).';
        case 'auth/operation-not-allowed': return 'Login Email/Password belum diaktifkan di Console Firebase.';
        default: return 'Terjadi kesalahan: ' + code;
    }
}

// Attach function to window (agar bisa dipanggil dari onclick di HTML)
window.handleAuth = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submit-btn');
    const err = document.getElementById('auth-error');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    err.classList.add('hidden');

    try {
        if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
        else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        err.innerText = getErrorMessage(error.code);
        err.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerText = isLoginMode ? 'Masuk' : 'Daftar';
    }
};

window.handleLogout = () => signOut(auth);

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login Mahasiswa' : 'Daftar Akun Baru';
    document.getElementById('submit-btn').innerText = isLoginMode ? 'Masuk' : 'Daftar';
    document.getElementById('auth-switch-text').innerText = isLoginMode ? 'Belum punya akun? Daftar sekarang' : 'Sudah punya akun? Login disini';
};

// --- Firestore Functions ---

function loadTasks() {
    if (!currentUser) return;
    const q = query(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks'));
    onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTasks();
        updateStats();
    });
}

window.saveTask = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const id = document.getElementById('task-id').value;
    const ref = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks');

    try {
        if (id) await updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks', id), { title, description: desc, dueDate: date, priority, updatedAt: serverTimestamp() });
        else await addDoc(ref, { title, description: desc, dueDate: date, priority, isCompleted: false, createdAt: serverTimestamp() });
        closeModal();
    } catch (error) { console.error(error); alert("Gagal menyimpan."); }
};

window.toggleComplete = async (id, status) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks', id), { isCompleted: !status });
};

window.deleteTask = async () => {
    if (!currentUser || !taskToDeleteId) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks', taskToDeleteId));
    closeDeleteModal();
};
