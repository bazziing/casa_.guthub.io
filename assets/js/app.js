import { state, elements } from './modules/state.js';
import { loadItemsFromLocalStorage as loadLocal, saveItemsToLocalStorage as saveLocal } from './modules/storage.js';
import { calculateCurrentSpending, formatCurrency } from './modules/utils.js';
import { 
    renderItems, renderRooms, updateDashboard, 
    populateCategorySelects, populateCategoryFilters,
    openAddItemModal, closeAddItemModal,
    openAddRoomModal, closeAddRoomModal,
    openAddCategoryModal, closeAddCategoryModal,
    switchTab, closeLogoutModal, toggleSidebar,
    closeDeleteConfirmModal
} from './modules/ui.js';
import { 
    addOrUpdateItem, addNewCategory, addNewRoom,
    togglePurchasedStatus, editItem, deleteItem, confirmDeleteItem,
    editRoom, deleteRoom, confirmDeleteRoom,
    syncColorInputs,
    handleLogout, confirmLogout
} from './modules/events.js';
import { cloudService } from './classes/CloudService.js';

function init() {
    loadLocal();
    cloudService.onAuthChange(async (user) => {
        if (!user) {
            // REDIRECIONAMENTO IMEDIATO
            const isDashboard = window.location.pathname.includes('/dashboard/');
            if (isDashboard) {
                window.location.href = window.location.pathname.includes('/items/') || window.location.pathname.includes('/rooms/') 
                    ? '../../index.html' 
                    : '../index.html';
            }
            return;
        }

        // USUÁRIO LOGADO: Revelar App
        document.body.classList.add('auth-ready');
        const loader = document.getElementById('auth-guard-loader');
        if (loader) loader.style.display = 'none';

        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = user.email;
        await cloudService.loadFullProject((data) => { applyCloudData(data); });
        cloudService.listenToChanges((data) => { applyCloudData(data); });
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
    if (budgetInput) budgetInput.value = formatCurrency(state.totalBudget);
}

function addEventListeners() {
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) mobileMenuBtn.onclick = toggleSidebar;

    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.onclick = toggleSidebar;

    // Auth - Sair da conta
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); handleLogout(); };
    
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) cancelLogoutBtn.onclick = () => closeLogoutModal();

    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) confirmLogoutBtn.onclick = (e) => { e.preventDefault(); confirmLogout(); };

    // Modais de Exclusão
    const confirmDeleteItemBtn = document.getElementById('confirmDeleteItemBtn');
    if (confirmDeleteItemBtn) confirmDeleteItemBtn.onclick = confirmDeleteItem;

    const cancelDeleteItemBtn = document.getElementById('cancelDeleteItemBtn');
    if (cancelDeleteItemBtn) cancelDeleteItemBtn.onclick = () => closeDeleteConfirmModal('item');

    const confirmDeleteRoomBtn = document.getElementById('confirmDeleteRoomBtn');
    if (confirmDeleteRoomBtn) confirmDeleteRoomBtn.onclick = confirmDeleteRoom;

    const cancelDeleteRoomBtn = document.getElementById('cancelDeleteRoomBtn');
    if (cancelDeleteRoomBtn) cancelDeleteRoomBtn.onclick = () => closeDeleteConfirmModal('room');

    const budgetInput = document.getElementById('totalBudget');
    if (budgetInput) {
        budgetInput.onfocus = () => {
            budgetInput.value = state.totalBudget || '';
        };

        budgetInput.onblur = async () => {
            const val = parseFloat(budgetInput.value) || 0;
            state.totalBudget = val;
            budgetInput.value = formatCurrency(val);
            saveLocal();
            try {
                await cloudService.saveSettings({ totalBudget: val, categories: state.categories });
                updateDashboard();
            } catch (e) { console.error("Erro ao salvar budget:", e); }
        };

        budgetInput.onkeydown = (e) => {
            if (e.key === 'Enter') budgetInput.blur();
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