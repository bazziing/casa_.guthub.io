import { state, elements } from './modules/state.js';
import { loadItemsFromLocalStorage as loadLocal, saveItemsToLocalStorage as saveLocal } from './modules/storage.js';
import { calculateCurrentSpending } from './modules/utils.js';
import { 
    renderItems, renderRooms, updateDashboard, 
    populateCategorySelects, populateCategoryFilters,
    openAddItemModal, closeAddItemModal,
    openAddRoomModal, closeAddRoomModal,
    openAddCategoryModal, closeAddCategoryModal,
    switchTab, closeLogoutModal
} from './modules/ui.js';
import { 
    addOrUpdateItem, addNewCategory, addNewRoom,
    togglePurchasedStatus, editItem, deleteItem,
    editRoom, deleteRoom,
    syncColorInputs,
    handleLogout
} from './modules/events.js';
import { cloudService } from './classes/CloudService.js';

function init() {
    loadLocal();
    cloudService.onAuthChange(async (user) => {
        if (!user) {
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
                const isDashboard = window.location.pathname.includes('/dashboard/');
                window.location.href = isDashboard ? '../index.html' : '../../index.html';
            }
            return;
        }
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = user.email;

        // NOVO: Carregamento hierárquico (Settings -> Rooms -> Items)
        await cloudService.loadFullProject((data) => {
            applyCloudData(data);
        });
    });
    addEventListeners();
}

function applyCloudData(data) {
    if (!data) return;
    state.items = data.items || [];
    state.categories = data.categories || [];
    state.rooms = data.rooms || [];
    state.totalBudget = data.totalBudget || 0;
    
    saveLocal();
    calculateCurrentSpending();
    
    if (document.getElementById('itemsTableBody')) renderItems();
    if (document.getElementById('roomsContainer')) renderRooms();
    if (document.getElementById('totalItems') || document.getElementById('totalEstimated')) updateDashboard();
    if (document.getElementById('itemCategory')) populateCategorySelects();
    if (document.getElementById('filterCategory')) populateCategoryFilters();
    
    const budgetInput = document.getElementById('totalBudget');
    if (budgetInput) budgetInput.value = state.totalBudget;
}

function addEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); handleLogout(); };
    
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) cancelLogoutBtn.onclick = () => closeLogoutModal();
const budgetInput = document.getElementById('totalBudget');
if (budgetInput) {
    budgetInput.onchange = async () => {
        const val = parseFloat(budgetInput.value) || 0;
        state.totalBudget = val;
        saveLocal();
        // Salvar no Firebase usando a nova lógica de settings
        try {
            await cloudService.saveSettings({ 
                totalBudget: val, 
                categories: state.categories 
            });
            updateDashboard();
        } catch (e) {
            console.error("Erro ao salvar budget:", e);
        }
    };
}
    if (elements.filterCategory) elements.filterCategory.onchange = renderItems;
    if (elements.filterPriority) elements.filterPriority.onchange = renderItems;
    if (elements.filterStatus) elements.filterStatus.onchange = renderItems;
    if (elements.itemsTabBtn) elements.itemsTabBtn.onclick = () => switchTab('items');
    if (elements.colorsTabBtn) elements.colorsTabBtn.onclick = () => switchTab('colors');

    const addBtn = document.getElementById('addItemBtn') || document.getElementById('emptyAddItemBtn');
    if (addBtn) addBtn.onclick = openAddItemModal;
    if (elements.closeModalBtn) elements.closeModalBtn.onclick = closeAddItemModal;
    if (elements.cancelItemBtn) elements.cancelItemBtn.onclick = closeAddItemModal;
    if (elements.itemForm) elements.itemForm.onsubmit = addOrUpdateItem;

    if (elements.addCategoryBtn) elements.addCategoryBtn.onclick = openAddCategoryModal;
    if (elements.closeCategoryModalBtn) elements.closeCategoryModalBtn.onclick = closeAddCategoryModal;
    if (elements.cancelCategoryBtn) elements.cancelCategoryBtn.onclick = closeAddCategoryModal;
    if (elements.categoryForm) elements.categoryForm.onsubmit = (e) => { e.preventDefault(); addNewCategory(); };

    const addRoomBtn = document.getElementById('addRoomBtn') || document.getElementById('emptyAddRoomBtn');
    if (addRoomBtn) addRoomBtn.onclick = openAddRoomModal;
    if (elements.closeRoomModalBtn) elements.closeRoomModalBtn.onclick = closeAddRoomModal;
    if (elements.cancelRoomBtn) elements.cancelRoomBtn.onclick = closeAddRoomModal;
    if (elements.roomForm) elements.roomForm.onsubmit = (e) => { e.preventDefault(); addNewRoom(); };

    if (document.getElementById('itemsTableBody')) {
        document.getElementById('itemsTableBody').onclick = (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;
            if (e.target.classList.contains('toggle-purchased')) togglePurchasedStatus(id, e.target.checked);
            else if (e.target.classList.contains('edit-item')) editItem(id);
            else if (e.target.classList.contains('delete-item')) deleteItem(id);
        };
    }

    if (document.getElementById('roomsContainer')) {
        document.getElementById('roomsContainer').onclick = (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('edit-room')) editRoom(id);
            else if (btn.classList.contains('delete-room')) deleteRoom(id);
        };
    }
    syncColorInputs();
}

document.addEventListener('DOMContentLoaded', init);