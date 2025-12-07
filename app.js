/**
 * LabMate Pro - Main Application (Vue 3)
 * 主应用程序 - 完整的实验室协作平台
 * 
 * 核心功能:
 * - 用户认证系统 (Firebase Auth + Google OAuth)
 * - 实验室大厅 (我的/公开/收藏/好友)
 * - 画布视图 (无限画布 + 实时协作)
 * - 工具栏 (元素/连接/设置)
 * - 侧边栏 (聊天/文件/成员)
 * - 国际化支持 (中/英/日)
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = Vue;

// ========================================
// 主应用
// ========================================
createApp({
    setup() {
        // ====================================
        // 状态管理
        // ====================================
        
        // 用户状态
        const user = ref(null);
        const userProfile = ref(null);
        const isLoading = ref(true);
        const currentView = ref('lobby'); // lobby | canvas
        const currentLang = ref(localStorage.getItem('lang') || 'zh');
        
        // 实验室状态
        const currentLab = ref(null);
        const myLabs = ref([]);
        const publicLabs = ref([]);
        const favoriteLabs = ref([]);
        const friendsLabs = ref([]);
        const searchQuery = ref('');
        const labFilter = ref('my'); // my | public | favorites | friends
        
        // 画布状态
        const canvasEngine = ref(null);
        const canvasElements = ref([]);
        const connections = ref([]);
        const selectedTool = ref('select'); // select | sticky | timer | protocol | text | file
        const showSidebar = ref(true);
        const sidebarTab = ref('chat'); // chat | files | members
        
        // 聊天状态
        const messages = ref([]);
        const newMessage = ref('');
        const onlineUsers = ref([]);
        
        // 模态框状态
        const showAuthModal = ref(false);
        const authMode = ref('login'); // login | signup
        const showLabModal = ref(false);
        const showSettingsModal = ref(false);
        const showShareModal = ref(false);
        
        // 表单数据
        const authForm = reactive({
            email: '',
            password: '',
            displayName: '',
            error: ''
        });
        
        const labForm = reactive({
            name: '',
            description: '',
            isPublic: false,
            tags: [],
            error: ''
        });
        
        // Firebase 监听器
        let labListener = null;
        let messagesListener = null;
        let presenceListener = null;
        
        // ====================================
        // 计算属性
        // ====================================
        
        const t = computed(() => {
            return (key) => {
                return window.I18N[currentLang.value]?.[key] || key;
            };
        });
        
        const filteredLabs = computed(() => {
            const query = searchQuery.value.toLowerCase();
            let labs = [];
            
            switch (labFilter.value) {
                case 'my':
                    labs = myLabs.value;
                    break;
                case 'public':
                    labs = publicLabs.value;
                    break;
                case 'favorites':
                    labs = favoriteLabs.value;
                    break;
                case 'friends':
                    labs = friendsLabs.value;
                    break;
            }
            
            if (!query) return labs;
            
            return labs.filter(lab => 
                lab.name.toLowerCase().includes(query) ||
                lab.description?.toLowerCase().includes(query) ||
                lab.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        });
        
        const isLabOwner = computed(() => {
            return currentLab.value && user.value && 
                   currentLab.value.owner === user.value.uid;
        });
        
        const canvasElementsCount = computed(() => {
            return {
                sticky: canvasElements.value.filter(e => e.type === 'sticky').length,
                timer: canvasElements.value.filter(e => e.type === 'timer').length,
                protocol: canvasElements.value.filter(e => e.type === 'protocol').length,
                text: canvasElements.value.filter(e => e.type === 'text').length,
                file: canvasElements.value.filter(e => e.type === 'file').length
            };
        });
        
        // ====================================
        // 认证方法
        // ====================================
        
        const handleLogin = async () => {
            try {
                authForm.error = '';
                const result = await firebase.auth().signInWithEmailAndPassword(
                    authForm.email,
                    authForm.password
                );
                console.log('✅ 登录成功:', result.user.email);
                showAuthModal.value = false;
                authForm.email = '';
                authForm.password = '';
            } catch (error) {
                console.error('❌ 登录失败:', error);
                authForm.error = getErrorMessage(error);
            }
        };
        
        const handleSignup = async () => {
            try {
                authForm.error = '';
                const result = await firebase.auth().createUserWithEmailAndPassword(
                    authForm.email,
                    authForm.password
                );
                
                // 更新用户资料
                await result.user.updateProfile({
                    displayName: authForm.displayName || authForm.email.split('@')[0]
                });
                
                // 创建用户文档
                await db.collection('users').doc(result.user.uid).set({
                    email: authForm.email,
                    displayName: authForm.displayName || authForm.email.split('@')[0],
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lang: currentLang.value
                });
                
                console.log('✅ 注册成功:', result.user.email);
                showAuthModal.value = false;
                authForm.email = '';
                authForm.password = '';
                authForm.displayName = '';
            } catch (error) {
                console.error('❌ 注册失败:', error);
                authForm.error = getErrorMessage(error);
            }
        };
        
        const handleGoogleLogin = async () => {
            try {
                authForm.error = '';
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                
                // 检查是否是新用户
                const userDoc = await db.collection('users').doc(result.user.uid).get();
                if (!userDoc.exists) {
                    await db.collection('users').doc(result.user.uid).set({
                        email: result.user.email,
                        displayName: result.user.displayName,
                        avatar: result.user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lang: currentLang.value
                    });
                }
                
                console.log('✅ Google登录成功:', result.user.email);
                showAuthModal.value = false;
            } catch (error) {
                console.error('❌ Google登录失败:', error);
                authForm.error = getErrorMessage(error);
            }
        };
        
        const handleLogout = async () => {
            if (!confirm(t.value('confirmLogout'))) return;
            
            try {
                // 离开当前实验室
                if (currentLab.value) {
                    await leaveLab();
                }
                
                await firebase.auth().signOut();
                console.log('✅ 退出登录成功');
                currentView.value = 'lobby';
            } catch (error) {
                console.error('❌ 退出登录失败:', error);
            }
        };
        
        const getErrorMessage = (error) => {
            const messages = {
                'auth/email-already-in-use': t.value('emailInUse'),
                'auth/invalid-email': t.value('invalidEmail'),
                'auth/weak-password': t.value('weakPassword'),
                'auth/user-not-found': t.value('userNotFound'),
                'auth/wrong-password': t.value('wrongPassword'),
                'auth/popup-closed-by-user': t.value('popupClosed')
            };
            return messages[error.code] || error.message;
        };
        
        // ====================================
        // 实验室方法
        // ====================================
        
        const loadMyLabs = async () => {
            if (!user.value) return;
            
            try {
                const snapshot = await db.collection('labs')
                    .where('owner', '==', user.value.uid)
                    .orderBy('updatedAt', 'desc')
                    .get();
                
                myLabs.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }));
                
                console.log(`✅ 加载了 ${myLabs.value.length} 个实验室`);
            } catch (error) {
                console.error('❌ 加载实验室失败:', error);
            }
        };
        
        const loadPublicLabs = async () => {
            try {
                const snapshot = await db.collection('labs')
                    .where('isPublic', '==', true)
                    .orderBy('updatedAt', 'desc')
                    .limit(50)
                    .get();
                
                publicLabs.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }));
            } catch (error) {
                console.error('❌ 加载公开实验室失败:', error);
            }
        };
        
        const loadFavoriteLabs = async () => {
            if (!user.value) return;
            
            try {
                const userDoc = await db.collection('users').doc(user.value.uid).get();
                const favorites = userDoc.data()?.favorites || [];
                
                if (favorites.length === 0) {
                    favoriteLabs.value = [];
                    return;
                }
                
                const snapshot = await db.collection('labs')
                    .where(firebase.firestore.FieldPath.documentId(), 'in', favorites)
                    .get();
                
                favoriteLabs.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }));
            } catch (error) {
                console.error('❌ 加载收藏实验室失败:', error);
            }
        };
        
        const createLab = async () => {
            if (!user.value) return;
            
            try {
                labForm.error = '';
                
                const labData = {
                    name: labForm.name,
                    description: labForm.description,
                    isPublic: labForm.isPublic,
                    tags: labForm.tags,
                    owner: user.value.uid,
                    ownerName: user.value.displayName || user.value.email,
                    members: [user.value.uid],
                    elements: [],
                    connections: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('labs').add(labData);
                console.log('✅ 创建实验室成功:', docRef.id);
                
                showLabModal.value = false;
                labForm.name = '';
                labForm.description = '';
                labForm.isPublic = false;
                labForm.tags = [];
                
                await loadMyLabs();
                openLab(docRef.id);
            } catch (error) {
                console.error('❌ 创建实验室失败:', error);
                labForm.error = error.message;
            }
        };
        
        const openLab = async (labId) => {
            try {
                const labDoc = await db.collection('labs').doc(labId).get();
                if (!labDoc.exists) {
                    alert(t.value('labNotFound'));
                    return;
                }
                
                const labData = labDoc.data();
                
                // 检查访问权限
                if (!labData.isPublic && !labData.members.includes(user.value.uid)) {
                    alert(t.value('noPermission'));
                    return;
                }
                
                currentLab.value = {
                    id: labId,
                    ...labData,
                    createdAt: labData.createdAt?.toDate(),
                    updatedAt: labData.updatedAt?.toDate()
                };
                
                // 添加用户到成员列表
                if (!labData.members.includes(user.value.uid)) {
                    await db.collection('labs').doc(labId).update({
                        members: firebase.firestore.FieldValue.arrayUnion(user.value.uid)
                    });
                }
                
                currentView.value = 'canvas';
                await nextTick();
                initCanvas();
                setupRealtimeListeners();
                
                console.log('✅ 打开实验室:', labData.name);
            } catch (error) {
                console.error('❌ 打开实验室失败:', error);
                alert(t.value('openLabFailed'));
            }
        };
        
        const leaveLab = async () => {
            if (!currentLab.value) return;
            
            try {
                // 清理监听器
                if (labListener) labListener();
                if (messagesListener) messagesListener();
                if (presenceListener) presenceListener();
                
                // 更新在线状态
                await db.collection('labs').doc(currentLab.value.id)
                    .collection('presence').doc(user.value.uid).delete();
                
                currentLab.value = null;
                currentView.value = 'lobby';
                canvasEngine.value = null;
                
                console.log('✅ 离开实验室');
            } catch (error) {
                console.error('❌ 离开实验室失败:', error);
            }
        };
        
        const deleteLab = async (labId) => {
            if (!confirm(t.value('confirmDelete'))) return;
            
            try {
                await db.collection('labs').doc(labId).delete();
                console.log('✅ 删除实验室成功');
                await loadMyLabs();
            } catch (error) {
                console.error('❌ 删除实验室失败:', error);
            }
        };
        
        const toggleFavorite = async (labId) => {
            if (!user.value) return;
            
            try {
                const userRef = db.collection('users').doc(user.value.uid);
                const userDoc = await userRef.get();
                const favorites = userDoc.data()?.favorites || [];
                
                if (favorites.includes(labId)) {
                    await userRef.update({
                        favorites: firebase.firestore.FieldValue.arrayRemove(labId)
                    });
                } else {
                    await userRef.update({
                        favorites: firebase.firestore.FieldValue.arrayUnion(labId)
                    });
                }
                
                await loadFavoriteLabs();
            } catch (error) {
                console.error('❌ 切换收藏失败:', error);
            }
        };
        
        // ====================================
        // 画布方法
        // ====================================
        
        const initCanvas = () => {
            const canvas = document.getElementById('main-canvas');
            if (!canvas) {
                console.error('❌ Canvas元素未找到');
                return;
            }
            
            // 初始化画布引擎
            canvasEngine.value = new CanvasEngine(canvas);
            
            // 加载元素
            if (currentLab.value.elements) {
                canvasElements.value = currentLab.value.elements;
                currentLab.value.elements.forEach(elementData => {
                    let element;
                    switch (elementData.type) {
                        case 'sticky':
                            element = new StickyNote(elementData.x, elementData.y);
                            break;
                        case 'timer':
                            element = new Timer(elementData.x, elementData.y);
                            break;
                        case 'protocol':
                            element = new Protocol(elementData.x, elementData.y);
                            break;
                        case 'text':
                            element = new TextBox(elementData.x, elementData.y);
                            break;
                        case 'file':
                            element = new FileElement(elementData.x, elementData.y);
                            break;
                    }
                    
                    if (element) {
                        Object.assign(element, elementData);
                        canvasEngine.value.addElement(element);
                    }
                });
            }
            
            // 加载连接线
            if (currentLab.value.connections) {
                connections.value = currentLab.value.connections;
                currentLab.value.connections.forEach(conn => {
                    canvasEngine.value.addConnection(conn);
                });
            }
            
            // 监听画布事件
            canvasEngine.value.on('elementAdded', handleElementAdded);
            canvasEngine.value.on('elementUpdated', handleElementUpdated);
            canvasEngine.value.on('elementDeleted', handleElementDeleted);
            canvasEngine.value.on('connectionAdded', handleConnectionAdded);
            canvasEngine.value.on('connectionDeleted', handleConnectionDeleted);
            
            console.log('✅ Canvas引擎初始化成功');
        };
        
        const addElement = (type) => {
            if (!canvasEngine.value) return;
            
            const centerX = canvasEngine.value.canvas.width / 2;
            const centerY = canvasEngine.value.canvas.height / 2;
            const worldPos = canvasEngine.value.screenToWorld(centerX, centerY);
            
            let element;
            switch (type) {
                case 'sticky':
                    element = new StickyNote(worldPos.x, worldPos.y);
                    break;
                case 'timer':
                    element = new Timer(worldPos.x, worldPos.y);
                    break;
                case 'protocol':
                    element = new Protocol(worldPos.x, worldPos.y);
                    break;
                case 'text':
                    element = new TextBox(worldPos.x, worldPos.y);
                    break;
                case 'file':
                    element = new FileElement(worldPos.x, worldPos.y);
                    break;
            }
            
            if (element) {
                canvasEngine.value.addElement(element);
                selectedTool.value = 'select';
            }
        };
        
        const handleElementAdded = async (element) => {
            canvasElements.value.push(element);
            await syncToFirebase();
        };
        
        const handleElementUpdated = async (element) => {
            const index = canvasElements.value.findIndex(e => e.id === element.id);
            if (index !== -1) {
                canvasElements.value[index] = element;
                await syncToFirebase();
            }
        };
        
        const handleElementDeleted = async (elementId) => {
            canvasElements.value = canvasElements.value.filter(e => e.id !== elementId);
            await syncToFirebase();
        };
        
        const handleConnectionAdded = async (connection) => {
            connections.value.push(connection);
            await syncToFirebase();
        };
        
        const handleConnectionDeleted = async (connectionId) => {
            connections.value = connections.value.filter(c => c.id !== connectionId);
            await syncToFirebase();
        };
        
        const syncToFirebase = async () => {
            if (!currentLab.value) return;
            
            try {
                await db.collection('labs').doc(currentLab.value.id).update({
                    elements: canvasElements.value,
                    connections: connections.value,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('❌ 同步到Firebase失败:', error);
            }
        };
        
        // ====================================
        // 实时协作方法
        // ====================================
        
        const setupRealtimeListeners = () => {
            if (!currentLab.value) return;
            
            const labId = currentLab.value.id;
            
            // 监听实验室变化
            labListener = db.collection('labs').doc(labId).onSnapshot(doc => {
                if (!doc.exists) return;
                
                const data = doc.data();
                canvasElements.value = data.elements || [];
                connections.value = data.connections || [];
                
                // 更新画布
                if (canvasEngine.value) {
                    canvasEngine.value.elements.clear();
                    data.elements?.forEach(elementData => {
                        let element;
                        switch (elementData.type) {
                            case 'sticky':
                                element = new StickyNote(elementData.x, elementData.y);
                                break;
                            case 'timer':
                                element = new Timer(elementData.x, elementData.y);
                                break;
                            case 'protocol':
                                element = new Protocol(elementData.x, elementData.y);
                                break;
                            case 'text':
                                element = new TextBox(elementData.x, elementData.y);
                                break;
                            case 'file':
                                element = new FileElement(elementData.x, elementData.y);
                                break;
                        }
                        
                        if (element) {
                            Object.assign(element, elementData);
                            canvasEngine.value.addElement(element);
                        }
                    });
                    
                    canvasEngine.value.markDirty();
                }
            });
            
            // 监听聊天消息
            messagesListener = db.collection('labs').doc(labId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .limit(100)
                .onSnapshot(snapshot => {
                    messages.value = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toDate()
                    }));
                    
                    // 滚动到底部
                    nextTick(() => {
                        const chatBox = document.querySelector('.chat-messages');
                        if (chatBox) {
                            chatBox.scrollTop = chatBox.scrollHeight;
                        }
                    });
                });
            
            // 监听在线用户
            presenceListener = db.collection('labs').doc(labId)
                .collection('presence')
                .onSnapshot(snapshot => {
                    onlineUsers.value = snapshot.docs.map(doc => ({
                        uid: doc.id,
                        ...doc.data()
                    }));
                });
            
            // 设置自己为在线
            db.collection('labs').doc(labId).collection('presence').doc(user.value.uid).set({
                displayName: user.value.displayName || user.value.email,
                avatar: userProfile.value?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.value.uid}`,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 定期更新在线状态
            const presenceInterval = setInterval(() => {
                if (currentLab.value?.id === labId) {
                    db.collection('labs').doc(labId).collection('presence').doc(user.value.uid).update({
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    clearInterval(presenceInterval);
                }
            }, 30000); // 30秒更新一次
        };
        
        // ====================================
        // 聊天方法
        // ====================================
        
        const sendMessage = async () => {
            if (!newMessage.value.trim() || !currentLab.value) return;
            
            try {
                await db.collection('labs').doc(currentLab.value.id)
                    .collection('messages').add({
                        text: newMessage.value,
                        userId: user.value.uid,
                        userName: user.value.displayName || user.value.email,
                        userAvatar: userProfile.value?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.value.uid}`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                newMessage.value = '';
            } catch (error) {
                console.error('❌ 发送消息失败:', error);
            }
        };
        
        // ====================================
        // 国际化方法
        // ====================================
        
        const switchLanguage = (lang) => {
            currentLang.value = lang;
            localStorage.setItem('lang', lang);
            
            if (user.value) {
                db.collection('users').doc(user.value.uid).update({ lang });
            }
        };
        
        // ====================================
        // 生命周期
        // ====================================
        
        onMounted(() => {
            // 监听认证状态
            firebase.auth().onAuthStateChanged(async (firebaseUser) => {
                if (firebaseUser) {
                    user.value = firebaseUser;
                    
                    // 加载用户资料
                    const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
                    if (userDoc.exists) {
                        userProfile.value = userDoc.data();
                        if (userProfile.value.lang) {
                            currentLang.value = userProfile.value.lang;
                        }
                    }
                    
                    // 加载实验室
                    await loadMyLabs();
                    await loadPublicLabs();
                    await loadFavoriteLabs();
                } else {
                    user.value = null;
                    userProfile.value = null;
                    myLabs.value = [];
                    publicLabs.value = [];
                    favoriteLabs.value = [];
                }
                
                isLoading.value = false;
            });
            
            // 键盘快捷键
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 's':
                            e.preventDefault();
                            if (currentLab.value) {
                                syncToFirebase();
                            }
                            break;
                        case 'z':
                            e.preventDefault();
                            if (canvasEngine.value) {
                                canvasEngine.value.undo();
                            }
                            break;
                        case 'y':
                            e.preventDefault();
                            if (canvasEngine.value) {
                                canvasEngine.value.redo();
                            }
                            break;
                    }
                }
                
                // Delete键删除选中元素
                if (e.key === 'Delete' && canvasEngine.value) {
                    canvasEngine.value.deleteSelected();
                }
            });
        });
        
        onUnmounted(() => {
            // 清理监听器
            if (labListener) labListener();
            if (messagesListener) messagesListener();
            if (presenceListener) presenceListener();
        });
        
        // ====================================
        // 返回所有方法和状态
        // ====================================
        
        return {
            // 状态
            user,
            userProfile,
            isLoading,
            currentView,
            currentLang,
            currentLab,
            myLabs,
            publicLabs,
            favoriteLabs,
            friendsLabs,
            searchQuery,
            labFilter,
            canvasEngine,
            canvasElements,
            connections,
            selectedTool,
            showSidebar,
            sidebarTab,
            messages,
            newMessage,
            onlineUsers,
            showAuthModal,
            authMode,
            showLabModal,
            showSettingsModal,
            showShareModal,
            authForm,
            labForm,
            
            // 计算属性
            t,
            filteredLabs,
            isLabOwner,
            canvasElementsCount,
            
            // 认证方法
            handleLogin,
            handleSignup,
            handleGoogleLogin,
            handleLogout,
            
            // 实验室方法
            loadMyLabs,
            loadPublicLabs,
            loadFavoriteLabs,
            createLab,
            openLab,
            leaveLab,
            deleteLab,
            toggleFavorite,
            
            // 画布方法
            addElement,
            
            // 聊天方法
            sendMessage,
            
            // 国际化方法
            switchLanguage
        };
    },
    
    template: `
        <div id="app" v-cloak class="h-screen overflow-hidden bg-gray-50">
            <!-- Loading Screen -->
            <div v-if="isLoading" class="flex items-center justify-center h-screen">
                <div class="text-center">
                    <div class="loading-spinner"></div>
                    <p class="mt-4 text-gray-600">{{ t('loading') }}...</p>
                </div>
            </div>
            
            <!-- Main App -->
            <template v-else>
                <!-- ====================================== -->
                <!-- Lobby View (实验室大厅) -->
                <!-- ====================================== -->
                <div v-if="currentView === 'lobby'" class="h-screen flex flex-col">
                    <!-- Header -->
                    <header class="bg-white border-b border-gray-200 px-6 py-4">
                        <div class="flex items-center justify-between max-w-7xl mx-auto">
                            <!-- Logo -->
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-flask text-white text-xl"></i>
                                </div>
                                <h1 class="text-2xl font-bold text-gray-900">LabMate Pro</h1>
                            </div>
                            
                            <!-- User Menu -->
                            <div class="flex items-center space-x-4">
                                <!-- Language Switcher -->
                                <div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
                                    <button @click="switchLanguage('zh')" 
                                            :class="['px-3 py-1 rounded text-sm', currentLang === 'zh' ? 'bg-white shadow' : 'text-gray-600']">
                                        中文
                                    </button>
                                    <button @click="switchLanguage('en')" 
                                            :class="['px-3 py-1 rounded text-sm', currentLang === 'en' ? 'bg-white shadow' : 'text-gray-600']">
                                        EN
                                    </button>
                                    <button @click="switchLanguage('ja')" 
                                            :class="['px-3 py-1 rounded text-sm', currentLang === 'ja' ? 'bg-white shadow' : 'text-gray-600']">
                                        日本語
                                    </button>
                                </div>
                                
                                <!-- User Avatar -->
                                <div v-if="user" class="flex items-center space-x-3">
                                    <img :src="userProfile?.avatar || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user.uid}\`" 
                                         :alt="user.displayName" 
                                         class="w-10 h-10 rounded-full">
                                    <span class="text-gray-700 font-medium">{{ user.displayName || user.email }}</span>
                                    <button @click="handleLogout" class="text-gray-500 hover:text-red-500">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </button>
                                </div>
                                
                                <!-- Login Button -->
                                <button v-else @click="showAuthModal = true" 
                                        class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                                    {{ t('login') }}
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <!-- Main Content -->
                    <main class="flex-1 overflow-auto">
                        <div class="max-w-7xl mx-auto px-6 py-8">
                            <!-- Search & Filter -->
                            <div class="mb-8">
                                <div class="flex items-center space-x-4 mb-4">
                                    <div class="flex-1 relative">
                                        <input v-model="searchQuery" 
                                               type="text" 
                                               :placeholder="t('searchLabs')"
                                               class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <i class="fas fa-search absolute left-4 top-4 text-gray-400"></i>
                                    </div>
                                    
                                    <button v-if="user" @click="showLabModal = true" 
                                            class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2">
                                        <i class="fas fa-plus"></i>
                                        <span>{{ t('createLab') }}</span>
                                    </button>
                                </div>
                                
                                <!-- Filter Tabs -->
                                <div class="flex space-x-2">
                                    <button @click="labFilter = 'my'" 
                                            :class="['px-4 py-2 rounded-lg transition', labFilter === 'my' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100']">
                                        <i class="fas fa-user mr-2"></i>{{ t('myLabs') }} ({{ myLabs.length }})
                                    </button>
                                    <button @click="labFilter = 'public'" 
                                            :class="['px-4 py-2 rounded-lg transition', labFilter === 'public' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100']">
                                        <i class="fas fa-globe mr-2"></i>{{ t('publicLabs') }} ({{ publicLabs.length }})
                                    </button>
                                    <button @click="labFilter = 'favorites'" 
                                            :class="['px-4 py-2 rounded-lg transition', labFilter === 'favorites' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100']">
                                        <i class="fas fa-star mr-2"></i>{{ t('favorites') }} ({{ favoriteLabs.length }})
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Labs Grid -->
                            <div v-if="filteredLabs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div v-for="lab in filteredLabs" :key="lab.id" 
                                     class="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border border-gray-200">
                                    <div @click="openLab(lab.id)" class="p-6">
                                        <div class="flex items-start justify-between mb-3">
                                            <h3 class="text-lg font-semibold text-gray-900">{{ lab.name }}</h3>
                                            <span v-if="lab.isPublic" class="text-green-500">
                                                <i class="fas fa-globe"></i>
                                            </span>
                                        </div>
                                        
                                        <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ lab.description || t('noDescription') }}</p>
                                        
                                        <div class="flex items-center justify-between text-sm text-gray-500">
                                            <div class="flex items-center space-x-3">
                                                <span><i class="fas fa-user mr-1"></i>{{ lab.ownerName }}</span>
                                                <span><i class="fas fa-users mr-1"></i>{{ lab.members?.length || 0 }}</span>
                                            </div>
                                            
                                            <span>{{ lab.updatedAt ? new Date(lab.updatedAt).toLocaleDateString() : '' }}</span>
                                        </div>
                                        
                                        <!-- Tags -->
                                        <div v-if="lab.tags && lab.tags.length > 0" class="flex flex-wrap gap-2 mt-3">
                                            <span v-for="tag in lab.tags" :key="tag" 
                                                  class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                                {{ tag }}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                                        <button @click.stop="toggleFavorite(lab.id)" 
                                                class="p-2 text-gray-500 hover:text-yellow-500 transition">
                                            <i :class="['fas fa-star', favoriteLabs.some(l => l.id === lab.id) ? 'text-yellow-500' : '']"></i>
                                        </button>
                                        
                                        <button v-if="lab.owner === user?.uid" @click.stop="deleteLab(lab.id)" 
                                                class="p-2 text-gray-500 hover:text-red-500 transition">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Empty State -->
                            <div v-else class="text-center py-20">
                                <i class="fas fa-flask text-6xl text-gray-300 mb-4"></i>
                                <p class="text-gray-500 text-lg">{{ t('noLabs') }}</p>
                                <button v-if="user && labFilter === 'my'" @click="showLabModal = true" 
                                        class="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                                    {{ t('createFirstLab') }}
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
                
                <!-- ====================================== -->
                <!-- Canvas View (画布视图) -->
                <!-- ====================================== -->
                <div v-else-if="currentView === 'canvas'" class="h-screen flex flex-col">
                    <!-- Toolbar -->
                    <header class="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                        <!-- Left Section -->
                        <div class="flex items-center space-x-4">
                            <button @click="leaveLab" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            
                            <div class="border-l border-gray-300 h-8"></div>
                            
                            <h2 class="text-lg font-semibold text-gray-900">{{ currentLab?.name }}</h2>
                            
                            <div class="flex items-center space-x-1 text-sm text-gray-500">
                                <i class="fas fa-users"></i>
                                <span>{{ onlineUsers.length }}</span>
                            </div>
                        </div>
                        
                        <!-- Center Section - Tools -->
                        <div class="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
                            <button @click="selectedTool = 'select'" 
                                    :class="['tool-btn', selectedTool === 'select' ? 'active' : '']"
                                    :title="t('select')">
                                <i class="fas fa-mouse-pointer"></i>
                            </button>
                            
                            <div class="border-l border-gray-300 h-6"></div>
                            
                            <button @click="addElement('sticky')" 
                                    :class="['tool-btn', selectedTool === 'sticky' ? 'active' : '']"
                                    :title="t('addSticky')">
                                <i class="fas fa-sticky-note"></i>
                            </button>
                            
                            <button @click="addElement('timer')" 
                                    :class="['tool-btn', selectedTool === 'timer' ? 'active' : '']"
                                    :title="t('addTimer')">
                                <i class="fas fa-clock"></i>
                            </button>
                            
                            <button @click="addElement('protocol')" 
                                    :class="['tool-btn', selectedTool === 'protocol' ? 'active' : '']"
                                    :title="t('addProtocol')">
                                <i class="fas fa-list-check"></i>
                            </button>
                            
                            <button @click="addElement('text')" 
                                    :class="['tool-btn', selectedTool === 'text' ? 'active' : '']"
                                    :title="t('addText')">
                                <i class="fas fa-font"></i>
                            </button>
                            
                            <button @click="addElement('file')" 
                                    :class="['tool-btn', selectedTool === 'file' ? 'active' : '']"
                                    :title="t('addFile')">
                                <i class="fas fa-file"></i>
                            </button>
                        </div>
                        
                        <!-- Right Section -->
                        <div class="flex items-center space-x-2">
                            <div class="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded">
                                {{ canvasElementsCount.sticky + canvasElementsCount.timer + canvasElementsCount.protocol + canvasElementsCount.text + canvasElementsCount.file }} {{ t('elements') }}
                            </div>
                            
                            <button @click="showShareModal = true" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                <i class="fas fa-share-nodes"></i>
                            </button>
                            
                            <button @click="showSidebar = !showSidebar" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                <i :class="['fas', showSidebar ? 'fa-chevron-right' : 'fa-chevron-left']"></i>
                            </button>
                        </div>
                    </header>
                    
                    <!-- Canvas + Sidebar -->
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Canvas -->
                        <div class="flex-1 relative">
                            <canvas id="main-canvas" class="w-full h-full bg-gray-100"></canvas>
                            
                            <!-- Minimap -->
                            <div class="absolute bottom-4 right-4 w-48 h-32 bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
                                <canvas id="minimap-canvas" class="w-full h-full"></canvas>
                            </div>
                        </div>
                        
                        <!-- Sidebar -->
                        <aside v-if="showSidebar" class="w-80 bg-white border-l border-gray-200 flex flex-col">
                            <!-- Tabs -->
                            <div class="flex border-b border-gray-200">
                                <button @click="sidebarTab = 'chat'" 
                                        :class="['flex-1 px-4 py-3 text-sm font-medium transition', sidebarTab === 'chat' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50']">
                                    <i class="fas fa-comments mr-2"></i>{{ t('chat') }}
                                </button>
                                
                                <button @click="sidebarTab = 'members'" 
                                        :class="['flex-1 px-4 py-3 text-sm font-medium transition', sidebarTab === 'members' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50']">
                                    <i class="fas fa-users mr-2"></i>{{ t('members') }}
                                </button>
                            </div>
                            
                            <!-- Chat Tab -->
                            <div v-if="sidebarTab === 'chat'" class="flex-1 flex flex-col overflow-hidden">
                                <!-- Messages -->
                                <div class="flex-1 overflow-y-auto p-4 space-y-3 chat-messages">
                                    <div v-for="msg in messages" :key="msg.id" 
                                         :class="['flex items-start space-x-2', msg.userId === user?.uid ? 'flex-row-reverse space-x-reverse' : '']">
                                        <img :src="msg.userAvatar" :alt="msg.userName" class="w-8 h-8 rounded-full">
                                        <div :class="['flex-1', msg.userId === user?.uid ? 'text-right' : '']">
                                            <div class="flex items-center space-x-2 mb-1">
                                                <span class="text-xs font-medium text-gray-700">{{ msg.userName }}</span>
                                                <span class="text-xs text-gray-400">{{ msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '' }}</span>
                                            </div>
                                            <div :class="['inline-block px-3 py-2 rounded-lg text-sm', msg.userId === user?.uid ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900']">
                                                {{ msg.text }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Input -->
                                <div class="border-t border-gray-200 p-4">
                                    <div class="flex space-x-2">
                                        <input v-model="newMessage" 
                                               @keyup.enter="sendMessage"
                                               type="text" 
                                               :placeholder="t('typeMessage')"
                                               class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <button @click="sendMessage" 
                                                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Members Tab -->
                            <div v-if="sidebarTab === 'members'" class="flex-1 overflow-y-auto p-4">
                                <div class="space-y-3">
                                    <div v-for="member in onlineUsers" :key="member.uid" 
                                         class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                                        <div class="relative">
                                            <img :src="member.avatar" :alt="member.displayName" class="w-10 h-10 rounded-full">
                                            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div class="flex-1">
                                            <div class="font-medium text-gray-900">{{ member.displayName }}</div>
                                            <div class="text-xs text-gray-500">{{ t('online') }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
                
                <!-- ====================================== -->
                <!-- Modals (模态框) -->
                <!-- ====================================== -->
                
                <!-- Auth Modal -->
                <div v-if="showAuthModal" class="modal-overlay" @click.self="showAuthModal = false">
                    <div class="modal-content max-w-md">
                        <div class="modal-header">
                            <h3 class="text-xl font-semibold">{{ authMode === 'login' ? t('login') : t('signup') }}</h3>
                            <button @click="showAuthModal = false" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="modal-body">
                            <div v-if="authForm.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {{ authForm.error }}
                            </div>
                            
                            <div class="space-y-4">
                                <div v-if="authMode === 'signup'">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('displayName') }}</label>
                                    <input v-model="authForm.displayName" 
                                           type="text" 
                                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('email') }}</label>
                                    <input v-model="authForm.email" 
                                           type="email" 
                                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('password') }}</label>
                                    <input v-model="authForm.password" 
                                           type="password" 
                                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <button @click="authMode === 'login' ? handleLogin() : handleSignup()" 
                                        class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
                                    {{ authMode === 'login' ? t('login') : t('signup') }}
                                </button>
                                
                                <div class="relative">
                                    <div class="absolute inset-0 flex items-center">
                                        <div class="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div class="relative flex justify-center text-sm">
                                        <span class="px-2 bg-white text-gray-500">{{ t('or') }}</span>
                                    </div>
                                </div>
                                
                                <button @click="handleGoogleLogin" 
                                        class="w-full bg-white text-gray-700 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center space-x-2">
                                    <i class="fab fa-google text-red-500"></i>
                                    <span>{{ t('googleLogin') }}</span>
                                </button>
                                
                                <div class="text-center text-sm">
                                    <button @click="authMode = authMode === 'login' ? 'signup' : 'login'" 
                                            class="text-blue-500 hover:underline">
                                        {{ authMode === 'login' ? t('noAccount') : t('hasAccount') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Create Lab Modal -->
                <div v-if="showLabModal" class="modal-overlay" @click.self="showLabModal = false">
                    <div class="modal-content max-w-lg">
                        <div class="modal-header">
                            <h3 class="text-xl font-semibold">{{ t('createLab') }}</h3>
                            <button @click="showLabModal = false" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="modal-body">
                            <div v-if="labForm.error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {{ labForm.error }}
                            </div>
                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('labName') }}</label>
                                    <input v-model="labForm.name" 
                                           type="text" 
                                           :placeholder="t('enterLabName')"
                                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('description') }}</label>
                                    <textarea v-model="labForm.description" 
                                              :placeholder="t('enterDescription')"
                                              rows="3"
                                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                                </div>
                                
                                <div class="flex items-center">
                                    <input v-model="labForm.isPublic" 
                                           type="checkbox" 
                                           id="isPublic"
                                           class="w-4 h-4 text-blue-500 rounded">
                                    <label for="isPublic" class="ml-2 text-sm text-gray-700">{{ t('publicLab') }}</label>
                                </div>
                                
                                <button @click="createLab" 
                                        :disabled="!labForm.name"
                                        class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                                    {{ t('create') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    `
}).mount('#app');
