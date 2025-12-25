import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "labtool-5eb5e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "labtool-5eb5e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "labtool-5eb5e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "686046008242",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:686046008242:web:b5516ebf4eedea5afa4aab",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-86F1TSWE56"
}

let app
let auth
let db
let storage

try {
  // 验证配置
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase配置不完整')
  }
  
  console.log('正在初始化 Firebase...', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  })
  
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  
  // 设置认证持久化
  setPersistence(auth, browserLocalPersistence).catch(error => {
    console.warn('设置本地持久化失败，使用默认设置:', error.message)
  })
  
  console.log('Firebase初始化成功', {
    hasAuth: !!auth,
    hasDb: !!db,
    hasStorage: !!storage
  })
} catch (error) {
  console.error('Firebase初始化失败:', error)
  console.error('错误详情:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  })
  throw new Error('Firebase初始化失败: ' + error.message)
}

export { auth, db, storage, app }

// 验证Firebase是否已正确初始化
const checkFirebaseInitialized = () => {
  if (!app || !auth || !db || !storage) {
    console.error('Firebase初始化状态检查失败:', {
      app: !!app,
      auth: !!auth,
      db: !!db,
      storage: !!storage
    })
    throw new Error('Firebase未正确初始化')
  }
  return true
}

// 添加全局错误监听
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('firebase')) {
      console.error('Firebase 未处理的 Promise 拒绝:', event.reason)
      event.preventDefault()
    }
  })
}

// 导出状态检查函数
export const isFirebaseReady = () => {
  try {
    return checkFirebaseInitialized()
  } catch (error) {
    return false
  }
}

export const signIn = async () => {
  try {
    checkFirebaseInitialized()
    console.log('开始匿名登录...')
    const result = await signInAnonymously(auth)
    console.log('匿名登录成功:', result.user.uid)
    return result.user
  } catch (error) {
    console.error('匿名登录失败:', error)
    throw error
  }
}

export const signUp = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = result.user
    
    // 创建用户文档
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      avatar: null,
      bio: '',
      joinDate: new Date().toISOString(),
      labs: [],
      collections: []
    })
    
    return user
  } catch (error) {
    console.error('注册失败:', error)
    throw error
  }
}

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
    return true
  } catch (error) {
    console.error('登出失败:', error)
    return false
  }
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// 实验室相关操作
export const saveLab = async (labId, labData) => {
  try {
    // 确保用户已认证
    if (!auth.currentUser) {
      console.warn('用户未认证，使用匿名登陆')
      await signInAnonymously(auth)
    }
    
    await setDoc(doc(db, 'labs', labId), {
      ...labData,
      updatedAt: new Date().toISOString(),
      owner: labData.owner || auth.currentUser.uid
    })
    return true
  } catch (error) {
    console.error('保存实验室失败:', {
      code: error.code,
      message: error.message,
      labId: labId,
      user: auth.currentUser?.uid
    })
    throw error
  }
}

export const loadLab = async (labId) => {
  try {
    // 确保用户已认证
    if (!auth.currentUser) {
      console.warn('用户未认证，使用匿名登陆')
      await signInAnonymously(auth)
    }
    
    const labDoc = await getDoc(doc(db, 'labs', labId))
    if (labDoc.exists()) {
      return labDoc.data()
    }
    return null
  } catch (error) {
    console.error('加载实验室失败:', {
      code: error.code,
      message: error.message,
      labId: labId,
      user: auth.currentUser?.uid
    })
    throw error
  }
}

export const subscribeToLab = (labId, callback) => {
  const unsubscribe = onSnapshot(doc(db, 'labs', labId), (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
  return unsubscribe
}

// 为了向后兼容，保留原来的函数名
export const saveProject = saveLab
export const loadProject = loadLab
export const subscribeToProject = subscribeToLab

// 实验室聊天功能
export const addLabChat = async (labId, message, userId) => {
  try {
    if (!labId || !message || !userId) {
      throw new Error('实验室ID、消息和用户ID不能为空')
    }
    
    const labDoc = await getDoc(doc(db, 'labs', labId))
    if (!labDoc.exists()) {
      throw new Error('实验室不存在')
    }
    
    await updateDoc(doc(db, 'labs', labId), {
      labchats: arrayUnion({
        ...message,
        id: Date.now().toString(),
        userId: userId, // 使用用户ID
        timestamp: new Date().toISOString()
      }),
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('添加实验室聊天失败:', error)
    throw error
  }
}

export const subscribeToLabChats = (labId, callback) => {
  const unsubscribe = onSnapshot(doc(db, 'labs', labId), (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      callback(data.labchats || [])
    }
  })
  return unsubscribe
}

// 全局聊天功能（保留原有功能）
export const initChat = async (chatId) => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId))
    if (!chatDoc.exists()) {
      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        messages: [],
        participants: [],
        createdAt: new Date().toISOString()
      })
    }
    return true
  } catch (error) {
    console.error('初始化聊天失败:', error)
    return false
  }
}

export const sendMessage = async (chatId, message, userId) => {
  try {
    await initChat(chatId)
    
    await updateDoc(doc(db, 'chats', chatId), {
      messages: arrayUnion({
        ...message,
        id: Date.now().toString(),
        userId: userId, // 使用用户ID
        timestamp: new Date().toISOString()
      })
    })
    return true
  } catch (error) {
    console.error('发送消息失败:', error)
    return false
  }
}

export const subscribeToChat = (chatId, callback) => {
  const unsubscribe = onSnapshot(doc(db, 'chats', chatId), (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
  return unsubscribe
}

// 实验室文件管理
export const addLabFile = async (labId, fileData) => {
  try {
    if (!labId || !fileData) {
      throw new Error('实验室ID和文件数据不能为空')
    }
    
    const labDoc = await getDoc(doc(db, 'labs', labId))
    if (!labDoc.exists()) {
      throw new Error('实验室不存在')
    }
    
    await updateDoc(doc(db, 'labs', labId), {
      files: arrayUnion({
        ...fileData,
        id: Date.now().toString(),
        uploadedAt: new Date().toISOString()
      }),
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('添加实验室文件失败:', error)
    throw error
  }
}

export const removeLabFile = async (labId, fileId) => {
  try {
    if (!labId || !fileId) {
      throw new Error('实验室ID和文件ID不能为空')
    }
    
    const labDoc = await getDoc(doc(db, 'labs', labId))
    if (!labDoc.exists()) {
      throw new Error('实验室不存在')
    }
    
    const labData = labDoc.data()
    const updatedFiles = labData.files.filter(file => file.id !== fileId)
    
    await updateDoc(doc(db, 'labs', labId), {
      files: updatedFiles,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('删除实验室文件失败:', error)
    throw error
  }
}

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
}

export const initUserDocument = async (userId, userData = {}) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('用户ID无效')
    }
    
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: userData.email || '',
        displayName: userData.displayName || '用户',
        avatar: userData.avatar || null,
        bio: userData.bio || '',
        joinDate: new Date().toISOString(),
        labs: [],
        collections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    return true
  } catch (error) {
    console.error('初始化用户文档失败:', error)
    throw error
  }
}

export const saveUserLab = async (userId, labId) => {
  try {
    if (!userId || !labId) {
      throw new Error('用户ID和实验室ID不能为空')
    }
    
    await initUserDocument(userId)
    await updateDoc(doc(db, 'users', userId), {
      labs: arrayUnion(labId),
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('保存用户实验室失败:', error)
    throw error
  }
}

export const loadUserLabs = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const labIds = userDoc.data().labs || []
      const labs = []
      
      for (const labId of labIds) {
        const lab = await loadLab(labId)
        if (lab) {
          labs.push(lab)
        }
      }
      
      return labs
    }
    return []
  } catch (error) {
    console.error('加载用户实验室失败:', error)
    throw error
  }
}

export const createLab = async (labData, userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('用户ID无效')
    }
    
    const labId = 'lab_' + Date.now().toString()
    const newLab = {
      id: labId,
      ...labData,
      owner: userId, // 使用用户ID而不是用户名
      elements: [],
      connections: [],
      camera: { x: 0, y: 0, zoom: 1 },
      files: [],
      labchats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'labs', labId), newLab)
    await saveUserLab(userId, labId)
    
    return labId
  } catch (error) {
    console.error('创建实验室失败:', error)
    throw error
  }
}

// 为了向后兼容，保留原来的函数名
export const saveUserProject = saveUserLab
export const loadUserProjects = loadUserLabs

export const saveUserCollection = async (userId, item) => {
  try {
    await initUserDocument(userId)
    await updateDoc(doc(db, 'users', userId), {
      collections: arrayUnion(item),
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('保存收藏失败:', error)
    throw error
  }
}

export const loadUserCollections = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return userDoc.data().collections || []
    }
    return []
  } catch (error) {
    console.error('加载收藏失败:', error)
    throw error
  }
}

export const deleteLab = async (labId) => {
  try {
    await deleteDoc(doc(db, 'labs', labId))
    return true
  } catch (error) {
    console.error('删除实验室失败:', error)
    throw error
  }
}

// 为了向后兼容，保留原来的函数名
export const deleteProject = deleteLab