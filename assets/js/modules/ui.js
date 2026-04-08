import { state, elements } from './state.js';
import { getRoomColor, formatCurrency } from './utils.js';

export function updateDashboard() {
    // Verificar se estamos em uma página que tem os elementos do dashboard
    const currentSpendingEl = document.getElementById('currentSpending');
    if (!currentSpendingEl) return;

    // 1. Atualizar Totais Financeiros
    currentSpendingEl.textContent = formatCurrency(state.currentSpending);
    
    const totalEstimatedEl = document.getElementById('totalEstimated');
    if (totalEstimatedEl) {
        totalEstimatedEl.textContent = formatCurrency(state.totalEstimated);
    }

    const totalBudget = parseFloat(state.totalBudget) || 0;
    const percentageUsed = totalBudget > 0 ? (state.currentSpending / totalBudget) * 100 : 0;
    
    const percentageUsedEl = document.getElementById('percentageUsed');
    if (percentageUsedEl) {
        percentageUsedEl.textContent = `${percentageUsed.toFixed(1)}% usado`;
    }
   
    const remainingBudget = totalBudget - state.currentSpending;
    const remainingBudgetEl = document.getElementById('remainingBudget');
    if (remainingBudgetEl) {
        remainingBudgetEl.textContent = `${formatCurrency(remainingBudget)} restantes`;
    }

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${Math.min(percentageUsed, 100)}%`;
    }

    // 2. Atualizar Estatísticas Quantitativas
    const purchasedItemsEl = document.getElementById('purchasedItems');
    if (purchasedItemsEl) {
        purchasedItemsEl.textContent = state.items.filter(item => item.purchased).length;
    }

    const highPriorityItemsEl = document.getElementById('highPriorityItems');
    if (highPriorityItemsEl) {
        highPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'high').length;
    }

    const totalCategoriesEl = document.getElementById('totalCategories');
    if (totalCategoriesEl) {
        const uniqueCategories = [...new Set(state.items.map(item => item.category))];
        totalCategoriesEl.textContent = uniqueCategories.length;
    }
}

export function renderItems() {
    const tableBody = document.getElementById('itemsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    
    let filteredItems = [...state.items];
    
    if (categoryFilter) filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    if (priorityFilter) filteredItems = filteredItems.filter(item => item.priority === priorityFilter);
    if (statusFilter === 'purchased') filteredItems = filteredItems.filter(item => item.purchased);
    else if (statusFilter === 'not-purchased') filteredItems = filteredItems.filter(item => !item.purchased);
    
    const emptyState = document.getElementById('emptyState');
    if (filteredItems.length === 0) {
        emptyState?.classList.remove('hidden');
        return;
    }
    
    emptyState?.classList.add('hidden');
    
    filteredItems.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) return priorityOrder[b.priority] - priorityOrder[a.priority];
        return a.name.localeCompare(b.name);
    });
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-purple-50';
        row.dataset.id = item.id;
        const priorityClass = `priority-${item.priority}`;
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap ${priorityClass}">
                <label class="inline-flex items-center">
                    <input type="checkbox" class="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500 toggle-purchased" ${item.purchased ? 'checked' : ''}>
                </label>
            </td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${item.name}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-500">${item.category}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.priority === 'high' ? 'bg-red-100 text-red-800' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    ${item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${formatCurrency(parseFloat(item.price))}</div></td>
            <td class="px-6 py-4 whitespace-nowrap">${item.link ? `<a href="${item.link}" target="_blank" class="text-sm text-purple-600 hover:text-purple-800">Ver</a>` : '<span class="text-sm text-gray-400">-</span>'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-purple-600 hover:text-purple-900 mr-3 edit-item">Editar</button>
                <button class="text-red-600 hover:text-red-900 delete-item">Excluir</button>
            </td>`;
        tableBody.appendChild(row);
    });
}

export function renderRooms() {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const emptyRoomsState = document.getElementById('emptyRoomsState');
    
    if (state.rooms.length === 0) {
        emptyRoomsState?.classList.remove('hidden');
        return;
    }
    
    emptyRoomsState?.classList.add('hidden');
    
    state.rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'bg-white rounded-xl p-6 card-shadow border-l-4';
        roomCard.style.borderLeftColor = room.primaryColor;
        roomCard.innerHTML = `
            <div class="flex justify-between items-start mb-4 gap-2">
                <h3 class="text-lg font-bold text-purple-900 truncate" title="${room.name}">${room.name}</h3>
                <div class="flex space-x-1 shrink-0">
                    <button class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg edit-room" data-id="${room.id}"><i class="fas fa-edit text-xs"></i></button>
                    <button class="p-2 text-red-600 hover:bg-red-50 rounded-lg delete-room" data-id="${room.id}"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
            <div class="space-y-3 flex-1">
                <div class="flex items-center text-xs"><span class="color-preview w-6 h-6" style="background-color: ${room.primaryColor};"></span><span>${room.primaryColor}</span></div>
            </div>`;
        container.appendChild(roomCard);
    });
}

export function populateCategorySelects() {
    const select = document.getElementById('itemCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cômodo</option>';
    state.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = room.name;
        select.appendChild(option);
    });
}

export function populateCategoryFilters() {
    const filter = document.getElementById('filterCategory');
    if (!filter) return;
    
    const currentVal = filter.value;
    filter.innerHTML = '<option value="">Todas Categorias</option>';
    state.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = room.name;
        filter.appendChild(option);
    });
    filter.value = currentVal;
}

// Modais Genéricos
const toggleModal = (id, show) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) modal.classList.remove('modal-hidden');
    else modal.classList.add('modal-hidden');
};

export function openAddItemModal() { toggleModal('addItemModal', true); }
export function closeAddItemModal() { 
    toggleModal('addItemModal', false); 
    document.getElementById('itemForm')?.reset(); 
    const editId = document.getElementById('editItemId');
    if (editId) editId.value = ''; 
}

export function openAddRoomModal() { toggleModal('addRoomModal', true); }
export function closeAddRoomModal() { 
    toggleModal('addRoomModal', false); 
    document.getElementById('roomForm')?.reset(); 
    const editId = document.getElementById('editRoomId');
    if (editId) editId.value = ''; 
}

export function openAddCategoryModal() { toggleModal('addCategoryModal', true); }
export function closeAddCategoryModal() { toggleModal('addCategoryModal', false); document.getElementById('categoryForm')?.reset(); }

export function openLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => { const content = modal.querySelector('div'); if (content) { content.classList.remove('scale-95'); content.classList.add('scale-100'); } }, 10);
    }
}

export function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        const content = modal.querySelector('div');
        if (content) { content.classList.add('scale-95'); content.classList.remove('scale-100'); }
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
}

export function switchTab(tabName) {
    const itemsTabBtn = document.getElementById('itemsTabBtn');
    const colorsTabBtn = document.getElementById('colorsTabBtn');
    const itemsTabContent = document.getElementById('itemsTabContent');
    const colorsTabContent = document.getElementById('colorsTabContent');

    if (tabName === 'items') {
        itemsTabBtn?.classList.add('active');
        colorsTabBtn?.classList.remove('active');
        itemsTabContent?.classList.remove('hidden');
        colorsTabContent?.classList.add('hidden');
    } else {
        itemsTabBtn?.classList.remove('active');
        colorsTabBtn?.classList.add('active');
        itemsTabContent?.classList.add('hidden');
        colorsTabContent?.classList.remove('hidden');
    }
}