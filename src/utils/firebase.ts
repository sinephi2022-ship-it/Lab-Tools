import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDcOJyJEpVsc-asPeYvqaKnZF0oa7J3xfI",
  authDomain: "labtool-5eb5e.firebaseapp.com",
  projectId: "labtool-5eb5e",
  storageBucket: "labtool-5eb5e.firebasestorage.app",
  messagingSenderId: "686046008242",
  appId: "1:686046008242:web:b5516ebf4eedea5afa4aab"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// 认证相关函数
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const user = result.user
  
  // 创建用户文档
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    createdAt: new Date()
  })
  
  return result
}

export const signOutUser = async () => {
  return await signOut(auth)
}

export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback)
}

// 实验室相关函数
export const createLab = async (labData: any) => {
  const labRef = doc(collection(db, 'labs'))
  await setDoc(labRef, {
    ...labData,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return labRef.id
}

export const getLabs = async (userId: string) => {
  const q = query(collection(db, 'labs'), where('members', 'array-contains', userId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const subscribeToLabs = (userId: string, callback: (labs: any[]) => void) => {
  const q = query(collection(db, 'labs'), where('members', 'array-contains', userId))
  return onSnapshot(q, (querySnapshot) => {
    const labs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(labs)
  })
}

// 实验室项目相关函数
export const createLabItem = async (labId: string, itemData: any) => {
  const itemRef = doc(collection(db, 'labs', labId, 'items'))
  await setDoc(itemRef, {
    ...itemData,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return itemRef.id
}

export const subscribeToLabItems = (labId: string, callback: (items: any[]) => void) => {
  const q = query(collection(db, 'labs', labId, 'items'))
  return onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(items)
  })
}

export const updateLabItem = async (labId: string, itemId: string, data: any) => {
  const itemRef = doc(db, 'labs', labId, 'items', itemId)
  await updateDoc(itemRef, {
    ...data,
    updatedAt: new Date()
  })
}

// 文件上传
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}