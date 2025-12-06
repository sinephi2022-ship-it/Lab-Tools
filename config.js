// config.js - robust Firebase init (waits for scripts to be ready)
const firebaseConfig = {
    apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
    authDomain: "labtool-5eb5e.firebaseapp.com",
    projectId: "labtool-5eb5e",
    storageBucket: "labtool-5eb5e.firebasestorage.app",
    messagingSenderId: "686046008242",
    appId: "1:686046008242:web:b5516ebf4eedea5afa4aab",
    measurementId: "G-86F1TSWE56"
};

function initFirebaseWithRetry(maxWaitMs = 15000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            // 等待 firebase 脚本加载
            if (typeof firebase === 'undefined') {
                const elapsed = Date.now() - start;
                console.log(`⏳ Firebase script loading... ${elapsed}ms`);
                if (elapsed > maxWaitMs) {
                    const msg = 'Firebase script not loaded within timeout';
                    console.error('❌ ' + msg);
                    return reject(new Error(msg));
                }
                return setTimeout(attempt, 200);
            }

            try {
                console.log('📦 Firebase script found, initializing app...');
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    console.log('🔥 Firebase app initialized');
                }

                // 确保全局可用
                if (!window.db) window.db = firebase.firestore();
                if (!window.auth) window.auth = firebase.auth();

                console.log('✅ Firebase Ready - Firestore & Auth initialized');
                resolve();
            } catch (e) {
                console.error('❌ Firebase Init Error:', e.message || e);
                reject(e);
            }
        };

        attempt();
    });
}

// 开始初始化（不阻塞页面，其余逻辑会等待 window.db/window.auth）
console.log('🚀 Starting Firebase initialization...');
initFirebaseWithRetry().catch((err) => {
    console.error('Firebase init failed:', err.message);
});

// 多语言字典
window.DICT = {
    zh: {
        welcome: "LabMate 实验室助手", login: "登录", signup: "注册", email: "邮箱", password: "密码", name: "昵称",
        myLabs: "我的实验", publicLabs: "公开大厅", collection: "个人收藏", friends: "好友列表",
        createLab: "创建新实验", labName: "实验名称", passOpt: "访问密码 (可选)", create: "立即创建", cancel: "取消",
        chat: "消息", typeMsg: "输入消息...", send: "发送",
        editProfile: "编辑资料", save: "保存修改", logout: "退出登录",
        upload: "上传文件", share: "分享", delete: "删除", copy: "复制",
        timer: "计时器", note: "便签", protocol: "流程表", text: "标题", line: "连线",
        setPublic: "设为公开", setPrivate: "设为私有", isPublic: "公开", isPrivate: "私有",
        step: "步骤", start: "开始", pause: "暂停", reset: "重置",
        loading: "加载中...", noData: "暂无数据",
        enterPass: "请输入实验室密码", wrongPass: "密码错误",
        image: "图片", file: "文件", voice: "语音",
        exportReport: "导出报告", dropHere: "拖拽文件到此处",
        confirmDel: "确定要删除吗？", saved: "已保存", added: "已添加",
        language: "语言", nickname: "昵称", avatar: "头像", changeAvatar: "更改头像", selectShareTarget: "选择分享目标"
    },
    en: {
        welcome: "LabMate Assistant", login: "Login", signup: "Sign Up", email: "Email", password: "Password", name: "Name",
        myLabs: "My Labs", publicLabs: "Public Hall", collection: "Collection", friends: "Friends",
        createLab: "Create Lab", labName: "Lab Name", passOpt: "Password (Optional)", create: "Create", cancel: "Cancel",
        chat: "Chat", typeMsg: "Type message...", send: "Send",
        editProfile: "Edit Profile", save: "Save", logout: "Logout",
        upload: "Upload", share: "Share", delete: "Delete", copy: "Copy",
        timer: "Timer", note: "Note", protocol: "Protocol", text: "Text", line: "Line",
        setPublic: "Make Public", setPrivate: "Make Private", isPublic: "Public", isPrivate: "Private",
        step: "Step", start: "Start", pause: "Pause", reset: "Reset",
        loading: "Loading...", noData: "No Data",
        enterPass: "Enter Password", wrongPass: "Wrong Password",
        image: "Image", file: "File", voice: "Voice",
        exportReport: "Export Report", dropHere: "Drop files here",
        confirmDel: "Are you sure?", saved: "Saved", added: "Added",
        language: "Language", nickname: "Nickname", avatar: "Avatar", changeAvatar: "Change Avatar", selectShareTarget: "Select Share Target"
    },
    ja: {
        welcome: "LabMate ラボ助手", login: "ログイン", signup: "登録", email: "メール", password: "パスワード", name: "名前",
        myLabs: "マイラボ", publicLabs: "公開広場", collection: "コレクション", friends: "友達",
        createLab: "ラボ作成", labName: "ラボ名", passOpt: "パスワード (任意)", create: "作成", cancel: "キャンセル",
        chat: "チャット", typeMsg: "入力...", send: "送信",
        editProfile: "プロフィール編集", save: "保存", logout: "ログアウト",
        upload: "アップロード", share: "共有", delete: "削除", copy: "コピー",
        timer: "タイマー", note: "メモ", protocol: "手順書", text: "見出し", line: "接続線",
        setPublic: "公開する", setPrivate: "非公開にする", isPublic: "公開", isPrivate: "非公開",
        step: "手順", start: "開始", pause: "一時停止", reset: "リセット",
        loading: "読込中...", noData: "データなし",
        enterPass: "パスワードを入力", wrongPass: "パスワードが違います",
        image: "画像", file: "ファイル", voice: "音声",
        exportReport: "レポート出力", dropHere: "ここにドロップ",
        confirmDel: "削除しますか？", saved: "保存しました", added: "追加しました",
        language: "言語", nickname: "ニックネーム", avatar: "アバター", changeAvatar: "アバター変更", selectShareTarget: "共有先を選択"
    }
};

// 全局工具
window.Utils = {
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    
    // 图片压缩 (解决上传限制)
    compressImage: (file, quality = 0.6, maxW = 800) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const scale = maxW / Math.max(img.width, maxW);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => reject(new Error('Image load error'));
            };
            reader.onerror = () => reject(new Error('File read error'));
        });
    },
    
    // 文件转 Base64
    fileToB64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('File read error'));
        });
    },

    // 格式化时间
    formatTime: (s) => {
        if(s < 0) s = 0;
        const m = Math.floor(s/60).toString().padStart(2,'0');
        const sec = (s%60).toString().padStart(2,'0');
        return `${m}:${sec}`;
    },

    // 防抖
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    // 导出 Word
    exportWord: (title, contentHTML) => {
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + contentHTML + postHtml;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}_Report.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Toast 提示
    toast: (msg, type='info') => {
        const div = document.createElement('div');
        div.className = `fixed top-10 left-1/2 transform -translate-x-1/2 z-[10000] px-6 py-3 rounded-full shadow-2xl text-white font-bold transition-all duration-300 translate-y-[-50px] opacity-0 ${type==='error'?'bg-red-500':'bg-black'}`;
        div.innerText = msg;
        document.body.appendChild(div);
        setTimeout(() => div.classList.remove('translate-y-[-50px]', 'opacity-0'), 10);
        setTimeout(() => {
            div.classList.add('translate-y-[-50px]', 'opacity-0');
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }
};

// 头像库
window.AVATARS = [
    'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Molly',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Bear',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Zoey',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Jack'
];