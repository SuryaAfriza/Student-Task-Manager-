// --- Import Modules ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// IMPORT CONFIG DARI FILE TERPISAH
import CONFIG from './config.js'; 

// ============================================
// ⚠️ KONFIGURASI (Mengambil dari file config.js)
// ============================================

const firebaseConfig = CONFIG.FIREBASE;
const geminiApiKey = CONFIG.GEMINI.apiKey;

// ============================================

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
        case 'auth/invalid-credential': return 'Email atau Password salah.';
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
    const errorMsg = document.getElementById('auth-error-msg');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    err.classList.add('hidden');

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        if (errorMsg) errorMsg.innerText = getErrorMessage(error.code);
        else err.innerText = getErrorMessage(error.code);
        err.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        // Kembalikan teks tombol sesuai mode yang aktif
        if (isLoginMode) {
            btn.innerHTML = '<span>Masuk Sekarang</span><i class="fas fa-arrow-right ml-2"></i>';
        } else {
            btn.innerHTML = '<span>Daftar Akun</span><i class="fas fa-user-plus ml-2"></i>';
        }
    }
};

window.handleLogout = () => signOut(auth);

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode; // Balik status (Login <-> Daftar)
    
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');
    const errorDiv = document.getElementById('auth-error');

    // Sembunyikan error jika ada
    if(errorDiv) errorDiv.classList.add('hidden');

    if (isLoginMode) {
        // Jika mode LOGIN aktif:
        title.innerText = 'Selamat Datang! 👋';
        submitBtn.innerHTML = '<span>Masuk Sekarang</span><i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>';
        
        // Teks bantu: "Belum punya akun?"
        switchText.innerText = 'Belum punya akun?';
        // Tombol switch: "Daftar Gratis"
        switchBtn.innerText = 'Daftar dulu yuk';
    } else {
        // Jika mode DAFTAR aktif:
        title.innerText = 'Buat Akun Baru 🚀';
        submitBtn.innerHTML = '<span>Daftar Akun</span><i class="fas fa-user-plus ml-2 transform group-hover:translate-x-1 transition-transform"></i>';
        
        // Teks bantu: "Sudah punya akun?"
        switchText.innerText = 'Sudah punya akun?';
        // Tombol switch: "Login Disini"
        switchBtn.innerText = 'Login disini';
    }
};

// --- Fungsi Reset Password ---

window.openResetModal = () => {
    console.log("Membuka Modal Reset..."); // Debugging
    const emailInput = document.getElementById('email');
    if(emailInput) {
        document.getElementById('reset-email').value = emailInput.value; 
    }
    const modal = document.getElementById('reset-modal');
    if(modal) {
        modal.classList.remove('hidden');
    } else {
        console.error("Modal Reset tidak ditemukan! Cek HTML kamu.");
        alert("Terjadi kesalahan sistem: Modal tidak ditemukan.");
    }
}

window.closeResetModal = () => {
    document.getElementById('reset-modal').classList.add('hidden');
}

window.handleResetPassword = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        alert("Mohon masukkan email.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert(`Link reset password telah dikirim ke: ${email}\nSilakan cek inbox atau folder spam emailmu.`);
        closeResetModal();
    } catch (error) {
        console.error(error);
        alert("Gagal mengirim link: " + getErrorMessage(error.code));
    }
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

window.saveTask = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    if (!currentUser) return;

    // 1. Ambil tombol simpan & berikan efek loading
    const submitBtn = document.querySelector('#task-form button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerText : 'Simpan';
    
    // Pastikan tombol ada sebelum diubah
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const id = document.getElementById('task-id').value;
    
    // Referensi koleksi
    const tasksCollection = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks');

    try {
        if (id) {
            // Mode Edit: Update dokumen yang ada
            await updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'tasks', id), { 
                title, 
                description: desc, 
                dueDate: date, 
                priority, 
                updatedAt: serverTimestamp() 
            });
        } else {
            // Mode Tambah: Buat dokumen baru
            await addDoc(tasksCollection, { 
                title, 
                description: desc, 
                dueDate: date, 
                priority, 
                isCompleted: false, 
                createdAt: serverTimestamp() 
            });
        }
        
        // 2. Tutup Modal Secara Otomatis (Panggil fungsi global window.closeModal)
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        } else {
            // Fallback manual jika fungsi tidak ditemukan (opsional)
            const modal = document.getElementById('task-modal');
            if (modal) modal.classList.add('hidden');
        }
        
    } catch (error) { 
        console.error("Gagal menyimpan:", error); 
        alert("Gagal menyimpan: " + error.message); 
    } finally {
        // 3. PENTING: Kembalikan tombol ke keadaan semula (aktif kembali)
        // Ini dijalankan baik sukses maupun gagal
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Simpan'; // Kembalikan teks asli (tanpa spinner)
        }
    }
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

// --- Gemini AI Functions ---

window.generateDescriptionAI = async () => {
    const title = document.getElementById('task-title').value;
    if (!title) {
        alert("Harap isi Judul Tugas terlebih dahulu agar AI bisa membuat rencana.");
        return;
    }

    const loading = document.getElementById('ai-loading-input');
    const descField = document.getElementById('task-desc');
    loading.classList.remove('hidden');

    const prompt = `Bertindaklah sebagai asisten belajar mahasiswa yang cerdas. Pengguna memiliki tugas kuliah berjudul: "${title}". 
    Buatkan rencana pengerjaan singkat (maksimal 5 poin) dan 1 tips belajar yang relevan.
    Format dalam bentuk bullet points yang rapi. Gunakan Bahasa Indonesia.`;

    try {
        const response = await callGeminiAPI(prompt);
        descField.value = response;
    } catch (error) {
        console.error("AI Error:", error);
        alert("Maaf, AI sedang sibuk atau kunci API salah.");
    } finally {
        loading.classList.add('hidden');
    }
};

window.askAI = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-content');
    
    modal.classList.remove('hidden');
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 space-y-4">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            <p class="text-purple-600 font-medium animate-pulse">Sedang menganalisis tugas "${task.title}"...</p>
        </div>
    `;

    const prompt = `Bertindaklah sebagai tutor pribadi. Siswa ini memiliki tugas:
    Judul: ${task.title}
    Deskripsi: ${task.description || "Tidak ada deskripsi"}
    Prioritas: ${task.priority}
    
    Berikan 3 hal:
    1. Strategi konkret untuk menyelesaikan tugas ini.
    2. Ide atau kata kunci pencarian yang berguna untuk referensi.
    3. Kalimat motivasi singkat agar semangat.
    
    Gunakan format Markdown (bold, list) agar mudah dibaca. Bahasa Indonesia.`;

    try {
        const response = await callGeminiAPI(prompt);
        content.innerHTML = marked.parse(response);
    } catch (error) {
        content.innerHTML = `<p class="text-red-500 text-center">Gagal menghubungi AI. ${error.message}</p>`;
    }
};

async function callGeminiAPI(userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respon dari AI.";
}

// --- UI Helper Functions ---

window.renderTasks = () => {
    const container = document.getElementById('task-list');
    const filterValue = document.getElementById('filter-priority').value;
    const badgeCount = document.getElementById('task-count-badge'); // Badge jumlah
    
    container.innerHTML = '';

    let filtered = tasks;
    if (filterValue !== 'all') filtered = tasks.filter(t => t.priority === filterValue);
    
    // Update Badge
    if (badgeCount) badgeCount.innerText = filtered.length;

    // Sorting: Belum selesai di atas, lalu berdasarkan tanggal deadline terdekat
    filtered.sort((a, b) => (a.isCompleted - b.isCompleted) || new Date(a.dueDate) - new Date(b.dueDate));

    if (filtered.length === 0) {
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }
    document.getElementById('empty-state').classList.add('hidden');

    filtered.forEach(task => {
        // Logika Status Deadline
        const today = new Date().setHours(0,0,0,0);
        const due = new Date(task.dueDate).setHours(0,0,0,0);
        const isLate = !task.isCompleted && due < today;
        const isToday = !task.isCompleted && due === today;
        
        // Warna Prioritas (Badge)
        let priorityBadge = '';
        if(task.priority === 'Tinggi') priorityBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200"> Tinggi</span>';
        else if(task.priority === 'Sedang') priorityBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600 border border-yellow-200"> Sedang</span>';
        else priorityBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200"> Rendah</span>';

        // Border Kiri Warna
        const borderClass = task.isCompleted ? 'border-l-4 border-l-green-400' : (task.priority === 'Tinggi' ? 'border-l-4 border-l-red-500' : (task.priority === 'Sedang' ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-blue-400'));
        const bgClass = task.isCompleted ? 'bg-gray-50' : 'bg-white';
        const opacityClass = task.isCompleted ? 'opacity-75 grayscale-[0.5]' : '';

        const div = document.createElement('div');
        div.className = `task-card ${bgClass} ${borderClass} ${opacityClass} rounded-2xl p-5 shadow-sm border-t border-r border-b border-gray-100 relative group flex flex-col h-full`;
        
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                ${priorityBadge}
                <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onclick="editTask('${task.id}')" class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><i class="fas fa-edit"></i></button>
                    <button onclick="confirmDelete('${task.id}')" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            
            <h3 class="font-bold text-gray-800 text-lg mb-2 leading-tight ${task.isCompleted ? 'line-through text-gray-500' : ''}">${escapeHtml(task.title)}</h3>
            <p class="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">${escapeHtml(task.description || 'Tidak ada catatan tambahan.')}</p>
        
            <button onclick="askAI('${task.id}')" class="w-full mb-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 text-xs font-bold py-1.5 rounded border border-purple-100 flex items-center justify-center space-x-1 transition">
                <i class="fas fa-sparkles text-yellow-500"></i>
                <span>Tips AI Tutor</span>
            </button>

            <div class="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                <div class="text-sm ${isLate ? 'text-red-500 font-semibold' : 'text-gray-500'}">
                    <i class="far fa-calendar-alt mr-1"></i> ${formatDate(task.dueDate)}
                </div>
                <button onclick="toggleComplete('${task.id}', ${task.isCompleted})" class="px-3 py-1.5 rounded-full text-xs font-bold transition ${task.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                    <i class="fas ${task.isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i> ${task.isCompleted ? 'Selesai' : 'Selesai?'}
                </button>
            </div>
        `;
        container.appendChild(div);
    });
};

window.updateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;
    
    document.getElementById('total-tasks').innerText = total;
    document.getElementById('pending-tasks').innerText = pending;
    document.getElementById('completed-tasks').innerText = completed;
};

window.openModal = () => {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').innerText = 'Tambah Tugas Baru';
    document.getElementById('task-modal').classList.remove('hidden');
};
window.closeModal = () => document.getElementById('task-modal').classList.add('hidden');
window.closeAIModal = () => document.getElementById('ai-modal').classList.add('hidden');

window.editTask = (id) => {
    const t = tasks.find(x => x.id === id);
    if(t) {
        document.getElementById('task-id').value = t.id;
        document.getElementById('task-title').value = t.title;
        document.getElementById('task-desc').value = t.description;
        document.getElementById('task-date').value = t.dueDate;
        document.getElementById('task-priority').value = t.priority;
        document.getElementById('modal-title').innerText = 'Edit Tugas';
        document.getElementById('task-modal').classList.remove('hidden');
    }
};

window.confirmDelete = (id) => { taskToDeleteId = id; document.getElementById('delete-modal').classList.remove('hidden'); };
window.closeDeleteModal = () => document.getElementById('delete-modal').classList.add('hidden');
window.filterTasks = () => window.renderTasks();

function formatDate(d) { if(!d) return '-'; return new Date(d).toLocaleDateString('id-ID', {day:'numeric', month:'short'}); }
function escapeHtml(t) { if(!t) return ""; return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// --- POMODORO TIMER LOGIC ---
let pomoTimer = null;
let pomoTimeLeft = 25 * 60;
let isPomoRunning = false;
let pomoTotalTime = 25 * 60;

window.togglePomodoro = () => {
    const btnIcon = document.querySelector('#pomo-btn i');
    
    if (isPomoRunning) {
        clearInterval(pomoTimer);
        isPomoRunning = false;
        btnIcon.classList.remove('fa-pause');
        btnIcon.classList.add('fa-play', 'ml-0.5'); // Kembalikan posisi play
    } else {
        isPomoRunning = true;
        btnIcon.classList.remove('fa-play', 'ml-0.5');
        btnIcon.classList.add('fa-pause', 'ml-0');
        
        pomoTimer = setInterval(() => {
            if (pomoTimeLeft > 0) {
                pomoTimeLeft--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoTimer);
                isPomoRunning = false;
                btnIcon.classList.remove('fa-pause');
                btnIcon.classList.add('fa-play', 'ml-0.5');
                alert("Waktu Habis! Istirahat dulu.");
            }
        }, 1000);
    }
};

window.resetPomodoro = () => {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    pomoTimeLeft = pomoTotalTime;
    updatePomoDisplay();
    const btnIcon = document.querySelector('#pomo-btn i');
    if(btnIcon) {
        btnIcon.classList.remove('fa-pause');
        btnIcon.classList.add('fa-play', 'ml-0.5');
    }
};

window.setMode = (minutes) => {
    clearInterval(pomoTimer);
    isPomoRunning = false;
    pomoTotalTime = minutes * 60;
    pomoTimeLeft = pomoTotalTime;
    updatePomoDisplay();
    const btnIcon = document.querySelector('#pomo-btn i');
    if(btnIcon) {
        btnIcon.classList.remove('fa-pause');
        btnIcon.classList.add('fa-play', 'ml-0.5');
    }
};

function updatePomoDisplay() {
    const minutes = Math.floor(pomoTimeLeft / 60);
    const seconds = pomoTimeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const displayEl = document.getElementById('pomo-display');
    if(displayEl) displayEl.innerText = display;
}