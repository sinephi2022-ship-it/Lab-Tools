// LabMate Pro - 应用主逻辑
const { createApp, ref, computed, reactive, onMounted, watch, nextTick, onUnmounted } = Vue;

// 初始化应用
async function initApp() {
    // 等待依赖加载
    await waitForDeps();
    
    const Utils = window.Utils || {};
    const db = window.db;
    const auth = window.auth;
    const AVATARS = window.AVATARS || [];
    
    if (!db || !auth) {
        showError('Firebase 初始化失败，请检查网络');
        return;
    }
    
    createApp({
        setup() {
            // 核心状态
            const view = ref('loading');
            const user = ref(null);
            const tempUser = ref(null);
            const lang = ref('en');
            const t = computed(() => (k) => window.DICT?.[lang.value]?.[k] || k);
            
            // 数据状态
            const labs = ref([]);
            const collection = ref([]);
            const friendsList = ref([]);
            const currentLab = ref(null);
            const elements = ref([]);
            const connections = ref([]);
            
            // UI状态
            const showChat = ref(false);
            const messages = ref([]);
            const showCreateModal = ref(false);
            const showProfileModal = ref(false);
            
            // 输入状态
            const form = ref({ name: '', email: '', password: '' });
            const newLabName = ref('');
            const joinCode = ref('');
            
            // 摄像头/画布
            const camera = reactive({ x: 0, y: 0, z: 1 });
            const drag = reactive({ active: false, type: null, startX: 0, startY: 0, currX: 0, currY: 0 });
            const history = ref([]);
            const historyIndex = ref(-1);
            
            // 清理跟踪
            const unsubscribers = [];
            let keyboardHandler = null;
            
            onMounted(() => {
                hideLoadingScreen();
                view.value = 'auth';
                
                if (auth) {
                    try {
                        const unsub = auth.onAuthStateChanged(u => {
                            if (u) {
                                user.value = { uid: u.uid, email: u.email, name: u.displayName || 'User', avatar: AVATARS[0] };
                                loadUserData(u.uid);
                                view.value = 'lobby';
                            } else {
                                user.value = null;
                                view.value = 'auth';
                            }
                        });
                        unsubscribers.push(unsub);
                    } catch (e) {
                        console.error('Auth error:', e);
                    }
                }
                
                setupKeyboardShortcuts();
            });
            
            onUnmounted(() => {
                unsubscribers.forEach(u => u?.());
                if (keyboardHandler) window.removeEventListener('keydown', keyboardHandler);
            });
            
            // 认证方法
            const handleAuth = async () => {
                try {
                    const { email, password, name } = form.value;
                    if (view.value === 'auth') {
                        // 登录逻辑
                        await auth.signInWithEmailAndPassword(email, password);
                    } else {
                        // 注册逻辑
                        const res = await auth.createUserWithEmailAndPassword(email, password);
                        await db.collection('users').doc(res.user.uid).set({
                            name, email, avatar: AVATARS[0], friends: [], lang: lang.value
                        });
                    }
                    form.value = { name: '', email: '', password: '' };
                } catch (e) {
                    Utils.toast?.(e.message, 'error');
                }
            };
            
            const handleGoogleLogin = async () => {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    const res = await auth.signInWithPopup(provider);
                    const doc = await db.collection('users').doc(res.user.uid).get();
                    if (!doc.exists) {
                        await db.collection('users').doc(res.user.uid).set({
                            name: res.user.displayName || 'User',
                            email: res.user.email,
                            avatar: res.user.photoURL || AVATARS[0],
                            friends: [],
                            lang: 'en'
                        });
                    }
                } catch (e) {
                    console.error('Google login failed:', e);
                }
            };
            
            // 数据加载
            const loadUserData = (uid) => {
                // 用户数据
                unsubscribers.push(db.collection('users').doc(uid).onSnapshot(d => {
                    if (d.exists) {
                        const data = d.data();
                        user.value = { uid, ...data };
                        if (data.lang) lang.value = data.lang;
                        if (data.friends) loadFriends(data.friends);
                    }
                }));
                
                // 实验室列表
                unsubscribers.push(db.collection('labs').onSnapshot(snap => {
                    labs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }));
                
                // 个人收藏
                unsubscribers.push(db.collection('users').doc(uid).collection('repo').onSnapshot(snap => {
                    collection.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }));
            };
            
            const loadFriends = async (ids) => {
                if (!ids.length) {
                    friendsList.value = [];
                    return;
                }
                try {
                    const docs = await Promise.all(ids.map(id => db.collection('users').doc(id).get()));
                    friendsList.value = docs.map(d => ({ uid: d.id, ...d.data() }));
                } catch (e) {
                    console.error('Failed to load friends:', e);
                }
            };
            
            // 实验室操作
            const createLab = async () => {
                if (!newLabName.value.trim()) return Utils.toast?.('Please enter name', 'error');
                try {
                    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const ref = await db.collection('labs').add({
                        title: newLabName.value,
                        isPublic: false,
                        password: '',
                        ownerId: user.value.uid,
                        ownerName: user.value.name,
                        code,
                        elements: [],
                        connections: [],
                        members: [user.value.uid],
                        createdAt: Date.now()
                    });
                    newLabName.value = '';
                    showCreateModal.value = false;
                    enterLab({ id: ref.id, title: newLabName.value, ownerId: user.value.uid });
                } catch (e) {
                    Utils.toast?.(e.message, 'error');
                }
            };
            
            const enterLab = async (lab) => {
                if (!lab?.id) return;
                currentLab.value = lab;
                elements.value = [];
                connections.value = [];
                camera.x = 0;
                camera.y = 0;
                camera.z = 1;
                view.value = 'lab';
                
                try {
                    unsubscribers.push(db.collection('labs').doc(lab.id).onSnapshot(doc => {
                        if (doc.exists) {
                            const d = doc.data();
                            currentLab.value = { id: doc.id, ...d };
                            if (!drag.active || elements.value.length === 0) {
                                elements.value = d.elements || [];
                                connections.value = d.connections || [];
                            }
                        }
                    }));
                } catch (e) {
                    Utils.toast?.(e.message, 'error');
                }
            };
            
            const exitLab = () => {
                view.value = 'lobby';
                currentLab.value = null;
            };
            
            const saveLab = Utils.debounce?.(() => {
                if (!currentLab.value) return;
                db.collection('labs').doc(currentLab.value.id).update({
                    elements: elements.value,
                    connections: connections.value
                });
            }, 500);
            
            // UI操作
            const addElement = (type) => {
                const id = Utils.generateId?.();
                const el = {
                    id,
                    type,
                    x: 100,
                    y: 100,
                    w: 200,
                    h: 150
                };
                elements.value.push(el);
                saveLab();
            };
            
            const deleteEl = (id) => {
                elements.value = elements.value.filter(e => e.id !== id);
                saveLab();
            };
            
            // 快捷键
            const setupKeyboardShortcuts = () => {
                keyboardHandler = (e) => {
                    if (view.value !== 'lab') return;
                    if (e.ctrlKey || e.metaKey) {
                        if (e.key === 'z') { e.preventDefault(); undo(); }
                        if (e.key === 'y') { e.preventDefault(); redo(); }
                    }
                    if (e.key === 'Delete') {
                        e.preventDefault();
                        // 删除选中元素
                    }
                };
                window.addEventListener('keydown', keyboardHandler);
            };
            
            const undo = () => {
                if (historyIndex.value > 0) {
                    historyIndex.value--;
                    saveLab();
                }
            };
            
            const redo = () => {
                if (historyIndex.value < history.value.length - 1) {
                    historyIndex.value++;
                    saveLab();
                }
            };
            
            // 导出
            const logout = () => {
                auth.signOut().then(() => window.location.reload());
            };
            
            return {
                // 状态
                view, user, tempUser, lang, t, labs, collection, friendsList, currentLab, elements, connections,
                camera, showChat, messages, showCreateModal, showProfileModal, form, newLabName, joinCode, drag, history,
                // 方法
                handleAuth, handleGoogleLogin, createLab, enterLab, exitLab, addElement, deleteEl, saveLab,
                undo, redo, logout
            };
        }
    }).mount('#app');
}

// 辅助函数
async function waitForDeps(maxWait = 10000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        if (typeof Vue !== 'undefined' && window.DICT && window.Utils && window.db && window.auth) {
            return true;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error('Dependencies timeout');
}

function hideLoadingScreen() {
    const el = document.getElementById('loading-screen');
    if (el) el.style.display = 'none';
}

function showError(msg) {
    const el = document.getElementById('loading-screen');
    if (el) el.innerHTML = `<div class="text-red-500 text-center"><p class="text-xl font-bold">⚠️ ${msg}</p></div>`;
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    initApp().catch(e => showError(e.message));
});
