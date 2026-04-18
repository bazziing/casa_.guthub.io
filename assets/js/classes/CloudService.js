import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, getDocs, collection, 
    deleteDoc, onSnapshot, updateDoc, query, where,
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig, COLLECTION_NAME } from '../modules/firebase-config.js';

export class CloudService {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        
        // Inicialização robusta do Firestore para evitar erros de rede e QUIC
        this.db = initializeFirestore(this.app, {
            experimentalAutoDetectLongPolling: true,
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });

        this.auth = getAuth(this.app);
        this.user = null;
        this.projectId = null;
        this.projectDocRef = null;
        this.unsubscribe = null;
    }

    onAuthChange(callback) {
        onAuthStateChanged(this.auth, async (user) => {
            this.user = user;
            if (user) {
                // Buscar Perfil do Usuário
                const userRef = doc(this.db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    this.projectId = userSnap.data().projectId;
                } else {
                    this.projectId = user.uid;
                }
                this.projectDocRef = doc(this.db, 'projects', this.projectId);
            } else {
                this.projectId = null;
                this.projectDocRef = null;
            }
            callback(user);
        });
    }

    async signUp(email, password, extraData = {}) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        
        // Criar Perfil no Firestore com dados extras
        const userRef = doc(this.db, 'users', user.uid);
        const projectId = user.uid; 
        
        await setDoc(userRef, { 
            uid: user.uid,
            email: user.email, 
            name: extraData.name || '',
            phone: extraData.phone || '',
            cep: extraData.cep || '',
            address: extraData.address || '',
            projectId: projectId,
            role: 'owner',
            createdAt: new Date().toISOString()
        });

        const projectRef = doc(this.db, 'projects', projectId);
        await setDoc(projectRef, {
            settings: { totalBudget: 0, categories: ['Móveis', 'Eletros', 'Decoração'], totalEstimated: 0, currentSpending: 0 },
            owner: user.uid,
            createdAt: new Date().toISOString()
        });

        return userCredential;
    }

    async getUserProfile() {
        if (!this.user) return null;
        const userRef = doc(this.db, 'users', this.user.uid);
        const snap = await getDoc(userRef);
        return snap.exists() ? snap.data() : null;
    }

    async updateUserProfile(data) {
        if (!this.user) throw new Error("Usuário não autenticado");
        const userRef = doc(this.db, 'users', this.user.uid);
        await updateDoc(userRef, data);
        return data;
    }

    async login(email, password) { return signInWithEmailAndPassword(this.auth, email, password); }
    async logout() { return signOut(this.auth); }

    async resetPassword(email) {
        return sendPasswordResetEmail(this.auth, email);
    }

    async joinProject(targetProjectId) {
        if (!this.user) throw new Error("Usuário não autenticado");
        if (targetProjectId === this.projectId) throw new Error("Você já está utilizando este projeto!");

        const projectRef = doc(this.db, 'projects', targetProjectId);
        const projSnap = await getDoc(projectRef);
        
        if (!projSnap.exists()) throw new Error("Código de projeto inválido");

        const userRef = doc(this.db, 'users', this.user.uid);
        await updateDoc(userRef, { projectId: targetProjectId });
        
        this.projectId = targetProjectId;
        this.projectDocRef = projectRef;
        return true;
    }

    async getProjectMembers() {
        if (!this.projectId) return [];
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('projectId', '==', this.projectId));
            const querySnapshot = await getDocs(q);
            const members = [];
            querySnapshot.forEach((doc) => {
                members.push(doc.data());
            });
            return members;
        } catch (error) {
            console.error("Erro ao buscar membros:", error);
            return [];
        }
    }

    async saveSettings(settings) {
        if (!this.projectDocRef) return;
        await setDoc(this.projectDocRef, { settings }, { merge: true });
    }

    async saveRoom(room) {
        if (!this.projectId) return;
        const roomRef = doc(this.db, 'projects', this.projectId, 'rooms', room.id);
        await setDoc(roomRef, room, { merge: true });
    }

    async deleteRoom(roomId) {
        if (!this.projectId) return;
        const roomRef = doc(this.db, 'projects', this.projectId, 'rooms', roomId);
        await deleteDoc(roomRef);
    }

    async saveItem(roomId, item) {
        if (!this.projectId) return;
        const itemRef = doc(this.db, 'projects', this.projectId, 'rooms', roomId, 'items', item.id);
        await setDoc(itemRef, item, { merge: true });
        await this.updateRoomTotal(roomId);
    }

    async deleteItem(roomId, itemId) {
        if (!this.projectId) return;
        const itemRef = doc(this.db, 'projects', this.projectId, 'rooms', roomId, 'items', itemId);
        await deleteDoc(itemRef);
        await this.updateRoomTotal(roomId);
    }

    async updateRoomTotal(roomId) {
        if (!this.projectId) return;
        const itemsSnap = await getDocs(collection(this.db, 'projects', this.projectId, 'rooms', roomId, 'items'));
        let total = 0;
        itemsSnap.forEach(doc => {
            const data = doc.data();
            total += parseFloat(data.price || 0);
        });
        const roomRef = doc(this.db, 'projects', this.projectId, 'rooms', roomId);
        await updateDoc(roomRef, { totalEstimated: total });
    }

    listenToChanges(callback) {
        if (this.unsubscribe) {
            if (Array.isArray(this.unsubscribe)) this.unsubscribe.forEach(u => u());
            else this.unsubscribe();
        }
        
        if (!this.projectId) return;

        const unsubscribes = [];

        unsubscribes.push(onSnapshot(this.projectDocRef, (docSnap) => {
            if (docSnap.exists()) this.loadFullProject(callback);
        }));

        const roomsRef = collection(this.db, 'projects', this.projectId, 'rooms');
        unsubscribes.push(onSnapshot(roomsRef, () => {
            this.loadFullProject(callback);
        }));

        this.unsubscribe = unsubscribes;
    }

    async loadFullProject(callback) {
        if (!this.projectId) return;
        try {
            const projSnap = await getDoc(this.projectDocRef);
            const settings = projSnap.data()?.settings || { totalBudget: 0, categories: [] };
            const roomsSnap = await getDocs(collection(this.db, 'projects', this.projectId, 'rooms'));
            const rooms = [];
            const allItems = [];

            for (const roomDoc of roomsSnap.docs) {
                const roomData = roomDoc.data();
                rooms.push(roomData);
                const itemsSnap = await getDocs(collection(this.db, 'projects', this.projectId, 'rooms', roomDoc.id, 'items'));
                itemsSnap.forEach(itemDoc => {
                    allItems.push({ ...itemDoc.data(), roomId: roomDoc.id });
                });
            }

            callback({
                totalBudget: settings.totalBudget,
                categories: settings.categories,
                savingsTarget: settings.savingsTarget || 0,
                savingsDate: settings.savingsDate || null,
                savingsFrequency: settings.savingsFrequency || null,
                savingsGrid: settings.savingsGrid || [],
                rooms: rooms,
                items: allItems,
                projectId: this.projectId 
            });
        } catch (error) { console.error("Erro ao carregar projeto:", error); }
    }
}

export const cloudService = new CloudService();