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
        this.projectId = null;
        this.projectDocRef = null;
        this.unsubscribe = null;
    }

    onAuthChange(callback) {
        onAuthStateChanged(this.auth, async (user) => {
            this.user = user;
            if (user) {
                // Buscar ou Criar Perfil do Usuário para pegar o projectId
                const userRef = doc(this.db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    this.projectId = userSnap.data().projectId;
                } else {
                    // Novo usuário: cria um projectId novo (usando o próprio UID como inicial)
                    this.projectId = user.uid;
                    await setDoc(userRef, { 
                        email: user.email, 
                        projectId: this.projectId,
                        role: 'owner' 
                    });
                    
                    // Inicializa o documento do projeto se não existir
                    const projectRef = doc(this.db, 'projects', this.projectId);
                    const projSnap = await getDoc(projectRef);
                    if (!projSnap.exists()) {
                        await setDoc(projectRef, {
                            settings: { totalBudget: 0, categories: ['Móveis', 'Eletros', 'Decoração'], totalEstimated: 0, currentSpending: 0 },
                            createdAt: new Date().toISOString()
                        });
                    }
                }
                this.projectDocRef = doc(this.db, 'projects', this.projectId);
            } else {
                this.projectId = null;
                this.projectDocRef = null;
            }
            callback(user);
        });
    }

    async signUp(email, password) {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    async login(email, password) { return signInWithEmailAndPassword(this.auth, email, password); }
    async logout() { return signOut(this.auth); }

    // Novo: Unir-se a outro projeto (Compartilhamento)
    async joinProject(targetProjectId) {
        if (!this.user) throw new Error("Usuário não autenticado");
        if (targetProjectId === this.projectId) throw new Error("Você já está utilizando este projeto!");

        const projectRef = doc(this.db, 'projects', targetProjectId);
        const projSnap = await getDoc(projectRef);
        
        if (!projSnap.exists()) throw new Error("Código de projeto inválido");

        // Atualiza o projectId do usuário atual
        const userRef = doc(this.db, 'users', this.user.uid);
        await updateDoc(userRef, { projectId: targetProjectId });
        
        this.projectId = targetProjectId;
        this.projectDocRef = projectRef;
        return true;
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
        if (this.unsubscribe) this.unsubscribe();
        if (!this.projectDocRef) return;

        this.unsubscribe = onSnapshot(this.projectDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                await this.loadFullProject(callback);
            }
        });
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
                rooms: rooms,
                items: allItems,
                projectId: this.projectId // Retorna o ID para exibir na UI
            });
        } catch (error) { console.error("Erro ao carregar projeto:", error); }
    }
}

export const cloudService = new CloudService();