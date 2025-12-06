// LabMate Collection System - Personal favorites and collection management
class LabCollection {
    constructor(userId, db) {
        this.userId = userId;
        this.db = db;
        this.favorites = [];
        this.collections = [];
    }

    async init() {
        await this.loadFavorites();
        await this.loadCollections();
    }

    async loadFavorites() {
        try {
            const userDoc = await this.db.collection('users').doc(this.userId).get();
            const data = userDoc.data();
            this.favorites = data?.favorites || [];
        } catch (err) {
            console.error('Load favorites error:', err);
        }
    }

    async loadCollections() {
        try {
            const snapshot = await this.db
                .collection('users')
                .doc(this.userId)
                .collection('collections')
                .orderBy('createdAt', 'desc')
                .get();
            this.collections = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (err) {
            console.error('Load collections error:', err);
        }
    }

    async addToFavorites(labId) {
        try {
            if (!this.favorites.includes(labId)) {
                this.favorites.push(labId);
                await this.db
                    .collection('users')
                    .doc(this.userId)
                    .update({
                        favorites: firebase.firestore.FieldValue.arrayUnion(labId)
                    });
                return true;
            }
            return false;
        } catch (err) {
            console.error('Add to favorites error:', err);
            throw err;
        }
    }

    async removeFromFavorites(labId) {
        try {
            this.favorites = this.favorites.filter(id => id !== labId);
            await this.db
                .collection('users')
                .doc(this.userId)
                .update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(labId)
                });
            return true;
        } catch (err) {
            console.error('Remove from favorites error:', err);
            throw err;
        }
    }

    async createCollection(name, description = '') {
        try {
            const collectionId = 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const collectionData = {
                id: collectionId,
                name,
                description,
                labs: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.db
                .collection('users')
                .doc(this.userId)
                .collection('collections')
                .doc(collectionId)
                .set(collectionData);

            this.collections.push(collectionData);
            return collectionData;
        } catch (err) {
            console.error('Create collection error:', err);
            throw err;
        }
    }

    async deleteCollection(collectionId) {
        try {
            await this.db
                .collection('users')
                .doc(this.userId)
                .collection('collections')
                .doc(collectionId)
                .delete();

            this.collections = this.collections.filter(c => c.id !== collectionId);
            return true;
        } catch (err) {
            console.error('Delete collection error:', err);
            throw err;
        }
    }

    async addLabToCollection(collectionId, labId) {
        try {
            await this.db
                .collection('users')
                .doc(this.userId)
                .collection('collections')
                .doc(collectionId)
                .update({
                    labs: firebase.firestore.FieldValue.arrayUnion(labId),
                    updatedAt: new Date().toISOString()
                });

            // Update local collection
            const collection = this.collections.find(c => c.id === collectionId);
            if (collection && !collection.labs.includes(labId)) {
                collection.labs.push(labId);
            }
            return true;
        } catch (err) {
            console.error('Add lab to collection error:', err);
            throw err;
        }
    }

    async removeLabFromCollection(collectionId, labId) {
        try {
            await this.db
                .collection('users')
                .doc(this.userId)
                .collection('collections')
                .doc(collectionId)
                .update({
                    labs: firebase.firestore.FieldValue.arrayRemove(labId),
                    updatedAt: new Date().toISOString()
                });

            // Update local collection
            const collection = this.collections.find(c => c.id === collectionId);
            if (collection) {
                collection.labs = collection.labs.filter(id => id !== labId);
            }
            return true;
        } catch (err) {
            console.error('Remove lab from collection error:', err);
            throw err;
        }
    }

    isFavorite(labId) {
        return this.favorites.includes(labId);
    }

    getFavoriteLabs(labs) {
        return labs.filter(lab => this.favorites.includes(lab.id));
    }

    getCollectionLabs(collectionId, labs) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return [];
        return labs.filter(lab => collection.labs.includes(lab.id));
    }

    toJSON() {
        return {
            favorites: this.favorites,
            collections: this.collections
        };
    }

    static fromJSON(userId, db, data) {
        const collection = new LabCollection(userId, db);
        collection.favorites = data.favorites || [];
        collection.collections = data.collections || [];
        return collection;
    }
}

// Export for use in app
window.LabCollection = LabCollection;
