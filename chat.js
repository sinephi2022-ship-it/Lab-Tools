/**
 * LabMate Pro - Chat System
 * Real-time messaging, file sharing, and friend management
 */

class LabChat {
    constructor(labId, userId, db, auth, dict) {
        this.labId = labId;
        this.userId = userId;
        this.db = db;
        this.auth = auth;
        this.dict = dict;
        this.messages = [];
        this.listeners = [];
        this.unsubscribe = null;
    }
    
    /**
     * Initialize chat for a lab
     */
    async init() {
        try {
            // Get lab members
            const labDoc = await this.db.collection('labs').doc(this.labId).get();
            if (!labDoc.exists) throw new Error('Lab not found');
            
            this.members = labDoc.data().members || [];
            
            // Subscribe to messages
            this.listenToMessages();
        } catch (error) {
            console.error('Chat init error:', error);
        }
    }
    
    /**
     * Listen to real-time messages
     */
    listenToMessages() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        this.unsubscribe = this.db
            .collection('labs')
            .doc(this.labId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .limit(100)
            .onSnapshot((snapshot) => {
                this.messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.notifyListeners();
            }, (error) => {
                console.error('Listen error:', error);
            });
    }
    
    /**
     * Send a message
     */
    async sendMessage(content, type = 'text', metadata = {}) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            
            const message = {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userEmail: user.email,
                content,
                type, // 'text', 'image', 'file', 'code'
                metadata,
                timestamp: new Date(),
                likes: [],
                replies: []
            };
            
            await this.db
                .collection('labs')
                .doc(this.labId)
                .collection('messages')
                .add(message);
            
            return message;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }
    
    /**
     * Edit a message
     */
    async editMessage(messageId, newContent) {
        try {
            await this.db
                .collection('labs')
                .doc(this.labId)
                .collection('messages')
                .doc(messageId)
                .update({
                    content: newContent,
                    edited: true,
                    editedAt: new Date()
                });
        } catch (error) {
            console.error('Edit message error:', error);
            throw error;
        }
    }
    
    /**
     * Delete a message
     */
    async deleteMessage(messageId) {
        try {
            await this.db
                .collection('labs')
                .doc(this.labId)
                .collection('messages')
                .doc(messageId)
                .delete();
        } catch (error) {
            console.error('Delete message error:', error);
            throw error;
        }
    }
    
    /**
     * Add reaction to message
     */
    async addReaction(messageId, emoji) {
        try {
            const user = this.auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            
            const msgRef = this.db
                .collection('labs')
                .doc(this.labId)
                .collection('messages')
                .doc(messageId);
            
            const msg = await msgRef.get();
            const reactions = msg.data().reactions || [];
            
            // Check if already reacted
            const existingReaction = reactions.find(r => r.emoji === emoji && r.userId === user.uid);
            
            if (existingReaction) {
                // Remove reaction
                await msgRef.update({
                    reactions: reactions.filter(r => !(r.emoji === emoji && r.userId === user.uid))
                });
            } else {
                // Add reaction
                await msgRef.update({
                    reactions: [...reactions, {
                        emoji,
                        userId: user.uid,
                        userName: user.displayName || 'User'
                    }]
                });
            }
        } catch (error) {
            console.error('Reaction error:', error);
        }
    }
    
    /**
     * Upload file to message
     */
    async uploadFile(file) {
        try {
            const reader = new FileReader();
            
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const base64 = e.target.result;
                        
                        // Send as message with embedded data
                        const message = await this.sendMessage(
                            file.name,
                            'file',
                            {
                                fileName: file.name,
                                fileType: file.type,
                                fileSize: file.size,
                                base64: base64
                            }
                        );
                        
                        resolve(message);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Upload file error:', error);
            throw error;
        }
    }
    
    /**
     * Share canvas element
     */
    async shareElement(elementId, elementData) {
        try {
            await this.sendMessage(
                `Shared element: ${elementData.content || elementData.type}`,
                'element',
                {
                    elementId,
                    elementType: elementData.type,
                    elementData: elementData
                }
            );
        } catch (error) {
            console.error('Share element error:', error);
        }
    }
    
    /**
     * Register listener
     */
    onMessagesChange(callback) {
        this.listeners.push(callback);
    }
    
    /**
     * Notify all listeners
     */
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.messages);
        }
    }
    
    /**
     * Get message count
     */
    getMessageCount() {
        return this.messages.length;
    }
    
    /**
     * Get messages by user
     */
    getMessagesByUser(userId) {
        return this.messages.filter(m => m.userId === userId);
    }
    
    /**
     * Search messages
     */
    searchMessages(query) {
        const lowerQuery = query.toLowerCase();
        return this.messages.filter(m => 
            m.content.toLowerCase().includes(lowerQuery)
        );
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.listeners = [];
    }
}

/**
 * Friend system
 */
class FriendSystem {
    constructor(userId, db, auth) {
        this.userId = userId;
        this.db = db;
        this.auth = auth;
        this.friends = [];
        this.pendingRequests = [];
        this.sentRequests = [];
    }
    
    /**
     * Initialize friend system
     */
    async init() {
        try {
            await this.loadFriends();
            await this.loadPendingRequests();
        } catch (error) {
            console.error('Friend system init error:', error);
        }
    }
    
    /**
     * Load friends list
     */
    async loadFriends() {
        try {
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            if (userDoc.exists) {
                this.friends = userDoc.data().friends || [];
            }
        } catch (error) {
            console.error('Load friends error:', error);
        }
    }
    
    /**
     * Send friend request
     */
    async sendRequest(targetUserId) {
        try {
            const user = this.auth.currentUser;
            
            // Add to target user's pending requests
            await this.db.collection('users').doc(targetUserId).update({
                pendingRequests: firebase.firestore.FieldValue.arrayUnion({
                    from: this.userId,
                    fromName: user.displayName || 'User',
                    timestamp: new Date()
                })
            });
            
            // Track sent request
            this.sentRequests.push(targetUserId);
        } catch (error) {
            console.error('Send request error:', error);
            throw error;
        }
    }
    
    /**
     * Accept friend request
     */
    async acceptRequest(fromUserId) {
        try {
            const batch = this.db.batch();
            
            // Add to friends
            const currentUserRef = this.db.collection('users').doc(this.userId);
            const otherUserRef = this.db.collection('users').doc(fromUserId);
            
            batch.update(currentUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(fromUserId),
                pendingRequests: firebase.firestore.FieldValue.arrayRemove(
                    this.pendingRequests.find(r => r.from === fromUserId)
                )
            });
            
            batch.update(otherUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(this.userId)
            });
            
            await batch.commit();
            
            await this.loadFriends();
            await this.loadPendingRequests();
        } catch (error) {
            console.error('Accept request error:', error);
            throw error;
        }
    }
    
    /**
     * Reject friend request
     */
    async rejectRequest(fromUserId) {
        try {
            const request = this.pendingRequests.find(r => r.from === fromUserId);
            
            await this.db.collection('users').doc(this.userId).update({
                pendingRequests: firebase.firestore.FieldValue.arrayRemove(request)
            });
            
            await this.loadPendingRequests();
        } catch (error) {
            console.error('Reject request error:', error);
            throw error;
        }
    }
    
    /**
     * Remove friend
     */
    async removeFriend(friendId) {
        try {
            const batch = this.db.batch();
            
            const currentUserRef = this.db.collection('users').doc(this.userId);
            const friendRef = this.db.collection('users').doc(friendId);
            
            batch.update(currentUserRef, {
                friends: firebase.firestore.FieldValue.arrayRemove(friendId)
            });
            
            batch.update(friendRef, {
                friends: firebase.firestore.FieldValue.arrayRemove(this.userId)
            });
            
            await batch.commit();
            
            await this.loadFriends();
        } catch (error) {
            console.error('Remove friend error:', error);
            throw error;
        }
    }
    
    /**
     * Load pending requests
     */
    async loadPendingRequests() {
        try {
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            if (userDoc.exists) {
                this.pendingRequests = userDoc.data().pendingRequests || [];
            }
        } catch (error) {
            console.error('Load pending requests error:', error);
        }
    }
    
    /**
     * Get friends count
     */
    getFriendsCount() {
        return this.friends.length;
    }
    
    /**
     * Check if user is friend
     */
    isFriend(userId) {
        return this.friends.includes(userId);
    }
    
    /**
     * Get pending count
     */
    getPendingCount() {
        return this.pendingRequests.length;
    }
}

// Export classes
window.LabChat = LabChat;
window.FriendSystem = FriendSystem;
