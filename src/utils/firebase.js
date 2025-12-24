import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
  authDomain: "labtool-5eb5e.firebaseapp.com",
  projectId: "labtool-5eb5e",
  storageBucket: "labtool-5eb5e.firebasestorage.app",
  messagingSenderId: "686046008242",
  appId: "1:686046008242:web:b5516ebf4eedea5afa4aab",
  measurementId: "G-86F1TSWE56"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const signIn = async () => {
  try {
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error('匿名登录失败:', error)
    throw error
  }
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export const saveProject = async (projectId, projectData) => {
  try {
    await setDoc(doc(db, 'projects', projectId), projectData)
    return true
  } catch (error) {
    console.error('保存项目失败:', error)
    return false
  }
}

export const loadProject = async (projectId) => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId))
    if (projectDoc.exists()) {
      return projectDoc.data()
    }
    return null
  } catch (error) {
    console.error('加载项目失败:', error)
    return null
  }
}

export const subscribeToProject = (projectId, callback) => {
  const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
  return unsubscribe
}

export const sendMessage = async (chatId, message) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      messages: arrayUnion(message)
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

export const saveUserCollection = async (userId, item) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      collections: arrayUnion(item)
    })
    return true
  } catch (error) {
    console.error('保存收藏失败:', error)
    return false
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
    return []
  }
}