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
                <div v-else-if="view === 'lobby'" class="flex-1 overflow-auto bg-gray-50">
                    <div class="max-w-6xl mx-auto px-6 py-6">
                        <!-- Lobby Tabs -->
                        <div class="flex gap-2 bg-white rounded-lg p-2 mb-6 shadow-sm">
                            <button @click="lobbyTab = 'myLabs'" class="flex-1 px-4 py-2 rounded font-bold transition" :class="{ 'bg-blue-600 text-white': lobbyTab === 'myLabs', 'text-gray-600 hover:bg-gray-100': lobbyTab !== 'myLabs' }">
                                <i class="fa-solid fa-flask"></i> {{ t('myLabs') }}
                            </button>
                            <button @click="lobbyTab = 'publicLabs'" class="flex-1 px-4 py-2 rounded font-bold transition" :class="{ 'bg-blue-600 text-white': lobbyTab === 'publicLabs', 'text-gray-600 hover:bg-gray-100': lobbyTab !== 'publicLabs' }">
                                <i class="fa-solid fa-globe"></i> {{ t('publicLabs') }}
                            </button>
                            <button @click="lobbyTab = 'favorites'" class="flex-1 px-4 py-2 rounded font-bold transition" :class="{ 'bg-blue-600 text-white': lobbyTab === 'favorites', 'text-gray-600 hover:bg-gray-100': lobbyTab !== 'favorites' }">
                                <i class="fa-solid fa-star"></i> {{ t('favorites') }}
                            </button>
                            <button @click="lobbyTab = 'friends'" class="flex-1 px-4 py-2 rounded font-bold transition" :class="{ 'bg-blue-600 text-white': lobbyTab === 'friends', 'text-gray-600 hover:bg-gray-100': lobbyTab !== 'friends' }">
                                <i class="fa-solid fa-users"></i> {{ t('friends') }}
                            </button>
                        </div>
                        
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold">
                                <i v-if="lobbyTab === 'myLabs'" class="fa-solid fa-flask mr-2"></i>
                                <i v-if="lobbyTab === 'publicLabs'" class="fa-solid fa-globe mr-2"></i>
                                <i v-if="lobbyTab === 'favorites'" class="fa-solid fa-star mr-2"></i>
                                <i v-if="lobbyTab === 'friends'" class="fa-solid fa-users mr-2"></i>
                                {{ lobbyTab === 'myLabs' ? t('myLabs') : lobbyTab === 'publicLabs' ? t('publicLabs') : lobbyTab === 'favorites' ? t('favorites') : t('friends') }}
                            </h2>
                            <div class="flex gap-3">
                                <button @click="loadLabs(user.uid)" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                                    <i class="fa-solid fa-refresh"></i> {{ t('refresh') }}
                                </button>
                                <button v-if="lobbyTab === 'myLabs'" @click="showCreateLabModal = true" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                    <i class="fa-solid fa-plus"></i> {{ t('createLab') }}
                                </button>
                                <button v-if="lobbyTab === 'publicLabs'" @click="showJoinLabModal = true" class="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition">
                                    <i class="fa-solid fa-right-to-bracket"></i> {{ t('joinLab') }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- My Labs Tab -->
                        <div v-if="lobbyTab === 'myLabs'" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="lab in displayLabs" :key="lab.id" class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1" @click="enterLab(lab.id)">
                                            <h3 class="font-bold text-lg">{{ lab.title }}</h3>
                                            <p class="text-sm text-gray-600">{{ lab.ownerName }}</p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button @click.stop="toggleFavorite(lab.id)" class="transition" :class="{ 'text-yellow-500': collection?.isFavorite(lab.id), 'text-gray-400': !collection?.isFavorite(lab.id) }">
                                                <i class="fa-solid fa-star"></i>
                                            </button>
                                            <button v-if="lab.ownerId === user.uid" @click.stop="deleteLab(lab.id)" class="text-red-500 hover:text-red-700">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 mb-3">
                                        <span v-if="lab.isPublic" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{{ t('isPublic') }}</span>
                                        <span v-else class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ t('isPrivate') }}</span>
                                        <span v-if="lab.password" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"><i class="fa-solid fa-lock"></i></span>
                                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{{ lab.members?.length || 1 }} {{ t('members') }}</span>
                                    </div>
                                    <div class="text-xs text-gray-500">{{ formatDate(lab.createdAt) }}</div>
                                    <button v-if="lab.code" @click.stop="copyCode(lab.code)" class="mt-2 w-full text-xs bg-blue-50 text-blue-600 py-1 rounded hover:bg-blue-100 transition">
                                        📋 {{ t('copyCode') }}: {{ lab.code }}
                                    </button>
                                </div>
                            </div>
                            <div v-if="displayLabs.length === 0" class="text-center py-12 bg-white rounded-lg">
                                <p class="text-gray-500 text-lg">{{ t('noLabs') }}</p>
                            </div>
                        </div>
                        
                        <!-- Public Labs Tab -->
                        <div v-if="lobbyTab === 'publicLabs'" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="lab in publicLabs" :key="lab.id" class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1" @click="enterLab(lab.id)">
                                            <h3 class="font-bold text-lg">{{ lab.title }}</h3>
                                            <p class="text-sm text-gray-600">{{ lab.ownerName }}</p>
                                        </div>
                                        <button @click.stop="toggleFavorite(lab.id)" class="transition" :class="{ 'text-yellow-500': collection?.isFavorite(lab.id), 'text-gray-400': !collection?.isFavorite(lab.id) }">
                                            <i class="fa-solid fa-star"></i>
                                        </button>
                                    </div>
                                    <div class="flex gap-2 mb-3">
                                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{{ t('isPublic') }}</span>
                                        <span v-if="lab.password" class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"><i class="fa-solid fa-lock"></i></span>
                                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{{ lab.members?.length || 1 }} {{ t('members') }}</span>
                                    </div>
                                    <div class="text-xs text-gray-500 mb-3">{{ formatDate(lab.createdAt) }}</div>
                                    <button @click.stop="joinLabWithCode(lab.code)" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition text-sm font-bold">
                                        {{ t('join') }}
                                    </button>
                                </div>
                            </div>
                            <div v-if="publicLabs.length === 0" class="text-center py-12 bg-white rounded-lg">
                                <p class="text-gray-500 text-lg">{{ t('noPublicLabs') }}</p>
                            </div>
                        </div>
                        
                        <!-- Favorites Tab -->
                        <div v-if="lobbyTab === 'favorites'" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="lab in favoriteLabs" :key="lab.id" class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1" @click="enterLab(lab.id)">
                                            <h3 class="font-bold text-lg">{{ lab.title }}</h3>
                                            <p class="text-sm text-gray-600">{{ lab.ownerName }}</p>
                                        </div>
                                        <button @click.stop="toggleFavorite(lab.id)" class="text-yellow-500">
                                            <i class="fa-solid fa-star"></i>
                                        </button>
                                    </div>
                                    <div class="flex gap-2 mb-3">
                                        <span v-if="lab.isPublic" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{{ t('isPublic') }}</span>
                                        <span v-else class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ t('isPrivate') }}</span>
                                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{{ lab.members?.length || 1 }} {{ t('members') }}</span>
                                    </div>
                                    <p class="text-xs text-gray-500">{{ formatDate(lab.createdAt) }}</p>
                                </div>
                            </div>
                            <div v-if="favoriteLabs.length === 0" class="text-center py-12 bg-white rounded-lg">
                                <p class="text-gray-500 text-lg">{{ t('noFavorites') }}</p>
                            </div>
                        </div>
                        
                        <!-- Friends Tab -->
                        <div v-if="lobbyTab === 'friends'" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="friend in friends" :key="friend.uid" class="bg-white rounded-lg shadow p-4">
                                    <div class="flex items-center gap-3 mb-3">
                                        <img :src="friend.avatar" :alt="friend.name" class="w-12 h-12 rounded-full">
                                        <div class="flex-1">
                                            <h3 class="font-bold">{{ friend.name }}</h3>
                                            <p class="text-xs text-gray-500">{{ friend.email }}</p>
                                        </div>
                                    </div>
                                    <button @click="openPrivateChat(friend.uid)" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm font-bold">
                                        <i class="fa-solid fa-message"></i> {{ t('message') }}
                                    </button>
                                </div>
                            </div>
                            <div v-if="friends.length === 0" class="text-center py-12 bg-white rounded-lg">
                                <p class="text-gray-500 text-lg">{{ t('noFriends') }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Create Lab Modal -->
                <div v-if="showCreateLabModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 class="text-2xl font-bold mb-4">{{ t('createLab') }}</h3>
                        <form @submit.prevent="createLab" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold mb-2">{{ t('labName') }}</label>
                                <input v-model="createLabForm.title" type="text" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold mb-2">{{ t('description') }}</label>
                                <textarea v-model="createLabForm.description" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none" rows="3"></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold mb-2">{{ t('visibility') }}</label>
                                <div class="flex gap-4">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input v-model="createLabForm.isPublic" type="radio" :value="true">
                                        <span>{{ t('isPublic') }}</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input v-model="createLabForm.isPublic" type="radio" :value="false">
                                        <span>{{ t('isPrivate') }}</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold mb-2">{{ t('password') }} ({{ t('optional') }})</label>
                                <input v-model="createLabForm.password" type="password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                            </div>
                            
                            <div class="flex gap-3 pt-4">
                                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                    {{ t('create') }}
                                </button>
                                <button @click="showCreateLabModal = false" type="button" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-400 transition">
                                    {{ t('cancel') }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Join Lab Modal -->
                <div v-if="showJoinLabModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 class="text-2xl font-bold mb-4">{{ t('joinLab') }}</h3>
                        <form @submit.prevent="joinLabByCode" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold mb-2">{{ t('inviteCode') }}</label>
                                <input v-model="joinLabCode" type="text" maxlength="6" placeholder="XXXXXX" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-center text-lg font-mono tracking-widest">
                            </div>
                            
                            <div v-if="joinLabPassword" class="space-y-2">
                                <label class="block text-sm font-semibold">{{ t('password') }}</label>
                                <input v-model="joinLabPasswordInput" type="password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                                <p class="text-xs text-gray-500">{{ t('labNeedsPassword') }}</p>
                            </div>
                            
                            <div class="flex gap-3 pt-4">
                                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                    {{ t('join') }}
                                </button>
                                <button @click="showJoinLabModal = false" type="button" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-400 transition">
                                    {{ t('cancel') }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Preview Modal -->
                <div v-if="showPreviewModal && previewContent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-auto w-full mx-4">
                        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h3 class="text-xl font-bold">{{ previewContent.title || t('preview') }}</h3>
                            <button @click="showPreviewModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        
                        <div class="p-6">
                            <!-- Image Preview -->
                            <img v-if="previewContent.type === 'image'" :src="previewContent.content" :alt="previewContent.title" class="max-w-full rounded-lg">
                            
                            <!-- File Preview -->
                            <iframe v-if="previewContent.type === 'pdf'" :src="previewContent.content" class="w-full h-[600px] rounded-lg"></iframe>
                            
                            <!-- Protocol Preview -->
                            <div v-if="previewContent.type === 'protocol'" class="space-y-2">
                                <div v-for="(step, idx) in previewContent.steps" :key="idx" class="flex gap-3 items-start">
                                    <input type="checkbox" :checked="step.done" :disabled="true" class="mt-1">
                                    <div>
                                        <p class="font-semibold">{{ step.text }}</p>
                                        <p v-if="step.note" class="text-xs text-gray-500 mt-1">📝 {{ step.note }}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Text Preview -->
                            <div v-if="previewContent.type === 'text'" class="prose" v-html="previewContent.content"></div>
                        </div>
                        
                        <div class="border-t px-6 py-4 flex gap-3 justify-end">
                            <button @click="downloadPreviewContent" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                                <i class="fa-solid fa-download"></i> {{ t('download') }}
                            </button>
                            <button @click="addPreviewToCollection" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                                <i class="fa-solid fa-bookmark"></i> {{ t('saveToCollection') }}
                            </button>
                            <button @click="sharePreviewContent" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                                <i class="fa-solid fa-share"></i> {{ t('share') }}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Lab View -->
                <div v-else-if="view === 'lab' && currentLab" class="flex-1 flex flex-col overflow-hidden">
                    <div class="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
                        <button @click="view = 'lobby'" class="text-blue-600 hover:text-blue-700 font-bold">← {{ t('myLabs') }}</button>
                        <h2 class="text-xl font-bold">{{ currentLab.title }}</h2>
                        <div class="flex gap-2 items-center">
                            <!-- Members -->
                            <div class="flex items-center gap-2">
                                <div class="flex -space-x-2">
                                    <div v-for="member in labMembers" :key="member" class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                                        {{ member.charAt(0).toUpperCase() }}
                                    </div>
                                </div>
                                <button v-if="currentLab.ownerId === user.uid" @click="showInviteMemberModal = true" 
                                    class="text-blue-600 hover:text-blue-700 text-sm font-bold">
                                    +{{ t('invite') }}
                                </button>
                            </div>
                            
                            <button @click="exportReport" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                <i class="fa-solid fa-download"></i> {{ t('exportReport') }}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Invite Member Modal -->
                    <div v-if="showInviteMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h3 class="text-2xl font-bold mb-4">{{ t('inviteMember') }}</h3>
                            <form @submit.prevent="inviteMember" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-semibold mb-2">{{ t('email') }}</label>
                                    <input v-model="inviteEmail" type="email" required
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-semibold mb-2">{{ t('role') }}</label>
                                    <select v-model="inviteRole" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                                        <option value="editor">{{ t('editor') }}</option>
                                        <option value="viewer">{{ t('viewer') }}</option>
                                    </select>
                                </div>
                                
                                <div class="flex gap-3 pt-4">
                                    <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                        {{ t('send') }}
                                    </button>
                                    <button @click="showInviteMemberModal = false" type="button" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-400 transition">
                                        {{ t('cancel') }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Canvas Area -->
                        <div ref="canvasContainer" class="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"></div>
                        
                        <!-- Right Sidebar -->
                        <div class="w-80 bg-white border-l shadow-lg flex flex-col">
                            <!-- Tab Switcher -->
                            <div class="flex border-b">
                                <button @click="sidebarTab = 'tools'" :class="sidebarTab === 'tools' ? 'bg-blue-50 border-b-2 border-blue-600' : 'hover:bg-gray-50'" class="flex-1 py-3 font-semibold text-sm">
                                    {{ t('tools') }}
                                </button>
                                <button @click="sidebarTab = 'connections'" :class="sidebarTab === 'connections' ? 'bg-blue-50 border-b-2 border-blue-600' : 'hover:bg-gray-50'" class="flex-1 py-3 font-semibold text-sm text-xs">
                                    {{ t('connections') }} ({{ connections.length }})
                                </button>
                                <button @click="sidebarTab = 'chat'" :class="sidebarTab === 'chat' ? 'bg-blue-50 border-b-2 border-blue-600' : 'hover:bg-gray-50'" class="flex-1 py-3 font-semibold text-sm">
                                    {{ t('chat') }} ({{ chatMessages.length }})
                                </button>
                            </div>
                            
                            <!-- Tools Panel -->
                            <div v-if="sidebarTab === 'tools'" class="flex-1 flex flex-col overflow-hidden">
                                <div class="px-4 py-4 border-b overflow-y-auto">
                                    <h3 class="font-bold text-lg mb-4">{{ t('tools') }}</h3>
                                    
                                    <!-- Element Creation -->
                                    <div class="mb-4">
                                        <p class="text-xs font-semibold text-gray-600 mb-2">{{ t('addElement') }}</p>
                                        <div class="grid grid-cols-2 gap-2">
                                            <button @click="addElement('note')" class="bg-yellow-100 text-yellow-700 p-2 rounded text-xs hover:bg-yellow-200 transition">
                                                <i class="fa-solid fa-sticky-note"></i> {{ t('note') }}
                                            </button>
                                            <button @click="addElement('timer')" class="bg-red-100 text-red-700 p-2 rounded text-xs hover:bg-red-200 transition">
                                                <i class="fa-solid fa-hourglass-end"></i> {{ t('timer') }}
                                            </button>
                                            <button @click="addElement('protocol')" class="bg-green-100 text-green-700 p-2 rounded text-xs hover:bg-green-200 transition">
                                                <i class="fa-solid fa-list-check"></i> {{ t('protocol') }}
                                            </button>
                                            <button @click="addElement('text')" class="bg-purple-100 text-purple-700 p-2 rounded text-xs hover:bg-purple-200 transition">
                                                <i class="fa-solid fa-font"></i> {{ t('text') }}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Canvas Controls -->
                                    <div class="mb-4">
                                        <p class="text-xs font-semibold text-gray-600 mb-2">{{ t('canvasControl') }}</p>
                                        <div class="grid grid-cols-2 gap-2">
                                            <button @click="zoomToFit" class="bg-blue-100 text-blue-700 p-2 rounded text-xs hover:bg-blue-200 transition">
                                                <i class="fa-solid fa-expand"></i> {{ t('zoomFit') }}
                                            </button>
                                            <button @click="toggleGridSnap" class="bg-indigo-100 text-indigo-700 p-2 rounded text-xs hover:bg-indigo-200 transition">
                                                <i class="fa-solid fa-grip"></i> {{ t('gridSnap') }}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Selection Tools -->
                                    <div v-if="canvasSelectedCount > 0" class="mb-4">
                                        <p class="text-xs font-semibold text-gray-600 mb-2">{{ t('selectTools') }} ({{ canvasSelectedCount }})</p>
                                        <div class="space-y-2">
                                            <button v-if="canvasSelectedCount > 1" @click="duplicateSelectedElements" class="w-full bg-orange-100 text-orange-700 p-2 rounded text-xs hover:bg-orange-200 transition">
                                                <i class="fa-solid fa-clone"></i> {{ t('duplicate') }}
                                            </button>
                                            <div v-if="canvasSelectedCount > 1" class="space-y-2">
                                                <p class="text-xs font-semibold text-gray-500">{{ t('align') }}</p>
                                                <div class="grid grid-cols-2 gap-2">
                                                    <button @click="alignSelectedElements('left')" class="bg-gray-200 text-gray-700 p-2 rounded text-xs hover:bg-gray-300 transition" title="Align Left">
                                                        <i class="fa-solid fa-align-left"></i>
                                                    </button>
                                                    <button @click="alignSelectedElements('right')" class="bg-gray-200 text-gray-700 p-2 rounded text-xs hover:bg-gray-300 transition" title="Align Right">
                                                        <i class="fa-solid fa-align-right"></i>
                                                    </button>
                                                    <button @click="alignSelectedElements('top')" class="bg-gray-200 text-gray-700 p-2 rounded text-xs hover:bg-gray-300 transition" title="Align Top">
                                                        <i class="fa-solid fa-align-center"></i>
                                                    </button>
                                                    <button @click="alignSelectedElements('bottom')" class="bg-gray-200 text-gray-700 p-2 rounded text-xs hover:bg-gray-300 transition" title="Align Bottom">
                                                        <i class="fa-solid fa-align-center"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <button @click="deleteSelectedElement" class="w-full bg-red-100 text-red-700 p-2 rounded text-xs hover:bg-red-200 transition">
                                                <i class="fa-solid fa-trash"></i> {{ t('delete') }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Element Editor -->
                                <div v-if="selectedElementId" class="flex-1 overflow-auto px-4 py-4 border-t">
                                    <h4 class="font-bold mb-3">{{ t('editing') }}</h4>
                                    <div class="space-y-3">
                                        <div>
                                            <label class="block text-sm font-semibold mb-1">{{ t('content') }}</label>
                                            <textarea v-model="editingContent" @change="updateSelectedElement" 
                                                class="w-full px-2 py-2 border border-gray-300 rounded text-xs font-mono" rows="4"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-semibold mb-1">{{ t('color') }}</label>
                                            <input v-model="editingColor" @change="updateSelectedElement" type="color" class="w-full h-10 border rounded">
                                        </div>
                                        <button @click="deleteSelectedElement" class="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm font-semibold">
                                            {{ t('delete') }}
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Canvas Info -->
                                <div class="px-4 py-4 border-t text-xs text-gray-600 mt-auto space-y-2">
                                    <p><i class="fa-solid fa-cube text-blue-600"></i> {{ t('elements') }}: {{ canvasElements.length }}</p>
                                    <p><i class="fa-solid fa-check-double text-blue-600"></i> {{ t('selected') }}: {{ canvasSelectedCount }}</p>
                                    <button @click="zoomToFit" class="mt-3 w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 text-sm font-semibold transition">
                                        <i class="fa-solid fa-expand"></i> {{ t('zoomFit') }}
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Connections Panel -->
                            <div v-else-if="sidebarTab === 'connections'" class="flex-1 flex flex-col overflow-hidden">
                                <div class="px-4 py-4 border-b">
                                    <h3 class="font-bold text-lg">{{ t('connections') }}</h3>
                                    <div class="grid grid-cols-2 gap-2 mt-3">
                                        <button @click="toggleConnectionMode" :class="isDrawingConnection ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'" 
                                            class="p-2 rounded text-xs hover:opacity-80 transition font-semibold">
                                            <i class="fa-solid fa-link"></i> {{ isDrawingConnection ? t('drawingConnection') : t('drawConnection') }}
                                        </button>
                                        <button @click="deleteSelectedConnection" v-if="selectedConnection" class="bg-red-100 text-red-700 p-2 rounded text-xs hover:bg-red-200 transition">
                                            <i class="fa-solid fa-trash"></i> {{ t('delete') }}
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Connections List -->
                                <div class="flex-1 overflow-auto px-4 py-3">
                                    <div v-if="connections.length === 0" class="text-center text-gray-400 py-6">
                                        {{ t('noConnections') }}
                                    </div>
                                    <div v-for="conn in connections" :key="conn.id" 
                                        @click="selectConnection(conn.id)"
                                        :class="selectedConnection?.id === conn.id ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'"
                                        class="p-3 mb-2 border rounded cursor-pointer transition">
                                        <div class="text-sm font-semibold text-gray-700">{{ getConnectionLabel(conn) }}</div>
                                        <div class="text-xs text-gray-500 mt-1">{{ conn.label || '(no label)' }}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Chat Panel -->
                            <div v-else-if="sidebarTab === 'chat'" class="flex-1 flex flex-col overflow-hidden">
                                <!-- Messages Area -->
                                <div class="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                                    <div v-for="msg in chatMessages" :key="msg.id" class="message-bubble border-l-4 border-blue-400 bg-white p-3 rounded-lg shadow-sm">
                                        <div class="flex items-center justify-between mb-1">
                                            <div class="text-xs font-semibold text-blue-600">{{ msg.userName }}</div>
                                            <span v-if="msg.edited" class="text-xs text-gray-400">(edited)</span>
                                        </div>
                                        
                                        <!-- Message Content -->
                                        <div class="text-sm text-gray-800 mb-2">{{ msg.content }}</div>
                                        
                                        <!-- File/Media Preview -->
                                        <div v-if="msg.type === 'file' && msg.metadata" class="mb-2 p-2 bg-gray-100 rounded text-xs">
                                            <i class="fa-solid fa-file"></i> {{ msg.metadata.fileName }}
                                            <span class="text-gray-500">({{ (msg.metadata.fileSize / 1024).toFixed(0) }}KB)</span>
                                        </div>
                                        
                                        <!-- Reactions Display -->
                                        <div v-if="msg.reactions && msg.reactions.length > 0" class="flex flex-wrap gap-1 mb-2">
                                            <button v-for="(reaction, idx) in groupReactions(msg.reactions)" :key="idx" 
                                                @click="toggleReaction(msg.id, reaction.emoji)"
                                                class="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-xs transition">
                                                {{ reaction.emoji }} {{ reaction.count }}
                                            </button>
                                        </div>
                                        
                                        <!-- Message Actions -->
                                        <div class="flex gap-2 items-center text-xs">
                                            <button @click="toggleReactionPicker(msg.id)" class="text-gray-400 hover:text-yellow-500 transition">
                                                <i class="fa-solid fa-face-smile"></i> React
                                            </button>
                                            <span class="text-gray-400">{{ formatTime(msg.timestamp) }}</span>
                                        </div>
                                        
                                        <!-- Reaction Picker (if visible) -->
                                        <div v-if="activeReactionPickerId === msg.id" class="mt-2 flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
                                            <button v-for="emoji in ['👍', '❤️', '😂', '🎉', '👏', '🚀']" :key="emoji"
                                                @click="addReactionToMessage(msg.id, emoji)"
                                                class="text-xl hover:scale-125 transition cursor-pointer">
                                                {{ emoji }}
                                            </button>
                                        </div>
                                    </div>
                                    <div v-if="chatMessages.length === 0" class="text-center text-gray-400 py-6">
                                        {{ t('noData') }}
                                    </div>
                                </div>
                                
                                <!-- Input Area -->
                                <div class="px-3 py-3 border-t bg-gray-50">
                                    <form @submit.prevent="sendChatMessage" class="flex gap-2">
                                        <input v-model="chatInput" type="text" :placeholder="t('typeMsg')"
                                            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none">
                                        <button type="button" @click="uploadChatFile" class="text-gray-600 hover:text-blue-600 transition px-2">
                                            <i class="fa-solid fa-paperclip"></i>
                                        </button>
                                        <button type="submit" class="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition font-semibold">
                                            {{ t('send') }}
                                        </button>
                                    </form>
                                    <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload">
                                </div>
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
            const sidebarTab = ref('tools');
            const chatMessages = ref([]);
            const chatInput = ref('');
            const chat = ref(null);
            const isDrawingConnection = ref(false);
            const connections = ref([]);
            const selectedConnection = ref(null);
            const createLabForm = reactive({ title: '', description: '', isPublic: true, password: '' });
            const labMembers = ref([]);
            const showInviteMemberModal = ref(false);
            const inviteEmail = ref('');
            const inviteRole = ref('editor');
            const collection = ref(null);
            const lobbyTab = ref('myLabs');
            const showJoinLabModal = ref(false);
            const joinLabCode = ref('');
            const joinLabPassword = ref(false);
            const joinLabPasswordInput = ref('');
            const publicLabs = ref([]);
            const favoriteLabs = computed(() => {
                if (collection.value) {
                    return collection.value.getFavoriteLabs(labs.value);
                }
                return [];
            });
            const friends = ref([]);
            const showPreviewModal = ref(false);
            const previewContent = ref(null);
            const currentPrivateChat = ref(null);
            const notifications = ref([]);
            const friendRequests = ref([]);
            const displayLabs = computed(() => {
                if (lobbyTab.value === 'favorites' && collection.value) {
                    return collection.value.getFavoriteLabs(labs.value);
                }
                return labs.value;
            });
            const activeReactionPickerId = ref(null);
            const fileInput = ref(null);
            
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(typeof date === 'string' ? date : date.toDate?.() || date);
                return d.toLocaleDateString(currentLang.value === 'zh' ? 'zh-CN' : 'en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                });
            };
            
            const t = (key) => {
                return DICT[currentLang.value]?.[key] || key;
            };
            
            const formatTime = (timestamp) => {
                if (!timestamp) return '';
                const date = timestamp.toDate?.() || new Date(timestamp);
                return date.toLocaleTimeString(currentLang.value === 'zh' ? 'zh-CN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
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
            
            const createLab = async () => {
                if (!createLabForm.value.title.trim()) {
                    Utils.toast('Please enter a lab name', 'error');
                    return;
                }
                
                try {
                    const labId = window.Utils.generateId();
                    const now = new Date().toISOString();
                    const labData = {
                        id: labId,
                        title: createLabForm.value.title,
                        description: createLabForm.value.description,
                        ownerId: user.value.uid,
                        ownerName: user.value.displayName || user.value.email,
                        ownerAvatar: user.value.photoURL,
                        isPublic: createLabForm.value.isPublic,
                        password: createLabForm.value.password || null,
                        members: [user.value.uid],
                        memberNames: [user.value.displayName || user.value.email],
                        createdAt: now,
                        updatedAt: now,
                        elements: [],
                        connections: [],
                        canvasState: {
                            zoom: 1,
                            offsetX: 0,
                            offsetY: 0
                        }
                    };
                    
                    await db.collection('labs').doc(labId).set(labData);
                    
                    // Add to user's labs array
                    await db.collection('users').doc(user.value.uid).update({
                        labs: firebase.firestore.FieldValue.arrayUnion(labId)
                    });
                    
                    showCreateLabModal.value = false;
                    const title = createLabForm.value.title;
                    createLabForm.value = { title: '', description: '', isPublic: true, password: '' };
                    Utils.toast(`Lab "${title}" created!`, 'success');
                    
                    // Load labs and enter new lab
                    await loadLabs(user.value.uid);
                    enterLab(labId);
                } catch (err) {
                    console.error('Create lab error:', err);
                    Utils.toast('Failed to create lab', 'error');
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
            
            const toggleFavorite = async (labId) => {
                if (!collection.value) return;
                
                try {
                    if (collection.value.isFavorite(labId)) {
                        await collection.value.removeFromFavorites(labId);
                        Utils.toast('Removed from favorites', 'success');
                    } else {
                        await collection.value.addToFavorites(labId);
                        Utils.toast('Added to favorites', 'success');
                    }
                } catch (err) {
                    console.error('Toggle favorite error:', err);
                    Utils.toast('Failed to update favorite', 'error');
                }
            };
            
            const enterLab = async (labId) => {
                try {
                    const labDoc = await db.collection('labs').doc(labId).get();
                    currentLab.value = { id: labId, ...labDoc.data() };
                    view.value = 'lab';
                    
                    // Load members
                    labMembers.value = currentLab.value.memberNames || [currentLab.value.ownerName];
                    
                    // Initialize canvas in next tick
                    await nextTick();
                    initCanvas();
                    
                    // Initialize chat
                    initChat(labId);
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const inviteMember = async () => {
                if (!inviteEmail.value.trim()) {
                    Utils.toast('Please enter email', 'error');
                    return;
                }
                
                if (!currentLab.value) return;
                
                try {
                    // Create invitation record
                    const invitationId = window.Utils.generateId();
                    const invitationData = {
                        id: invitationId,
                        labId: currentLab.value.id,
                        labTitle: currentLab.value.title,
                        fromUserId: user.value.uid,
                        fromUserName: user.value.displayName || user.value.email,
                        toEmail: inviteEmail.value,
                        role: inviteRole.value,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };
                    
                    // Save invitation
                    await db.collection('invitations').doc(invitationId).set(invitationData);
                    
                    // Send notification (would be email in production)
                    Utils.toast(`Invitation sent to ${inviteEmail.value}`, 'success');
                    
                    showInviteMemberModal.value = false;
                    inviteEmail.value = '';
                    inviteRole.value = 'editor';
                } catch (err) {
                    console.error('Invitation error:', err);
                    Utils.toast('Failed to send invitation', 'error');
                }
            };
            
            const acceptInvitation = async (invitationId, labId) => {
                try {
                    const invitationDoc = await db.collection('invitations').doc(invitationId).get();
                    const invitation = invitationDoc.data();
                    
                    // Add user to lab members
                    const labDoc = await db.collection('labs').doc(labId).get();
                    const lab = labDoc.data();
                    
                    const newMembers = [...(lab.members || []), user.value.uid];
                    const newMemberNames = [...(lab.memberNames || [lab.ownerName]), user.value.displayName || user.value.email];
                    
                    // Create members permissions
                    if (!lab.permissions) {
                        lab.permissions = {};
                    }
                    lab.permissions[user.value.uid] = invitation.role;
                    
                    await db.collection('labs').doc(labId).update({
                        members: newMembers,
                        memberNames: newMemberNames,
                        permissions: lab.permissions
                    });
                    
                    // Mark invitation as accepted
                    await db.collection('invitations').doc(invitationId).update({ status: 'accepted' });
                    
                    Utils.toast('Lab joined successfully!', 'success');
                    await loadLabs(user.value.uid);
                } catch (err) {
                    console.error('Accept invitation error:', err);
                    Utils.toast('Failed to join lab', 'error');
                }
            };
            
            const initChat = (labId) => {
                if (chat.value) {
                    chat.value.destroy();
                }
                
                chat.value = new window.LabChat(labId, user.value.uid, db, auth, DICT[currentLang.value]);
                chat.value.onMessagesChange((messages) => {
                    chatMessages.value = messages;
                });
                
                chat.value.init();
            };
            
            const sendChatMessage = async () => {
                if (!chatInput.value.trim() || !chat.value) return;
                
                try {
                    await chat.value.sendMessage(chatInput.value);
                    chatInput.value = '';
                    Utils.toast(t('sent'), 'success');
                } catch (error) {
                    Utils.toast(error.message, 'error');
                }
            };
            
            const groupReactions = (reactions) => {
                const grouped = {};
                reactions.forEach(r => {
                    if (!grouped[r.emoji]) {
                        grouped[r.emoji] = { emoji: r.emoji, count: 0 };
                    }
                    grouped[r.emoji].count++;
                });
                return Object.values(grouped);
            };
            
            const toggleReactionPicker = (messageId) => {
                activeReactionPickerId.value = activeReactionPickerId.value === messageId ? null : messageId;
            };
            
            const addReactionToMessage = async (messageId, emoji) => {
                if (!chat.value) return;
                try {
                    await chat.value.addReaction(messageId, emoji);
                    activeReactionPickerId.value = null;
                } catch (err) {
                    console.error('Add reaction error:', err);
                }
            };
            
            const toggleReaction = async (messageId, emoji) => {
                if (!chat.value) return;
                try {
                    await chat.value.addReaction(messageId, emoji);
                } catch (err) {
                    console.error('Toggle reaction error:', err);
                }
            };
            
            const uploadChatFile = () => {
                fileInput.value?.click();
            };
            
            const handleFileUpload = async (event) => {
                const file = event.target.files?.[0];
                if (!file || !chat.value) return;
                
                try {
                    Utils.toast('Uploading file...', 'info');
                    await chat.value.uploadFile(file);
                    Utils.toast('File uploaded!', 'success');
                    fileInput.value.value = '';
                } catch (err) {
                    console.error('File upload error:', err);
                    Utils.toast('Failed to upload file', 'error');
                }
            };
            
            const toggleConnectionMode = () => {
                isDrawingConnection.value = !isDrawingConnection.value;
                if (isDrawingConnection.value) {
                    Utils.toast(t('selectElement'), 'info');
                }
            };
            
            const getConnectionLabel = (conn) => {
                const fromEl = canvas.value?.getElement(conn.fromElementId);
                const toEl = canvas.value?.getElement(conn.toElementId);
                return `${fromEl?.type || '?'} → ${toEl?.type || '?'}`;
            };
            
            const selectConnection = (connId) => {
                selectedConnection.value = canvas.value?.connectionManager?.getConnection(connId);
            };
            
            const deleteSelectedConnection = () => {
                if (!selectedConnection.value || !canvas.value?.connectionManager) return;
                
                canvas.value.connectionManager.removeConnection(selectedConnection.value.id);
                connections.value = canvas.value.connectionManager.connections;
                selectedConnection.value = null;
                Utils.toast(t('deleted'), 'success');
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
                
                // Load existing connections
                if (currentLab.value?.connections && canvas.value.connectionManager) {
                    canvas.value.connectionManager.import(currentLab.value.connections);
                    connections.value = canvas.value.connectionManager.connections;
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
            
            const duplicateSelectedElements = () => {
                if (!canvas.value || canvas.value.selectedElements.size === 0) {
                    Utils.toast('No elements selected', 'info');
                    return;
                }
                
                const originalElements = Array.from(canvas.value.selectedElements)
                    .map(id => canvas.value.elements.find(e => e.id === id))
                    .filter(Boolean);
                
                canvas.value.selectedElements.clear();
                
                originalElements.forEach(original => {
                    const duplicate = window.createElement(original.type, window.Utils.generateId(), {
                        ...original,
                        id: window.Utils.generateId(),
                        x: original.x + 20,
                        y: original.y + 20
                    });
                    canvas.value.elements.push(duplicate.toJSON());
                    canvas.value.selectedElements.add(duplicate.id);
                });
                
                canvasElements.value = canvas.value.elements;
                Utils.toast('Duplicated successfully', 'success');
            };
            
            const toggleGridSnap = () => {
                if (!canvas.value) return;
                canvas.value.snapToGrid = !canvas.value.snapToGrid;
                Utils.toast(`Grid snap ${canvas.value.snapToGrid ? 'enabled' : 'disabled'}`, 'info');
            };
            
            const alignSelectedElements = (direction) => {
                if (!canvas.value || canvas.value.selectedElements.size < 2) {
                    Utils.toast('Select at least 2 elements', 'info');
                    return;
                }
                
                const selected = Array.from(canvas.value.selectedElements)
                    .map(id => canvas.value.elements.find(e => e.id === id))
                    .filter(Boolean);
                
                if (direction === 'left') {
                    const minX = Math.min(...selected.map(e => e.x));
                    selected.forEach(e => e.x = minX);
                } else if (direction === 'right') {
                    const maxX = Math.max(...selected.map(e => e.x + (e.width || 100)));
                    selected.forEach(e => e.x = maxX - (e.width || 100));
                } else if (direction === 'top') {
                    const minY = Math.min(...selected.map(e => e.y));
                    selected.forEach(e => e.y = minY);
                } else if (direction === 'bottom') {
                    const maxY = Math.max(...selected.map(e => e.y + (e.height || 60)));
                    selected.forEach(e => e.y = maxY - (e.height || 60));
                }
                
                canvasElements.value = canvas.value.elements;
                Utils.toast(`Aligned to ${direction}`, 'success');
            };
            
            const exportReport = () => {
                if (!canvas.value || !currentLab.value) return;
                
                const canvasData = canvas.value.export();
                const connectionsList = canvas.value.connectionManager ? 
                    canvas.value.connectionManager.connections.map(c => 
                        `<li>${getConnectionLabel(c)}</li>`
                    ).join('') : '';
                
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
                    ${connectionsList ? `<h3>Connections (${canvas.value.connectionManager.connections.length})</h3><ul>${connectionsList}</ul>` : ''}
                `;
                
                Utils.exportWord(currentLab.value.title, html);
            };
            
            // Watch for canvas changes and save to Firestore
            watch(() => canvasElements.value.length, Utils.debounce(async () => {
                if (!canvas.value || !currentLab.value) return;
                
                try {
                    const data = canvas.value.export();
                    const connections = canvas.value.connectionManager ? 
                        canvas.value.connectionManager.export() : [];
                    
                    await db.collection('labs').doc(currentLab.value.id).update({
                        elements: data.elements,
                        connections: connections,
                        view: data.view,
                        updatedAt: new Date()
                    });
                } catch (error) {
                    console.error('Save error:', error);
                }
            }, 300));
            
            // Watch for connection changes
            watch(() => connections.value.length, Utils.debounce(async () => {
                if (!canvas.value || !currentLab.value) return;
                
                try {
                    const connections = canvas.value.connectionManager ? 
                        canvas.value.connectionManager.export() : [];
                    
                    await db.collection('labs').doc(currentLab.value.id).update({
                        connections: connections,
                        updatedAt: new Date()
                    });
                } catch (error) {
                    console.error('Save error:', error);
                }
            }, 300));
            
            onMounted(() => {
                // Monitor auth state
                auth.onAuthStateChanged(async (u) => {
                    user.value = u;
                    if (u) {
                        // Initialize collection
                        collection.value = new window.LabCollection(u.uid, db);
                        await collection.value.init();
                        loadLabs(u.uid);
                        
                        // Load public labs and friends on entering lobby
                        if (view.value === 'lobby') {
                            await loadPublicLabs();
                            await loadFriends();
                        }
                        
                        // Load friend requests
                        await loadFriendRequests();
                        
                        // Monitor friend requests in real-time
                        db.collection('friendRequests')
                            .where('toUid', '==', u.uid)
                            .where('status', '==', 'pending')
                            .onSnapshot(snapshot => {
                                friendRequests.value = snapshot.docs.map(doc => ({
                                    id: doc.id,
                                    ...doc.data()
                                }));
                                
                                // Show notification for new requests
                                if (friendRequests.value.length > 0) {
                                    notifications.value.push({
                                        id: Date.now(),
                                        type: 'friendRequest',
                                        message: `You have ${friendRequests.value.length} friend request(s)`,
                                        createdAt: new Date(),
                                        read: false
                                    });
                                }
                            });
                        
                        // Monitor invitations (if user is invited to a lab)
                        db.collection('labInvitations')
                            .where('invitedEmail', '==', u.email)
                            .where('status', '==', 'pending')
                            .onSnapshot(snapshot => {
                                const invitations = snapshot.docs.map(doc => ({
                                    id: doc.id,
                                    ...doc.data()
                                }));
                                
                                // Show notification for new invitations
                                if (invitations.length > 0) {
                                    invitations.forEach(inv => {
                                        notifications.value.push({
                                            id: `inv_${inv.id}`,
                                            type: 'labInvitation',
                                            message: `You've been invited to "${inv.labName}" lab`,
                                            labId: inv.labId,
                                            invitationId: inv.id,
                                            createdAt: new Date(),
                                            read: false
                                        });
                                    });
                                }
                            });
                    }
                });
            });
            
            // Watch for lobby tab changes to load data
            watch(() => lobbyTab.value, async (newTab) => {
                if (newTab === 'publicLabs' && publicLabs.value.length === 0) {
                    await loadPublicLabs();
                } else if (newTab === 'friends' && friends.value.length === 0) {
                    await loadFriends();
                }
            });
            
            onUnmounted(() => {
                if (canvas.value) {
                    canvas.value.destroy();
                    canvas.value = null;
                }
                if (chat.value) {
                    chat.value.destroy();
                    chat.value = null;
                }
            });
            
            // Load public labs from Firestore
            const loadPublicLabs = async () => {
                try {
                    const snapshot = await db.collection('labs')
                        .where('isPublic', '==', true)
                        .limit(50)
                        .get();
                    
                    // Sort by createdAt in client-side
                    const labs = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data() 
                    }));
                    
                    labs.sort((a, b) => {
                        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
                        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
                        return bTime - aTime;
                    });
                    
                    publicLabs.value = labs;
                } catch (error) {
                    console.error('Error loading public labs:', error);
                    Utils.toast('Failed to load public labs', 'error');
                }
            };
            
            // Join lab by 6-digit code
            const joinLabByCode = async () => {
                if (!joinLabCode.value || joinLabCode.value.trim().length !== 6) {
                    Utils.toast(t('invalidCode'), 'error');
                    return;
                }
                
                if (!user.value) return;
                
                try {
                    // Find lab by invite code
                    const snapshot = await db.collection('labs')
                        .where('inviteCode', '==', joinLabCode.value.toUpperCase())
                        .limit(1)
                        .get();
                    
                    if (snapshot.empty) {
                        Utils.toast(t('codeNotFound'), 'error');
                        return;
                    }
                    
                    const lab = snapshot.docs[0];
                    
                    // Check if password protected
                    if (lab.data().requiresPassword) {
                        if (!joinLabPasswordInput.value) {
                            Utils.toast(t('passwordRequired'), 'error');
                            return;
                        }
                        // Simple validation - in production use proper encryption
                        if (joinLabPasswordInput.value !== lab.data().password) {
                            Utils.toast(t('incorrectPassword'), 'error');
                            return;
                        }
                    }
                    
                    // Add user to members
                    const members = lab.data().members || [];
                    if (!members.includes(user.value.uid)) {
                        members.push(user.value.uid);
                        const memberNames = lab.data().memberNames || [];
                        memberNames.push(user.value.displayName || user.value.email);
                        
                        await db.collection('labs').doc(lab.id).update({
                            members: members,
                            memberNames: memberNames,
                            updatedAt: new Date()
                        });
                    }
                    
                    // Reset form and close modal
                    joinLabCode.value = '';
                    joinLabPasswordInput.value = '';
                    showJoinLabModal.value = false;
                    
                    // Reload labs
                    await loadLabs(user.value.uid);
                    Utils.toast(t('joinedSuccessfully'), 'success');
                } catch (error) {
                    console.error('Error joining lab:', error);
                    Utils.toast('Failed to join lab', 'error');
                }
            };
            
            // Load user's friends list
            const loadFriends = async () => {
                if (!user.value) return;
                
                try {
                    const userDoc = await db.collection('users').doc(user.value.uid).get();
                    const friendIds = userDoc.data()?.friends || [];
                    
                    // Fetch friend documents
                    const friendsData = [];
                    for (const friendId of friendIds) {
                        const friendDoc = await db.collection('users').doc(friendId).get();
                        if (friendDoc.exists) {
                            friendsData.push({
                                id: friendId,
                                displayName: friendDoc.data().displayName || 'Unknown',
                                avatar: friendDoc.data().avatar || 'avatar1',
                                email: friendDoc.data().email || ''
                            });
                        }
                    }
                    friends.value = friendsData;
                } catch (error) {
                    console.error('Error loading friends:', error);
                }
            };
            
            // Open private chat with friend
            const openPrivateChat = async (friendUid, friendName) => {
                if (!user.value) return;
                
                try {
                    // Create or open private chat
                    const chatId = [user.value.uid, friendUid].sort().join('_');
                    currentPrivateChat.value = {
                        id: chatId,
                        friendUid: friendUid,
                        friendName: friendName
                    };
                    view.value = 'privateChat';
                    
                    // Load private messages
                    if (chat.value && chat.value.loadPrivateMessages) {
                        await chat.value.loadPrivateMessages(chatId);
                    }
                } catch (error) {
                    console.error('Error opening private chat:', error);
                    Utils.toast('Failed to open chat', 'error');
                }
            };
            
            // Search users
            const searchUsers = async (searchTerm) => {
                if (!searchTerm.trim()) return [];
                
                try {
                    const snapshot = await db.collection('users')
                        .where('email', '==', searchTerm.toLowerCase())
                        .get();
                    
                    return snapshot.docs
                        .map(doc => ({
                            uid: doc.id,
                            ...doc.data()
                        }))
                        .filter(u => u.uid !== user.value.uid);
                } catch (error) {
                    console.error('Search error:', error);
                    return [];
                }
            };
            
            // Send friend request
            const sendFriendRequest = async (toUid, toEmail) => {
                if (!user.value) return;
                
                try {
                    const requestId = Utils.generateId();
                    
                    await db.collection('friendRequests').doc(requestId).set({
                        id: requestId,
                        fromUid: user.value.uid,
                        fromName: user.value.displayName || user.value.email,
                        toUid: toUid,
                        toEmail: toEmail,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    
                    Utils.toast('Friend request sent!', 'success');
                } catch (error) {
                    console.error('Send friend request error:', error);
                    Utils.toast('Failed to send request', 'error');
                }
            };
            
            // Load friend requests
            const loadFriendRequests = async () => {
                if (!user.value) return;
                
                try {
                    const snapshot = await db.collection('friendRequests')
                        .where('toUid', '==', user.value.uid)
                        .where('status', '==', 'pending')
                        .get();
                    
                    return snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } catch (error) {
                    console.error('Load friend requests error:', error);
                    return [];
                }
            };
            
            // Accept friend request
            const acceptFriendRequest = async (requestId, fromUid) => {
                if (!user.value) return;
                
                try {
                    // Update both users' friend lists
                    await db.collection('users').doc(user.value.uid).update({
                        friends: firebase.firestore.FieldValue.arrayUnion(fromUid)
                    });
                    
                    await db.collection('users').doc(fromUid).update({
                        friends: firebase.firestore.FieldValue.arrayUnion(user.value.uid)
                    });
                    
                    // Update request status
                    await db.collection('friendRequests').doc(requestId).update({
                        status: 'accepted',
                        acceptedAt: new Date()
                    });
                    
                    Utils.toast('Friend request accepted!', 'success');
                    await loadFriends();
                } catch (error) {
                    console.error('Accept friend request error:', error);
                    Utils.toast('Failed to accept request', 'error');
                }
            };
            
            // Reject friend request
            const rejectFriendRequest = async (requestId) => {
                try {
                    await db.collection('friendRequests').doc(requestId).update({
                        status: 'rejected',
                        rejectedAt: new Date()
                    });
                    
                    Utils.toast('Friend request rejected', 'success');
                } catch (error) {
                    console.error('Reject friend request error:', error);
                    Utils.toast('Failed to reject request', 'error');
                }
            };
            
            // Copy code to clipboard
            const copyCode = async (code) => {
                try {
                    await navigator.clipboard.writeText(code);
                    Utils.toast(t('copied'), 'success');
                } catch (error) {
                    console.error('Error copying code:', error);
                    Utils.toast('Failed to copy code', 'error');
                }
            }
            
            // Show preview modal
            const showPreview = (content) => {
                previewContent.value = content;
                showPreviewModal.value = true;
            };
            
            // Download preview content
            const downloadPreviewContent = () => {
                if (!previewContent.value) return;
                
                try {
                    const { type, data, name } = previewContent.value;
                    
                    if (type === 'image') {
                        // Download image
                        const link = document.createElement('a');
                        link.href = data;
                        link.download = name || 'image.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else if (type === 'file') {
                        // Download file
                        const link = document.createElement('a');
                        link.href = data;
                        link.download = name || 'file.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else if (type === 'protocol') {
                        // Export protocol as text
                        const text = data;
                        const blob = new Blob([text], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = name || 'protocol.txt';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }
                    Utils.toast(t('downloaded'), 'success');
                } catch (error) {
                    console.error('Download error:', error);
                    Utils.toast('Failed to download', 'error');
                }
            };
            
            // Add preview content to collection
            const addPreviewToCollection = async () => {
                if (!previewContent.value || !collection.value) return;
                
                try {
                    // Create lab entry in collection
                    const item = {
                        id: window.Utils.generateId(),
                        title: previewContent.value.name,
                        type: previewContent.value.type,
                        data: previewContent.value.data,
                        addedAt: new Date()
                    };
                    
                    await collection.value.addToFavorites(item.id);
                    Utils.toast(t('addedToCollection'), 'success');
                    showPreviewModal.value = false;
                } catch (error) {
                    console.error('Error adding to collection:', error);
                    Utils.toast('Failed to add to collection', 'error');
                }
            };
            
            // Share preview content to chat
            const sharePreviewContent = async () => {
                if (!previewContent.value || !currentLab.value) return;
                
                try {
                    // Share to lab chat
                    const message = {
                        id: window.Utils.generateId(),
                        userId: user.value.uid,
                        userName: user.value.displayName || user.value.email,
                        content: previewContent.value.name,
                        type: previewContent.value.type,
                        fileUrl: previewContent.value.data,
                        timestamp: new Date(),
                        reactions: {}
                    };
                    
                    await db.collection('labs').doc(currentLab.value.id)
                        .collection('messages').add(message);
                    
                    Utils.toast(t('sharedToChat'), 'success');
                    showPreviewModal.value = false;
                } catch (error) {
                    console.error('Error sharing to chat:', error);
                    Utils.toast('Failed to share to chat', 'error');
                }
            };
            
            // Join lab directly from public list
            const joinLabWithCode = async (labId) => {
                if (!user.value) return;
                
                try {
                    const labDoc = await db.collection('labs').doc(labId).get();
                    if (!labDoc.exists) {
                        Utils.toast('Lab not found', 'error');
                        return;
                    }
                    
                    const lab = labDoc.data();
                    
                    // Check if already a member
                    if (lab.members && lab.members.includes(user.value.uid)) {
                        Utils.toast('Already a member', 'info');
                        return;
                    }
                    
                    // Add to members
                    const members = lab.members || [];
                    members.push(user.value.uid);
                    const memberNames = lab.memberNames || [];
                    memberNames.push(user.value.displayName || user.value.email);
                    
                    await db.collection('labs').doc(labId).update({
                        members: members,
                        memberNames: memberNames,
                        updatedAt: new Date()
                    });
                    
                    // Reload labs
                    await loadLabs(user.value.uid);
                    Utils.toast(t('joinedSuccessfully'), 'success');
                } catch (error) {
                    console.error('Error joining lab:', error);
                    Utils.toast('Failed to join lab', 'error');
                }
            };
            
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
                sidebarTab,
                chatMessages,
                chatInput,
                isDrawingConnection,
                connections,
                selectedConnection,
                t,
                formatTime,
                handleAuth,
                handleGoogleLogin,
                logout,
                createLab,
                loadLabs,
                deleteLab,
                enterLab,
                addElement,
                updateSelectedElement,
                deleteSelectedElement,
                zoomToFit,
                duplicateSelectedElements,
                toggleGridSnap,
                alignSelectedElements,
                exportReport,
                sendChatMessage,
                toggleConnectionMode,
                getConnectionLabel,
                selectConnection,
                deleteSelectedConnection,
                createLabForm,
                formatDate,
                labMembers,
                showInviteMemberModal,
                inviteEmail,
                inviteRole,
                inviteMember,
                acceptInvitation,
                collection,
                lobbyTab,
                displayLabs,
                toggleFavorite,
                friends,
                showPreviewModal,
                previewContent,
                currentPrivateChat,
                activeReactionPickerId,
                fileInput,
                groupReactions,
                toggleReactionPicker,
                addReactionToMessage,
                toggleReaction,
                uploadChatFile,
                handleFileUpload,
                loadPublicLabs,
                joinLabByCode,
                loadFriends,
                openPrivateChat,
                copyCode,
                showPreview,
                downloadPreviewContent,
                addPreviewToCollection,
                sharePreviewContent,
                joinLabWithCode,
                // New friend request and notification functions
                searchUsers,
                sendFriendRequest,
                loadFriendRequests,
                acceptFriendRequest,
                rejectFriendRequest,
                notifications,
                friendRequests
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
