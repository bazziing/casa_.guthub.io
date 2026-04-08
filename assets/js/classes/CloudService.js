import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, getDocs, collection, 
    deleteDoc, onSnapshot, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig, COLLECTION_NAME } from '../modules/firebase-config.js';

export class CloudService {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
        this.user = null;
        this.userDocRef = null;
        this.unsubscribe = null;
    }

    onAuthChange(callback) {
        onAuthStateChanged(this.auth, (user) => {
            this.user = user;
            this.userDocRef = user ? doc(this.db, COLLECTION_NAME, user.uid) : null;
            callback(user);
        });
    }

    async signUp(email, password) {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        await setDoc(doc(this.db, COLLECTION_NAME, cred.user.uid), {
            profile: { email: cred.user.email, uid: cred.user.uid },
            settings: { totalBudget: 0, categories: ['Móveis', 'Eletros', 'Decoração'], totalEstimated: 0, currentSpending: 0 }
        });
        return cred;
    }

    async login(email, password) { return signInWithEmailAndPassword(this.auth, email, password); }
    async logout() { return signOut(this.auth); }

    async saveSettings(settings) {
        if (!this.userDocRef) return;
        await setDoc(this.userDocRef, { settings }, { merge: true });
    }

    async saveRoom(room) {
        if (!this.userDocRef) return;
        const roomRef = doc(this.db, COLLECTION_NAME, this.user.uid, 'rooms', room.id);
        await setDoc(roomRef, room, { merge: true });
    }

    async deleteRoom(roomId) {
        if (!this.userDocRef) return;
        const roomRef = doc(this.db, COLLECTION_NAME, this.user.uid, 'rooms', roomId);
        await deleteDoc(roomRef);
    }

    async saveItem(roomId, item) {
        if (!this.userDocRef) return;
        const itemRef = doc(this.db, COLLECTION_NAME, this.user.uid, 'rooms', roomId, 'items', item.id);
        await setDoc(itemRef, item, { merge: true });
    }

    async deleteItem(roomId, itemId) {
        if (!this.userDocRef) return;
        const itemRef = doc(this.db, COLLECTION_NAME, this.user.uid, 'rooms', roomId, 'items', itemId);
        await deleteDoc(itemRef);
    }

    // Método para escutar mudanças em tempo real (Restaurado)
    listenToChanges(callback) {
        if (this.unsubscribe) this.unsubscribe();
        if (!this.userDocRef) return;

        this.unsubscribe = onSnapshot(this.userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                // Ao mudar o documento principal (settings), recarregamos o projeto
                await this.loadFullProject(callback);
            }
        });
    }

    async loadFullProject(callback) {
        if (!this.userDocRef) return;
        try {
            const userSnap = await getDoc(this.userDocRef);
            const settings = userSnap.data()?.settings || { totalBudget: 0, categories: [] };
            const roomsSnap = await getDocs(collection(this.db, COLLECTION_NAME, this.user.uid, 'rooms'));
            const rooms = [];
            const allItems = [];

            for (const roomDoc of roomsSnap.docs) {
                const roomData = roomDoc.data();
                rooms.push(roomData);
                const itemsSnap = await getDocs(collection(this.db, COLLECTION_NAME, this.user.uid, 'rooms', roomDoc.id, 'items'));
                itemsSnap.forEach(itemDoc => {
                    allItems.push({ ...itemDoc.data(), roomId: roomDoc.id });
                });
            }

            callback({
                totalBudget: settings.totalBudget,
                categories: settings.categories,
                rooms: rooms,
                items: allItems
            });
        } catch (error) { console.error("Erro ao carregar projeto:", error); }
    }
}

export const cloudService = new CloudService();