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
    closeDeleteConfirmModal, closeShareModal, closeAllModals,
    openRoomsSummaryModal, closeRoomsSummaryModal,
    openPurchasedItemsModal, closePurchasedItemsModal,
    openHighPriorityModal, closeHighPriorityModal,
    openCategoriesSummaryModal, closeCategoriesSummaryModal,
    renderSavingsGrid
} from './modules/ui.js';
import { 
    addOrUpdateItem, addNewCategory, addNewRoom,
    togglePurchasedStatus, editItem, deleteItem, confirmDeleteItem,
    editRoom, deleteRoom, confirmDeleteRoom,
    syncColorInputs,
    handleLogout, confirmLogout, fetchLinkData,
    openShare, confirmJoinProject, copyProjectId, shareViaWhatsapp,
    handleSavingsSubmit, toggleSavingsCell, resetSavings
} from './modules/events.js';
import { cloudService } from './classes/CloudService.js';

function init() {
    // 1. CARREGAMENTO INSTANTÂNEO (OFFLINE FIRST)
    loadLocal();
    applyCloudData({
        items: state.items,
        categories: state.categories,
        rooms: state.rooms,
        totalBudget: state.totalBudget
    });

    // 2. EXIBIÇÃO IMEDIATA (Não espera o Firebase para mostrar a página se já houver dados)
    const hasData = state.items.length > 0 || state.rooms.length > 0;
    if (hasData) {
        document.body.classList.add('auth-ready');
        const loader = document.getElementById('auth-guard-loader');
        if (loader) loader.style.display = 'none';
    }

    cloudService.onAuthChange(async (user) => {
        if (!user) {
            // REDIRECIONAMENTO SE DESLOGADO
            const isDashboard = window.location.pathname.includes('/dashboard/');
            if (isDashboard) {
                window.location.href = window.location.pathname.includes('/items/') || window.location.pathname.includes('/rooms/') 
                    ? '../../index.html' 
                    : '../index.html';
            }
            return;
        }

        // SE LOGADO: Confirmar visualização se ainda não estiver ativa
        document.body.classList.add('auth-ready');
        const loader = document.getElementById('auth-guard-loader');
        if (loader) loader.style.display = 'none';

        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = user.email;

        // 3. ATUALIZAÇÃO SILENCIOSA EM SEGUNDO PLANO
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
    
    state.savingsTarget = data.savingsTarget || 0;
    state.savingsDate = data.savingsDate || null;
    state.savingsFrequency = data.savingsFrequency || null;
    state.savingsGrid = data.savingsGrid || [];
    
    saveLocal();
    calculateCurrentSpending();
    if (document.getElementById('itemsTableBody')) renderItems();
    if (document.getElementById('roomsContainer')) renderRooms();
    if (document.getElementById('totalItems') || document.getElementById('totalEstimated')) updateDashboard();
    if (document.getElementById('itemCategory')) populateCategorySelects();
    if (document.getElementById('filterCategory')) populateCategoryFilters();
    const budgetInput = document.getElementById('totalBudget');
    if (budgetInput) budgetInput.value = formatCurrency(state.totalBudget);
    
    // Renderiza grid se estiver na página do cofrinho
    if (typeof renderSavingsGrid === 'function' && document.getElementById('savingsContainer')) {
        renderSavingsGrid();
    }
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
            let val = parseFloat(budgetInput.value) || 0;
            if (val < 0) {
                await showAlert("O orçamento não pode ser um valor negativo.", "Erro de Valor", "error");
                val = Math.abs(val);
            }
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

    const fetchBtn = document.getElementById('fetchLinkDataBtn');
    if (fetchBtn) fetchBtn.onclick = fetchLinkData;

    // Compartilhamento
    const openShareBtn = document.getElementById('openShareModalBtn');
    if (openShareBtn) openShareBtn.onclick = openShare;

    const closeShareBtn = document.getElementById('closeShareModalBtn');
    if (closeShareBtn) closeShareBtn.onclick = closeShareModal;

    const copyCodeBtn = document.getElementById('copyProjectIdBtn');
    if (copyCodeBtn) copyCodeBtn.onclick = copyProjectId;

    const joinProjectBtn = document.getElementById('confirmJoinProjectBtn');
    if (joinProjectBtn) joinProjectBtn.onclick = confirmJoinProject;

    const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
    if (shareWhatsappBtn) shareWhatsappBtn.onclick = shareViaWhatsapp;

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

    // Resumo por Cômodo
    const openRoomsSummaryBtn = document.getElementById('openRoomsSummaryBtn');
    if (openRoomsSummaryBtn) openRoomsSummaryBtn.onclick = openRoomsSummaryModal;

    const closeRoomsSummaryBtn = document.getElementById('closeRoomsSummaryModalBtn');
    if (closeRoomsSummaryBtn) closeRoomsSummaryBtn.onclick = closeRoomsSummaryModal;

    // Itens Comprados
    const openPurchasedModalBtn = document.getElementById('openPurchasedModalBtn');
    if (openPurchasedModalBtn) openPurchasedModalBtn.onclick = openPurchasedItemsModal;

    const closePurchasedModalBtn = document.getElementById('closePurchasedItemsModalBtn');
    if (closePurchasedModalBtn) closePurchasedModalBtn.onclick = closePurchasedItemsModal;

    // Alta Prioridade
    const openHighPriorityModalBtn = document.getElementById('openHighPriorityModalBtn');
    if (openHighPriorityModalBtn) openHighPriorityModalBtn.onclick = openHighPriorityModal;

    const closeHighPriorityModalBtn = document.getElementById('closeHighPriorityModalBtn');
    if (closeHighPriorityModalBtn) closeHighPriorityModalBtn.onclick = closeHighPriorityModal;

    // Resumo de Categorias
    const openCategoriesSummaryModalBtn = document.getElementById('openCategoriesSummaryModalBtn');
    if (openCategoriesSummaryModalBtn) openCategoriesSummaryModalBtn.onclick = openCategoriesSummaryModal;

    const closeCategoriesSummaryModalBtn = document.getElementById('closeCategoriesSummaryModalBtn');
    if (closeCategoriesSummaryModalBtn) closeCategoriesSummaryModalBtn.onclick = closeCategoriesSummaryModal;

    // Cofrinho
    const savingsForm = document.getElementById('savingsForm');
    if (savingsForm) savingsForm.onsubmit = handleSavingsSubmit;

    const savingsGrid = document.getElementById('savingsGrid');
    if (savingsGrid) {
        savingsGrid.onclick = (e) => {
            const cell = e.target.closest('.savings-cell');
            if (cell) {
                const index = parseInt(cell.dataset.index);
                toggleSavingsCell(index);
            }
        };
    }

    const resetSavingsBtn = document.getElementById('resetSavingsBtn');
    if (resetSavingsBtn) resetSavingsBtn.onclick = resetSavings;

    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
}

document.addEventListener('DOMContentLoaded', init);