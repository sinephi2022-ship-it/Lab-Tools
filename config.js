/**
 * LabMate Pro - Configuration & Internationalization
 * Firebase配置 + 多语言支持(中/英/日)
 * 
 * @author Sine chen
 * @version 2.0.0
 * @date 2025-12-07
 */

// ========================================
// Firebase 配置
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
    authDomain: "labtool-5eb5e.firebaseapp.com",
    projectId: "labtool-5eb5e",
    storageBucket: "labtool-5eb5e.firebasestorage.app",
    messagingSenderId: "439026642074",
    appId: "1:439026642074:web:d91c42764c1b2a8cb8a40c"
};

// 初始化 Firebase
try {
    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    console.log('✅ Firebase 初始化成功');
} catch (error) {
    console.error('❌ Firebase 初始化失败:', error);
}

// ========================================
// 国际化字典 (中文/英文/日文)
// ========================================
window.I18N = {
    zh: {
        // 认证相关
        login: '登录',
        signup: '注册',
        logout: '退出',
        email: '邮箱',
        password: '密码',
        name: '姓名',
        displayName: '昵称',
        avatar: '头像',
        language: '语言',
        
        // 实验室相关
        myLabs: '我的实验室',
        publicLabs: '公开实验室',
        createLab: '创建实验室',
        labName: '实验室名称',
        labPassword: '实验室密码',
        isPublic: '公开',
        isPrivate: '私密',
        enterLab: '进入实验室',
        deleteLab: '删除实验室',
        leaveLab: '离开实验室',
        members: '成员',
        owner: '所有者',
        
        // 画布相关
        canvas: '画布',
        elements: '元素',
        addElement: '添加元素',
        deleteElement: '删除元素',
        moveElement: '移动元素',
        resizeElement: '调整大小',
        
        // 元素类型
        note: '便签',
        timer: '计时器',
        protocol: '实验协议',
        text: '文本框',
        file: '文件',
        
        // 连接线
        connection: '连接线',
        addConnection: '添加连接',
        deleteConnection: '删除连接',
        
        // 聊天和社交
        chat: '聊天',
        friends: '好友',
        addFriend: '添加好友',
        removeFriend: '删除好友',
        sendMessage: '发送消息',
        messages: '消息',
        
        // 仓库和收藏
        collection: '收藏',
        favorites: '收藏夹',
        addToFavorites: '添加到收藏',
        removeFromFavorites: '取消收藏',
        
        // 通用操作
        save: '保存',
        cancel: '取消',
        confirm: '确认',
        delete: '删除',
        edit: '编辑',
        copy: '复制',
        paste: '粘贴',
        cut: '剪切',
        undo: '撤销',
        redo: '重做',
        
        // 提示信息
        loading: '加载中...',
        saving: '保存中...',
        saved: '已保存',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '提示',
        
        // 错误信息
        loginFailed: '登录失败',
        signupFailed: '注册失败',
        createLabFailed: '创建实验室失败',
        deleteLabFailed: '删除实验室失败',
        saveFailed: '保存失败',
        
        // 其他
        welcome: '欢迎使用 LabMate Pro',
        noLabs: '暂无实验室',
        noMessages: '暂无消息',
        noFriends: '暂无好友',
        search: '搜索',
        filter: '筛选',
        sort: '排序',
        settings: '设置',
        help: '帮助',
        about: '关于',
        version: '版本',
        
        // 时间相关
        year: '年',
        month: '月',
        day: '日',
        hour: '小时',
        minute: '分钟',
        second: '秒',
        
        // 文件相关
        upload: '上传',
        download: '下载',
        preview: '预览',
        fileName: '文件名',
        fileSize: '文件大小',
        fileType: '文件类型',
        
        // 权限相关
        permission: '权限',
        admin: '管理员',
        member: '成员',
        viewer: '查看者',
        editor: '编辑者',
        
        // Canvas 操作
        zoomIn: '放大',
        zoomOut: '缩小',
        resetZoom: '重置缩放',
        fitToScreen: '适应屏幕',
        pan: '平移',
        select: '选择',
        multiSelect: '多选',
        
        // 协议相关
        step: '步骤',
        addStep: '添加步骤',
        deleteStep: '删除步骤',
        complete: '完成',
        incomplete: '未完成',
        
        // 计时器相关
        start: '开始',
        pause: '暂停',
        reset: '重置',
        resume: '继续',
        duration: '时长',
        
        // 导出相关
        export: '导出',
        exportPDF: '导出为 PDF',
        exportImage: '导出为图片',
        exportJSON: '导出为 JSON',
        
        // 邀请相关
        invite: '邀请',
        inviteCode: '邀请码',
        joinLab: '加入实验室',
        copyCode: '复制邀请码',
        generateCode: '生成邀请码',
        
        // 好友系统
        findFriends: '查找好友',
        friendRequests: '好友请求',
        acceptRequest: '接受',
        rejectRequest: '拒绝',
        myFriends: '我的好友',
        noFriends: '暂无好友',
        noPublicLabs: '暂无公开实验室',
        noFavorites: '暂无收藏',
        
        // 刷新
        refresh: '刷新',
        join: '加入',
    },
    
    en: {
        // Authentication
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        name: 'Name',
        displayName: 'Display Name',
        avatar: 'Avatar',
        language: 'Language',
        
        // Lab related
        myLabs: 'My Labs',
        publicLabs: 'Public Labs',
        createLab: 'Create Lab',
        labName: 'Lab Name',
        labPassword: 'Lab Password',
        isPublic: 'Public',
        isPrivate: 'Private',
        enterLab: 'Enter Lab',
        deleteLab: 'Delete Lab',
        leaveLab: 'Leave Lab',
        members: 'Members',
        owner: 'Owner',
        
        // Canvas related
        canvas: 'Canvas',
        elements: 'Elements',
        addElement: 'Add Element',
        deleteElement: 'Delete Element',
        moveElement: 'Move Element',
        resizeElement: 'Resize',
        
        // Element types
        note: 'Note',
        timer: 'Timer',
        protocol: 'Protocol',
        text: 'Text',
        file: 'File',
        
        // Connections
        connection: 'Connection',
        addConnection: 'Add Connection',
        deleteConnection: 'Delete Connection',
        
        // Chat and Social
        chat: 'Chat',
        friends: 'Friends',
        addFriend: 'Add Friend',
        removeFriend: 'Remove Friend',
        sendMessage: 'Send Message',
        messages: 'Messages',
        
        // Collection
        collection: 'Collection',
        favorites: 'Favorites',
        addToFavorites: 'Add to Favorites',
        removeFromFavorites: 'Remove from Favorites',
        
        // Common actions
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        copy: 'Copy',
        paste: 'Paste',
        cut: 'Cut',
        undo: 'Undo',
        redo: 'Redo',
        
        // Notifications
        loading: 'Loading...',
        saving: 'Saving...',
        saved: 'Saved',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        
        // Error messages
        loginFailed: 'Login failed',
        signupFailed: 'Sign up failed',
        createLabFailed: 'Create lab failed',
        deleteLabFailed: 'Delete lab failed',
        saveFailed: 'Save failed',
        
        // Others
        welcome: 'Welcome to LabMate Pro',
        noLabs: 'No labs yet',
        noMessages: 'No messages',
        noFriends: 'No friends',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        settings: 'Settings',
        help: 'Help',
        about: 'About',
        version: 'Version',
        
        // Time
        year: 'Year',
        month: 'Month',
        day: 'Day',
        hour: 'Hour',
        minute: 'Minute',
        second: 'Second',
        
        // File
        upload: 'Upload',
        download: 'Download',
        preview: 'Preview',
        fileName: 'File Name',
        fileSize: 'File Size',
        fileType: 'File Type',
        
        // Permissions
        permission: 'Permission',
        admin: 'Admin',
        member: 'Member',
        viewer: 'Viewer',
        editor: 'Editor',
        
        // Canvas operations
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetZoom: 'Reset Zoom',
        fitToScreen: 'Fit to Screen',
        pan: 'Pan',
        select: 'Select',
        multiSelect: 'Multi-Select',
        
        // Protocol
        step: 'Step',
        addStep: 'Add Step',
        deleteStep: 'Delete Step',
        complete: 'Complete',
        incomplete: 'Incomplete',
        
        // Timer
        start: 'Start',
        pause: 'Pause',
        reset: 'Reset',
        resume: 'Resume',
        duration: 'Duration',
        
        // Export
        export: 'Export',
        exportPDF: 'Export as PDF',
        exportImage: 'Export as Image',
        exportJSON: 'Export as JSON',
        
        // Invite
        invite: 'Invite',
        inviteCode: 'Invite Code',
        joinLab: 'Join Lab',
        copyCode: 'Copy Code',
        generateCode: 'Generate Code',
        
        // Friend system
        findFriends: 'Find Friends',
        friendRequests: 'Friend Requests',
        acceptRequest: 'Accept',
        rejectRequest: 'Reject',
        myFriends: 'My Friends',
        noFriends: 'No friends yet',
        noPublicLabs: 'No public labs',
        noFavorites: 'No favorites',
        
        // Refresh
        refresh: 'Refresh',
        join: 'Join',
    },
    
    ja: {
        // 認証関連
        login: 'ログイン',
        signup: 'サインアップ',
        logout: 'ログアウト',
        email: 'メール',
        password: 'パスワード',
        name: '名前',
        displayName: '表示名',
        avatar: 'アバター',
        language: '言語',
        
        // ラボ関連
        myLabs: 'マイラボ',
        publicLabs: '公開ラボ',
        createLab: 'ラボを作成',
        labName: 'ラボ名',
        labPassword: 'ラボパスワード',
        isPublic: '公開',
        isPrivate: '非公開',
        enterLab: 'ラボに入る',
        deleteLab: 'ラボを削除',
        leaveLab: 'ラボから退出',
        members: 'メンバー',
        owner: 'オーナー',
        
        // キャンバス関連
        canvas: 'キャンバス',
        elements: '要素',
        addElement: '要素を追加',
        deleteElement: '要素を削除',
        moveElement: '要素を移動',
        resizeElement: 'サイズ変更',
        
        // 要素タイプ
        note: 'ノート',
        timer: 'タイマー',
        protocol: 'プロトコル',
        text: 'テキスト',
        file: 'ファイル',
        
        // 接続
        connection: '接続',
        addConnection: '接続を追加',
        deleteConnection: '接続を削除',
        
        // チャットとソーシャル
        chat: 'チャット',
        friends: '友達',
        addFriend: '友達を追加',
        removeFriend: '友達を削除',
        sendMessage: 'メッセージを送信',
        messages: 'メッセージ',
        
        // コレクション
        collection: 'コレクション',
        favorites: 'お気に入り',
        addToFavorites: 'お気に入りに追加',
        removeFromFavorites: 'お気に入りから削除',
        
        // 共通アクション
        save: '保存',
        cancel: 'キャンセル',
        confirm: '確認',
        delete: '削除',
        edit: '編集',
        copy: 'コピー',
        paste: '貼り付け',
        cut: '切り取り',
        undo: '元に戻す',
        redo: 'やり直す',
        
        // 通知
        loading: '読み込み中...',
        saving: '保存中...',
        saved: '保存しました',
        error: 'エラー',
        success: '成功',
        warning: '警告',
        info: '情報',
        
        // エラーメッセージ
        loginFailed: 'ログインに失敗しました',
        signupFailed: 'サインアップに失敗しました',
        createLabFailed: 'ラボの作成に失敗しました',
        deleteLabFailed: 'ラボの削除に失敗しました',
        saveFailed: '保存に失敗しました',
        
        // その他
        welcome: 'LabMate Proへようこそ',
        noLabs: 'ラボがありません',
        noMessages: 'メッセージがありません',
        noFriends: '友達がいません',
        search: '検索',
        filter: 'フィルター',
        sort: '並び替え',
        settings: '設定',
        help: 'ヘルプ',
        about: 'について',
        version: 'バージョン',
        
        // 時間
        year: '年',
        month: '月',
        day: '日',
        hour: '時間',
        minute: '分',
        second: '秒',
        
        // ファイル
        upload: 'アップロード',
        download: 'ダウンロード',
        preview: 'プレビュー',
        fileName: 'ファイル名',
        fileSize: 'ファイルサイズ',
        fileType: 'ファイルタイプ',
        
        // 権限
        permission: '権限',
        admin: '管理者',
        member: 'メンバー',
        viewer: '閲覧者',
        editor: '編集者',
        
        // キャンバス操作
        zoomIn: 'ズームイン',
        zoomOut: 'ズームアウト',
        resetZoom: 'ズームリセット',
        fitToScreen: '画面に合わせる',
        pan: 'パン',
        select: '選択',
        multiSelect: '複数選択',
        
        // プロトコル
        step: 'ステップ',
        addStep: 'ステップを追加',
        deleteStep: 'ステップを削除',
        complete: '完了',
        incomplete: '未完了',
        
        // タイマー
        start: '開始',
        pause: '一時停止',
        reset: 'リセット',
        resume: '再開',
        duration: '期間',
        
        // エクスポート
        export: 'エクスポート',
        exportPDF: 'PDFとしてエクスポート',
        exportImage: '画像としてエクスポート',
        exportJSON: 'JSONとしてエクスポート',
        
        // 招待
        invite: '招待',
        inviteCode: '招待コード',
        joinLab: 'ラボに参加',
        copyCode: 'コードをコピー',
        generateCode: 'コードを生成',
        
        // 友達システム
        findFriends: '友達を探す',
        friendRequests: '友達リクエスト',
        acceptRequest: '承認',
        rejectRequest: '拒否',
        myFriends: 'マイフレンド',
        noFriends: '友達がいません',
        noPublicLabs: '公開ラボがありません',
        noFavorites: 'お気に入りがありません',
        
        // 更新
        refresh: '更新',
        join: '参加',
    }
};

// ========================================
// 工具函数
// ========================================
window.Utils = {
    /**
     * 生成唯一 ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * 生成6位随机邀请码
     */
    generateCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },
    
    /**
     * 格式化日期
     */
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 小于1分钟
        if (diff < 60000) return '刚刚';
        // 小于1小时
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        // 小于1天
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        // 小于7天
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
        
        // 否则显示完整日期
        return date.toLocaleDateString('zh-CN');
    },
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 深拷贝
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * 压缩图片到 Base64
     */
    async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            return false;
        }
    },
    
    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// ========================================
// 头像库
// ========================================
window.AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=8'
];

console.log('✅ Config.js 加载完成');
