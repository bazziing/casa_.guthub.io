import { state, elements } from './state.js';
import { saveItemsToLocalStorage } from './storage.js';
import { calculateCurrentSpending } from './utils.js';
import { 
    renderItems, renderRooms, updateDashboard, 
    populateCategorySelects, populateCategoryFilters,
    closeAddItemModal, openAddItemModal,
    closeAddRoomModal, openAddRoomModal,
    closeAddCategoryModal,
    openLogoutModal, closeLogoutModal
} from './ui.js';
import { cloudService } from '../classes/CloudService.js';

export async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    try {
        await cloudService.signUp(email, password);
        alert('Conta criada com sucesso!');
    } catch (error) { alert('Erro ao criar conta: ' + error.message); }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await cloudService.login(email, password);
    } catch (error) { alert('Erro ao entrar: ' + error.message); }
}

export async function handleLogout() { openLogoutModal(); }

export async function confirmLogout() {
    closeLogoutModal();
    const isDashboard = window.location.pathname.includes('/dashboard/');
    window.location.href = isDashboard ? '../auth/logout/index.html' : 'auth/logout/index.html';
}

// CATEGORIAS
export async function addNewCategory() {
    const name = elements.newCategoryName?.value.trim();
    if (name && !state.categories.includes(name)) {
        state.categories.push(name);
        populateCategorySelects();
        saveItemsToLocalStorage();
        await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
        closeAddCategoryModal();
    } else if (state.categories.includes(name)) { 
        alert('Esta categoria já existe!'); 
    }
}

// ITENS
export async function togglePurchasedStatus(itemId, isPurchased) {
    const item = state.items.find(i => i.id === itemId);
    if (item) {
        item.purchased = isPurchased;
        saveItemsToLocalStorage();
        const room = state.rooms.find(r => r.name === item.category);
        if (room) await cloudService.saveItem(room.id, item);
        calculateCurrentSpending();
        // Salvar totais no documento pai
        await cloudService.saveSettings({ 
            totalBudget: state.totalBudget, 
            categories: state.categories,
            totalEstimated: state.totalEstimated,
            currentSpending: state.currentSpending
        });
        updateDashboard();
    }
}

export async function addOrUpdateItem(e) {
    e.preventDefault();
    const name = elements.itemName?.value.trim();
    const category = elements.itemCategory?.value;
    const priority = elements.itemPriority?.value;
    const price = parseFloat(elements.itemPrice?.value);
    const link = elements.itemLink?.value.trim();

    if (!name || !category || isNaN(price)) return;

    const room = state.rooms.find(r => r.name === category);
    if (!room) { alert("Escolha um cômodo válido!"); return; }

    let item;
    if (elements.editItemId?.value) {
        const index = state.items.findIndex(i => i.id === elements.editItemId.value);
        state.items[index] = { ...state.items[index], name, category, priority, price, link: link || null };
        item = state.items[index];
    } else {
        item = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name, category, priority, price, purchased: false, link: link || null };
        state.items.push(item);
    }

    saveItemsToLocalStorage();
    await cloudService.saveItem(room.id, item);
    calculateCurrentSpending();
    // Salvar totais consolidados no documento pai
    await cloudService.saveSettings({ 
        totalBudget: state.totalBudget, 
        categories: state.categories,
        totalEstimated: state.totalEstimated,
        currentSpending: state.currentSpending
    });
    renderItems();
    updateDashboard();
    closeAddItemModal();
}

export async function deleteItem(itemId) {
    if (confirm('Excluir item?')) {
        const item = state.items.find(i => i.id === itemId);
        const room = state.rooms.find(r => r.name === item.category);
        state.items = state.items.filter(i => i.id !== itemId);
        saveItemsToLocalStorage();
        if (room) await cloudService.deleteItem(room.id, itemId);
        calculateCurrentSpending();
        await cloudService.saveSettings({ 
            totalBudget: state.totalBudget, 
            categories: state.categories,
            totalEstimated: state.totalEstimated,
            currentSpending: state.currentSpending
        });
        renderItems();        updateDashboard();
    }
}

// CÔMODOS
export async function addNewRoom() {
    const name = elements.roomName?.value.trim();
    if (!name) return;

    const room = {
        id: elements.editRoomId?.value || Date.now().toString(),
        name,
        primaryColor: document.getElementById('primaryColorHex')?.value || '#b399d4',
        secondaryColor: document.getElementById('secondaryColorHex')?.value || '#d4f0e8',
        accentColor: document.getElementById('accentColorHex')?.value || '#ffd166',
        neutralColor: document.getElementById('neutralColorHex')?.value || '#f8f9fa'
    };

    if (elements.editRoomId?.value) {
        const index = state.rooms.findIndex(r => r.id === room.id);
        state.rooms[index] = room;
    } else {
        state.rooms.push(room);
        if (!state.categories.includes(name)) state.categories.push(name);
    }

    saveItemsToLocalStorage();
    await cloudService.saveRoom(room);
    await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
    
    renderRooms();
    populateCategoryFilters();
    closeAddRoomModal();
}

export async function deleteRoom(roomId) {
    if (confirm('Excluir cômodo?')) {
        const room = state.rooms.find(r => r.id === roomId);
        if (!room) return;
        const hasItems = state.items.some(i => i.category === room.name);
        if (hasItems && !confirm('Existem itens associados. Deseja realmente excluí-lo?')) return;
        
        state.rooms = state.rooms.filter(r => r.id !== roomId);
        state.categories = state.categories.filter(c => c !== room.name);
        
        saveItemsToLocalStorage();
        await cloudService.deleteRoom(roomId);
        await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
        
        populateCategorySelects();
        renderRooms();
    }
}

export function syncColorInputs() {
    const pairs = [['primaryColor', 'primaryColorHex'], ['secondaryColor', 'secondaryColorHex'], ['accentColor', 'accentColorHex'], ['neutralColor', 'neutralColorHex']];
    pairs.forEach(([pickerId, hexId]) => {
        const picker = document.getElementById(pickerId);
        const hex = document.getElementById(hexId);
        if (picker && hex) {
            picker.oninput = () => hex.value = picker.value.toUpperCase();
            hex.oninput = () => { if (/^#[0-9A-F]{6}$/i.test(hex.value)) picker.value = hex.value; };
        }
    });
}

export function editItem(itemId) {
    const item = state.items.find(item => item.id === itemId);
    if (item) {
        if (elements.editItemId) elements.editItemId.value = item.id;
        if (elements.itemName) elements.itemName.value = item.name;
        if (elements.itemCategory) elements.itemCategory.value = item.category;
        if (elements.itemPriority) elements.itemPriority.value = item.priority;
        if (elements.itemPrice) elements.itemPrice.value = item.price;
        if (elements.itemLink) elements.itemLink.value = item.link || '';
        openAddItemModal();
    }
}

export function editRoom(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (room) {
        if (elements.editRoomId) elements.editRoomId.value = room.id;
        if (elements.roomName) elements.roomName.value = room.name;
        const colors = [['primaryColor', room.primaryColor], ['primaryColorHex', room.primaryColor], ['secondaryColor', room.secondaryColor], ['secondaryColorHex', room.secondaryColor], ['accentColor', room.accentColor], ['accentColorHex', room.accentColor], ['neutralColor', room.neutralColor], ['neutralColorHex', room.neutralColor]];
        colors.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
        openAddRoomModal();
    }
}