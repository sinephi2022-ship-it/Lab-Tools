/**
 * LabMate Pro - Configuration & Initialization
 * Firebase Setup, Global Utils, i18n
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
    authDomain: "labtool-5eb5e.firebaseapp.com",
    projectId: "labtool-5eb5e",
    storageBucket: "labtool-5eb5e.firebasestorage.app",
    messagingSenderId: "686046008242",
    appId: "1:686046008242:web:b5516ebf4eedea5afa4aab",
    measurementId: "G-86F1TSWE56"
};

// Initialize Firebase with retry logic
(async function initFirebase() {
    let retries = 0;
    const maxRetries = 50;
    
    while (typeof firebase === 'undefined' && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase failed to load');
        return;
    }
    
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log('✅ Firebase initialized');
    } catch (error) {
        console.error('Firebase init error:', error);
    }
})();

// ============================================
// MULTILINGUAL DICTIONARY (i18n)
// ============================================
window.DICT = {
    zh: {
        // Auth
        welcome: "LabMate 实验室助手",
        login: "登录",
        signup: "注册",
        email: "邮箱",
        password: "密码",
        name: "昵称",
        
        // Lobby
        myLabs: "我的实验",
        publicLabs: "公开大厅",
        collection: "个人收藏",
        friends: "好友列表",
        createLab: "创建新实验",
        labName: "实验名称",
        passOpt: "访问密码 (可选)",
        create: "立即创建",
        cancel: "取消",
        
        // Chat
        chat: "消息",
        typeMsg: "输入消息...",
        send: "发送",
        
        // Profile
        editProfile: "编辑资料",
        save: "保存修改",
        logout: "退出登录",
        
        // Lab
        upload: "上传文件",
        share: "分享",
        delete: "删除",
        copy: "复制",
        
        // Elements
        timer: "计时器",
        note: "便签",
        protocol: "流程表",
        text: "标题",
        line: "连线",
        tools: "工具栏",
        editing: "编辑中",
        content: "内容",
        color: "颜色",
        elements: "元素数",
        selected: "已选中",
        zoomFit: "适应视图",
        
        // States
        setPublic: "设为公开",
        setPrivate: "设为私有",
        isPublic: "公开",
        isPrivate: "私有",
        
        // Protocol
        step: "步骤",
        start: "开始",
        pause: "暂停",
        reset: "重置",
        
        // General
        loading: "加载中...",
        noData: "暂无数据",
        enterPass: "请输入实验室密码",
        wrongPass: "密码错误",
        
        // File types
        image: "图片",
        file: "文件",
        voice: "语音",
        
        // Actions
        exportReport: "导出报告",
        dropHere: "拖拽文件到此处",
        confirmDel: "确定要删除吗？",
        deleted: "已删除",
        sent: "已发送",
        saved: "已保存",
        added: "已添加",
        
        // Settings
        language: "语言",
        nickname: "昵称",
        avatar: "头像",
        changeAvatar: "更改头像",
        selectShareTarget: "选择分享目标"
    },
    
    en: {
        welcome: "LabMate Assistant",
        login: "Login",
        signup: "Sign Up",
        email: "Email",
        password: "Password",
        name: "Name",
        myLabs: "My Labs",
        publicLabs: "Public Hall",
        collection: "Collection",
        friends: "Friends",
        createLab: "Create Lab",
        labName: "Lab Name",
        passOpt: "Password (Optional)",
        create: "Create",
        cancel: "Cancel",
        chat: "Chat",
        typeMsg: "Type message...",
        send: "Send",
        editProfile: "Edit Profile",
        save: "Save",
        logout: "Logout",
        upload: "Upload",
        share: "Share",
        delete: "Delete",
        copy: "Copy",
        timer: "Timer",
        note: "Note",
        protocol: "Protocol",
        text: "Text",
        line: "Line",
        tools: "Tools",
        editing: "Editing",
        content: "Content",
        color: "Color",
        elements: "Elements",
        selected: "Selected",
        zoomFit: "Zoom to Fit",
        setPublic: "Make Public",
        setPrivate: "Make Private",
        isPublic: "Public",
        isPrivate: "Private",
        step: "Step",
        start: "Start",
        pause: "Pause",
        reset: "Reset",
        loading: "Loading...",
        noData: "No Data",
        enterPass: "Enter Password",
        wrongPass: "Wrong Password",
        image: "Image",
        file: "File",
        voice: "Voice",
        exportReport: "Export Report",
        dropHere: "Drop files here",
        confirmDel: "Are you sure?",
        deleted: "Deleted",
        sent: "Sent",
        saved: "Saved",
        added: "Added",
        language: "Language",
        nickname: "Nickname",
        avatar: "Avatar",
        changeAvatar: "Change Avatar",
        selectShareTarget: "Select Share Target"
    },
    
    ja: {
        welcome: "LabMate ラボ助手",
        login: "ログイン",
        signup: "登録",
        email: "メール",
        password: "パスワード",
        name: "名前",
        myLabs: "マイラボ",
        publicLabs: "公開広場",
        collection: "コレクション",
        friends: "友達",
        createLab: "ラボ作成",
        labName: "ラボ名",
        passOpt: "パスワード (任意)",
        create: "作成",
        cancel: "キャンセル",
        chat: "チャット",
        typeMsg: "入力...",
        send: "送信",
        editProfile: "プロフィール編集",
        save: "保存",
        logout: "ログアウト",
        upload: "アップロード",
        share: "共有",
        delete: "削除",
        copy: "コピー",
        timer: "タイマー",
        note: "メモ",
        protocol: "手順書",
        text: "見出し",
        line: "接続線",
        tools: "ツール",
        editing: "編集中",
        content: "内容",
        color: "色",
        elements: "要素数",
        selected: "選択中",
        zoomFit: "フィット表示",
        setPublic: "公開する",
        setPrivate: "非公開にする",
        isPublic: "公開",
        isPrivate: "非公開",
        step: "手順",
        start: "開始",
        pause: "一時停止",
        reset: "リセット",
        loading: "読込中...",
        noData: "データなし",
        enterPass: "パスワードを入力",
        wrongPass: "パスワードが違います",
        image: "画像",
        file: "ファイル",
        voice: "音声",
        exportReport: "レポート出力",
        dropHere: "ここにドロップ",
        confirmDel: "削除しますか？",
        deleted: "削除しました",
        sent: "送信しました",
        saved: "保存しました",
        added: "追加しました",
        language: "言語",
        nickname: "ニックネーム",
        avatar: "アバター",
        changeAvatar: "アバター変更",
        selectShareTarget: "共有先を選択"
    }
};

// ============================================
// GLOBAL UTILITIES
// ============================================
window.Utils = {
    // Generate unique IDs
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    },
    
    // Compress image before upload
    compressImage: (file, quality = 0.7, maxWidth = 800) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => reject(new Error('Image load failed'));
            };
            reader.onerror = () => reject(new Error('File read failed'));
        });
    },
    
    // Convert file to Base64
    fileToB64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('File read failed'));
        });
    },
    
    // Format seconds to MM:SS
    formatTime: (seconds) => {
        if (seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },
    
    // Debounce function
    debounce: (fn, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), wait);
        };
    },
    
    // Toast notification
    toast: (msg, type = 'info') => {
        const div = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800';
        div.className = `fixed top-6 left-1/2 transform -translate-x-1/2 z-[10000] px-6 py-3 rounded-full shadow-lg text-white font-bold ${bgColor}`;
        div.textContent = msg;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.3s';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    },
    
    // Export to Word
    exportWord: (title, html) => {
        const pre = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>';
        const post = '</body></html>';
        const blob = new Blob(['\ufeff', pre + html + post], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}_Report.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// ============================================
// AVATAR LIBRARY
// ============================================
window.AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate0',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate6',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=LabMate7',
];

console.log('✅ Config loaded - Firebase, i18n, Utils ready');
