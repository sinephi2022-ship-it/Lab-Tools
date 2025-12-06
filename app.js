/**
 * LabMate Pro - Main Application
 * Vue 3 app with Firebase integration
 */

(async function initApp() {
    // Wait for all dependencies
    let attempts = 0;
    while ((typeof Vue === 'undefined' || typeof firebase === 'undefined' || !window.db) && attempts < 100) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    
    if (typeof Vue === 'undefined') {
        console.error('❌ Vue failed to load');
        showLoadingError('Vue.js failed to load. Please refresh.');
        return;
    }
    
    if (typeof firebase === 'undefined' || !window.db) {
        console.error('❌ Firebase failed to load');
        showLoadingError('Firebase failed to load. Please check your internet connection.');
        return;
    }
    
    console.log('✅ All dependencies loaded, starting app...');
    
    const { createApp, ref, computed, reactive, onMounted, watch, nextTick, onUnmounted } = Vue;
    const Utils = window.Utils || {};
    const DICT = window.DICT || {};
    const AVATARS = window.AVATARS || [];
    const db = window.db;
    const auth = window.auth;
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    // Create Vue app
    const app = createApp({
        template: `
            <div class="w-full h-full flex flex-col bg-white">
                <!-- Header -->
                <div v-if="user" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-md flex items-center justify-between">
                    <h1 class="text-2xl font-bold">LabMate Pro</h1>
                    <div class="flex items-center gap-4">
                        <span class="text-sm">{{ user.email }}</span>
                        <button @click="logout" class="bg-red-500 hover:bg-red-600 px-3 py-2 rounded font-bold text-sm">{{ t('logout') }}</button>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div v-if="!user" class="flex-1 flex items-center justify-center bg-gray-50 px-4">
                    <div class="w-full max-w-md">
                        <div class="bg-white rounded-2xl shadow-xl p-8">
                            <h2 class="text-3xl font-black text-center mb-6 text-blue-600">LabMate Pro</h2>
                            
                            <div class="flex justify-center gap-2 mb-6">
                                <button v-for="lang in ['zh', 'en', 'ja']" :key="lang" 
                                    @click="currentLang = lang"
                                    :class="currentLang === lang ? 'text-blue-600 font-bold' : 'text-gray-400'"
                                    class="hover:text-blue-500">
                                    {{ lang.toUpperCase() }}
                                </button>
                            </div>
                            
                            <form @submit.prevent="handleAuth" class="space-y-4">
                                <div v-if="authMode === 'signup'">
                                    <input v-model="form.name" type="text" :placeholder="t('name')" required
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500">
                                </div>
                                <input v-model="form.email" type="email" :placeholder="t('email')" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500">
                                <input v-model="form.password" type="password" :placeholder="t('password')" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500">
                                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                                    {{ authMode === 'login' ? t('login') : t('signup') }}
                                </button>
                            </form>
                            
                            <button @click="handleGoogleLogin" class="w-full mt-4 bg-white border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
                                <i class="fa-brands fa-google"></i> Continue with Google
                            </button>
                            
                            <p class="text-center mt-4 text-sm text-gray-600">
                                {{ authMode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
                                <button @click="authMode = authMode === 'login' ? 'signup' : 'login'" class="text-blue-600 font-bold">
                                    {{ authMode === 'login' ? t('signup') : t('login') }}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Lobby -->
                <div v-else-if="view === 'lobby'" class="flex-1 overflow-auto bg-gray-50 p-6">
                    <div class="max-w-6xl mx-auto">
                        <h2 class="text-2xl font-bold mb-6">{{ t('myLabs') }}</h2>
                        <button @click="showCreateLabModal = true" class="mb-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
                            {{ t('createLab') }}
                        </button>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="lab in labs" :key="lab.id" class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1" @click="enterLab(lab.id)">
                                        <h3 class="font-bold text-lg">{{ lab.title }}</h3>
                                        <p class="text-sm text-gray-600">Owner: {{ lab.ownerName }}</p>
                                        <span v-if="lab.isPublic" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{{ t('isPublic') }}</span>
                                        <span v-else class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ t('isPrivate') }}</span>
                                    </div>
                                    <button v-if="lab.ownerId === user.uid" @click.stop="deleteLab(lab.id)" class="text-red-500 hover:text-red-700">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Lab View -->
                <div v-else-if="view === 'lab' && currentLab" class="flex-1 flex flex-col overflow-hidden">
                    <div class="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
                        <button @click="view = 'lobby'" class="text-blue-600 hover:text-blue-700 font-bold">← {{ t('myLabs') }}</button>
                        <h2 class="text-xl font-bold">{{ currentLab.title }}</h2>
                        <div class="flex gap-2">
                            <button @click="exportReport" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                <i class="fa-solid fa-download"></i> {{ t('exportReport') }}
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Canvas Area -->
                        <div ref="canvasContainer" class="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"></div>
                        
                        <!-- Right Toolbar -->
                        <div class="w-64 bg-white border-l shadow-lg flex flex-col">
                            <div class="px-4 py-4 border-b">
                                <h3 class="font-bold text-lg mb-4">{{ t('tools') }}</h3>
                                <div class="grid grid-cols-2 gap-2">
                                    <button @click="addElement('note')" class="bg-blue-100 text-blue-700 p-2 rounded text-sm hover:bg-blue-200">
                                        <i class="fa-solid fa-sticky-note"></i> {{ t('note') }}
                                    </button>
                                    <button @click="addElement('timer')" class="bg-red-100 text-red-700 p-2 rounded text-sm hover:bg-red-200">
                                        <i class="fa-solid fa-hourglass-end"></i> {{ t('timer') }}
                                    </button>
                                    <button @click="addElement('protocol')" class="bg-green-100 text-green-700 p-2 rounded text-sm hover:bg-green-200">
                                        <i class="fa-solid fa-list-check"></i> {{ t('protocol') }}
                                    </button>
                                    <button @click="addElement('text')" class="bg-purple-100 text-purple-700 p-2 rounded text-sm hover:bg-purple-200">
                                        <i class="fa-solid fa-font"></i> {{ t('text') }}
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Element Editor -->
                            <div v-if="selectedElementId" class="flex-1 overflow-auto px-4 py-4">
                                <h4 class="font-bold mb-3">{{ t('editing') }}</h4>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-sm font-semibold mb-1">{{ t('content') }}</label>
                                        <textarea v-model="editingContent" @change="updateSelectedElement" 
                                            class="w-full px-2 py-2 border border-gray-300 rounded text-sm font-mono" rows="4"></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-semibold mb-1">{{ t('color') }}</label>
                                        <input v-model="editingColor" @change="updateSelectedElement" type="color" class="w-full h-10 border rounded">
                                    </div>
                                    <button @click="deleteSelectedElement" class="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm">
                                        {{ t('delete') }}
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Canvas Info -->
                            <div class="px-4 py-4 border-t text-xs text-gray-500 mt-auto">
                                <p>{{ t('elements') }}: {{ canvasElements.length }}</p>
                                <p>{{ t('selected') }}: {{ canvasSelectedCount }}</p>
                                <button @click="zoomToFit" class="mt-3 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 text-sm">
                                    {{ t('zoomFit') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        
        setup() {
            const user = ref(null);
            const currentLang = ref('en');
            const authMode = ref('login');
            const form = reactive({ name: '', email: '', password: '' });
            const view = ref('lobby');
            const labs = ref([]);
            const currentLab = ref(null);
            const showCreateLabModal = ref(false);
            const canvasContainer = ref(null);
            const canvas = ref(null);
            const canvasElements = ref([]);
            const canvasSelectedCount = computed(() => canvas.value?.selectedElements.size || 0);
            const selectedElementId = ref(null);
            const editingContent = ref('');
            const editingColor = ref('#ffffff');
            
            const t = (key) => {
                return DICT[currentLang.value]?.[key] || key;
            };
            
            const handleAuth = async () => {
                try {
                    if (authMode.value === 'login') {
                        await auth.signInWithEmailAndPassword(form.email, form.password);
                    } else {
                        const result = await auth.createUserWithEmailAndPassword(form.email, form.password);
                        await db.collection('users').doc(result.user.uid).set({
                            name: form.name,
                            email: form.email,
                            avatar: AVATARS[0],
                            lang: currentLang.value,
                            friends: [],
                            createdAt: new Date()
                        });
                    }
                    Utils.toast('Success!', 'success');
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const handleGoogleLogin = async () => {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    const result = await auth.signInWithPopup(provider);
                    
                    // Create user doc if new
                    const userDoc = await db.collection('users').doc(result.user.uid).get();
                    if (!userDoc.exists) {
                        await db.collection('users').doc(result.user.uid).set({
                            name: result.user.displayName || 'User',
                            email: result.user.email,
                            avatar: result.user.photoURL || AVATARS[0],
                            lang: currentLang.value,
                            friends: [],
                            createdAt: new Date()
                        });
                    }
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const logout = async () => {
                try {
                    await auth.signOut();
                    form.email = '';
                    form.password = '';
                    form.name = '';
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const loadLabs = async (uid) => {
                try {
                    const snapshot = await db.collection('labs').where('members', 'array-contains', uid).get();
                    labs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (error) {
                    console.error('Load labs error:', error);
                }
            };
            
            const deleteLab = async (labId) => {
                if (confirm(t('confirmDel'))) {
                    try {
                        await db.collection('labs').doc(labId).delete();
                        labs.value = labs.value.filter(l => l.id !== labId);
                        Utils.toast(t('deleted'), 'success');
                    } catch (error) {
                        Utils.toast(error.message, 'error');
                    }
                }
            };
            
            const enterLab = async (labId) => {
                try {
                    const labDoc = await db.collection('labs').doc(labId).get();
                    currentLab.value = { id: labId, ...labDoc.data() };
                    view.value = 'lab';
                    
                    // Initialize canvas in next tick
                    await nextTick();
                    initCanvas();
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const initCanvas = () => {
                if (!canvasContainer.value || canvas.value) return;
                
                canvas.value = new window.LabCanvas(canvasContainer.value);
                
                // Load existing elements from currentLab
                if (currentLab.value?.elements) {
                    canvas.value.import({
                        elements: currentLab.value.elements,
                        view: currentLab.value.view || {}
                    });
                    canvasElements.value = canvas.value.elements;
                } else {
                    canvasElements.value = [];
                }
                
                // Handle element selection
                canvas.value.onElementDoubleClick = (element) => {
                    selectedElementId.value = element.id;
                    editingContent.value = element.content || '';
                    editingColor.value = element.color || '#ffffff';
                };
            };
            
            const addElement = (type) => {
                if (!canvas.value) return;
                
                const elementId = window.Utils.generateId();
                const newEl = window.createElement(type, elementId, {
                    x: -canvas.value.panX / canvas.value.zoom + 100,
                    y: -canvas.value.panY / canvas.value.zoom + 100,
                    content: window.DICT[currentLang.value][type] || type,
                    color: { note: '#fef08a', timer: '#fca5a5', protocol: '#a7f3d0', text: '#e9d5ff', file: '#dbeafe' }[type] || '#ffffff'
                });
                
                canvas.value.elements.push(newEl.toJSON());
                canvasElements.value = canvas.value.elements;
                
                Utils.toast(t('added'), 'success');
            };
            
            const updateSelectedElement = () => {
                if (!canvas.value || !selectedElementId.value) return;
                
                canvas.value.updateElement(selectedElementId.value, {
                    content: editingContent.value,
                    color: editingColor.value
                });
                
                canvasElements.value = canvas.value.elements;
            };
            
            const deleteSelectedElement = () => {
                if (!canvas.value || !selectedElementId.value) return;
                
                canvas.value.removeElement(selectedElementId.value);
                selectedElementId.value = null;
                canvasElements.value = canvas.value.elements;
            };
            
            const zoomToFit = () => {
                if (canvas.value) {
                    canvas.value.zoomToFit();
                }
            };
            
            const exportReport = () => {
                if (!canvas.value || !currentLab.value) return;
                
                const canvasData = canvas.value.export();
                const elementsList = canvasData.elements.map(e => 
                    `<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <strong>${e.type}:</strong> ${e.content}
                    </div>`
                ).join('');
                
                const html = `
                    <h1>${currentLab.value.title}</h1>
                    <h2>Lab Report</h2>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <h3>Elements (${canvasData.elements.length})</h3>
                    ${elementsList}
                `;
                
                Utils.exportWord(currentLab.value.title, html);
            };
            
            // Watch for canvas changes and save to Firestore
            watch(() => canvasElements.value.length, Utils.debounce(async () => {
                if (!canvas.value || !currentLab.value) return;
                
                try {
                    const data = canvas.value.export();
                    await db.collection('labs').doc(currentLab.value.id).update({
                        elements: data.elements,
                        view: data.view,
                        updatedAt: new Date()
                    });
                } catch (error) {
                    console.error('Save error:', error);
                }
            }, 300));
            
            onMounted(() => {
                // Monitor auth state
                auth.onAuthStateChanged((u) => {
                    user.value = u;
                    if (u) {
                        loadLabs(u.uid);
                    }
                });
            });
            
            onUnmounted(() => {
                if (canvas.value) {
                    canvas.value.destroy();
                    canvas.value = null;
                }
            });
            
            return {
                user,
                currentLang,
                authMode,
                form,
                view,
                labs,
                currentLab,
                showCreateLabModal,
                canvasContainer,
                canvas,
                canvasElements,
                canvasSelectedCount,
                selectedElementId,
                editingContent,
                editingColor,
                t,
                handleAuth,
                handleGoogleLogin,
                logout,
                loadLabs,
                deleteLab,
                enterLab,
                addElement,
                updateSelectedElement,
                deleteSelectedElement,
                zoomToFit,
                exportReport
            };
        }
    });
    
    // Mount app
    const appEl = document.getElementById('app');
    appEl.classList.add('ready');
    app.mount(appEl);
    
    console.log('🎉 LabMate Pro started!');
})();

function showLoadingError(msg) {
    const loading = document.getElementById('loading-screen');
    if (loading) {
        loading.innerHTML = `
            <div class="text-center text-white">
                <i class="fa-solid fa-exclamation-circle text-5xl mb-4"></i>
                <p class="text-xl font-bold">Failed to Load</p>
                <p class="text-sm mt-2">${msg}</p>
            </div>
        `;
    }
}
