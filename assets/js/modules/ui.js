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
        // Ajustar cores e texto conforme o saldo
        if (remainingBudget > 0) {
            remainingBudgetEl.textContent = `${formatCurrency(remainingBudget)} restantes`;
            remainingBudgetEl.classList.remove('text-gray-400', 'text-red-600');
            remainingBudgetEl.classList.add('text-green-600');
        } else if (remainingBudget < 0) {
            // Remove o sinal negativo usando Math.abs e muda o texto
            remainingBudgetEl.textContent = `${formatCurrency(Math.abs(remainingBudget))} ultrapassados`;
            remainingBudgetEl.classList.remove('text-gray-400', 'text-green-600');
            remainingBudgetEl.classList.add('text-red-600');
        } else {
            remainingBudgetEl.textContent = `${formatCurrency(0)} restantes`;
            remainingBudgetEl.classList.remove('text-green-600', 'text-red-600');
            remainingBudgetEl.classList.add('text-gray-400');
        }
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
        highPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'high' && !item.purchased).length;
    }

    const mediumPriorityItemsEl = document.getElementById('mediumPriorityItems');
    if (mediumPriorityItemsEl) {
        mediumPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'medium' && !item.purchased).length;
    }

    const lowPriorityItemsEl = document.getElementById('lowPriorityItems');
    if (lowPriorityItemsEl) {
        lowPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'low' && !item.purchased).length;
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
        const card = document.createElement('div');
        card.className = 'bg-white rounded-[2rem] overflow-hidden card-shadow hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer flex flex-col';
        
        // Criar colagem de imagens
        const images = room.referenceImages || [];
        let collageHtml = '';
        
        if (images.length > 0) {
            const gridClass = images.length === 1 ? 'grid-cols-1' : (images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2');
            collageHtml = `<div class="grid ${gridClass} gap-1 h-48 bg-purple-50 shrink-0">
                ${images.map(img => `<img src="${img}" class="w-full h-full object-cover">`).join('')}
            </div>`;
        } else {
            collageHtml = `<div class="h-48 bg-purple-50 flex items-center justify-center shrink-0">
                <i class="fas fa-palette text-purple-200 text-4xl"></i>
            </div>`;
        }

        card.onclick = () => window.location.href = `detail.html?id=${room.id}`;

        card.innerHTML = `
            ${collageHtml}
            <div class="p-6 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-4 gap-2">
                    <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-purple-900 group-hover:text-purple-600 transition truncate">${room.name}</h3>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${state.items.filter(i => i.category === room.name).length} itens</p>
                    </div>
                    <div class="flex space-x-1 shrink-0">
                        <button onclick="event.stopPropagation(); editRoom('${room.id}')" class="p-2 text-gray-400 hover:text-purple-600 transition"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="event.stopPropagation(); deleteRoom('${room.id}')" class="p-2 text-gray-400 hover:text-red-500 transition"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>
                
                <div class="mt-auto flex items-center space-x-2">
                    <div class="w-6 h-6 rounded-lg shadow-sm border border-white" style="background-color: ${room.primaryColor}"></div>
                    <div class="w-6 h-6 rounded-lg shadow-sm border border-white" style="background-color: ${room.secondaryColor}"></div>
                    <div class="w-6 h-6 rounded-lg shadow-sm border border-white" style="background-color: ${room.accentColor}"></div>
                    <div class="w-6 h-6 rounded-lg shadow-sm border border-white" style="background-color: ${room.neutralColor}"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderRoomDetail(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) {
        window.location.href = 'index.html';
        return;
    }

    // Título e Nome
    const nameEl = document.getElementById('roomDetailName');
    if (nameEl) nameEl.textContent = room.name;

    // Moodboard (Collage)
    const collageContainer = document.getElementById('roomDetailCollage');
    if (collageContainer) {
        const images = room.referenceImages || [];
        if (images.length > 0) {
            const gridClass = images.length === 1 ? 'grid-cols-1' : (images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2');
            collageContainer.className = `grid ${gridClass} gap-2 aspect-square rounded-2xl overflow-hidden bg-purple-50`;
            collageContainer.innerHTML = images.map(img => `<img src="${img}" class="w-full h-full object-cover">`).join('');
        } else {
            collageContainer.innerHTML = `<div class="col-span-2 flex flex-col items-center justify-center text-purple-200 p-8 text-center">
                <i class="fas fa-images text-4xl mb-2"></i>
                <p class="text-[10px] font-bold uppercase tracking-widest">Sem imagens de referência</p>
            </div>`;
        }
    }

    // Cores
    const colors = [
        { id: 'color1', val: room.primaryColor },
        { id: 'color2', val: room.secondaryColor },
        { id: 'color3', val: room.accentColor },
        { id: 'color4', val: room.neutralColor }
    ];
    colors.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.style.backgroundColor = c.val;
    });

    // Lista de Itens do Cômodo
    const itemsList = document.getElementById('roomItemsList');
    const emptyState = document.getElementById('emptyRoomItemsState');
    const totalEl = document.getElementById('roomDetailTotal');
    
    if (itemsList) {
        itemsList.innerHTML = '';
        const roomItems = state.items.filter(i => i.category === room.name);
        
        if (roomItems.length === 0) {
            emptyState?.classList.remove('hidden');
            totalEl.textContent = formatCurrency(0);
        } else {
            emptyState?.classList.add('hidden');
            let total = 0;
            
            roomItems.forEach(item => {
                total += parseFloat(item.price);
                const row = document.createElement('tr');
                row.className = 'hover:bg-purple-50 transition';
                row.innerHTML = `
                    <td class="py-4">
                        <div class="w-2 h-2 rounded-full ${item.purchased ? 'bg-green-500' : 'bg-gray-200'}"></div>
                    </td>
                    <td class="py-4">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-purple-900">${item.name}</span>
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${item.priority === 'high' ? 'Alta Prioridade' : (item.priority === 'medium' ? 'Média' : 'Baixa')}</span>
                        </div>
                    </td>
                    <td class="py-4 text-sm font-mono font-bold text-purple-600">${formatCurrency(item.price)}</td>
                    <td class="py-4 text-right">
                        <div class="flex justify-end space-x-1">
                            ${item.link ? `<a href="${item.link}" target="_blank" class="p-2 text-purple-400 hover:text-purple-600"><i class="fas fa-external-link-alt text-xs"></i></a>` : ''}
                            <button onclick="editItem('${item.id}')" class="p-2 text-gray-300 hover:text-purple-600"><i class="fas fa-edit text-xs"></i></button>
                        </div>
                    </td>
                `;
                itemsList.appendChild(row);
            });
            totalEl.textContent = formatCurrency(total);
        }
    }
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
    
    // Limpar imagens de preview (Apenas nos slots corretos)
    const imageLabels = document.querySelectorAll('.room-image-slot');
    imageLabels.forEach(label => {
        label.innerHTML = `<i class="fas fa-plus text-xs"></i><input type="file" class="hidden room-image-input" accept="image/*">`;
    });
}

export function openAddCategoryModal() { toggleModal('addCategoryModal', true); }
export function closeAddCategoryModal() { toggleModal('addCategoryModal', false); document.getElementById('categoryForm')?.reset(); }

export function openLogoutModal() { toggleModal('logoutModal', true); }
export function closeLogoutModal() { toggleModal('logoutModal', false); }

export function openShareModal(projectId) {
    const displayEl = document.getElementById('displayProjectId');
    if (displayEl) displayEl.textContent = projectId;
    toggleModal('shareModal', true);
}
export function closeShareModal() { toggleModal('shareModal', false); }

export function openDeleteConfirmModal(type) { 
    const id = type === 'item' ? 'deleteItemModal' : 'deleteRoomModal';
    toggleModal(id, true); 
}
export function closeDeleteConfirmModal(type) { 
    const id = type === 'item' ? 'deleteItemModal' : 'deleteRoomModal';
    toggleModal(id, false); 
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

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar?.classList.toggle('active');
    overlay?.classList.toggle('active');
}

export function closeAllModals() {
    closeAddItemModal();
    closeAddRoomModal();
    closeAddCategoryModal();
    closeLogoutModal();
    closeShareModal();
    closeDeleteConfirmModal('item');
    closeDeleteConfirmModal('room');
    closeRoomsSummaryModal();
    closePurchasedItemsModal();
    closeHighPriorityModal();
    closeCategoriesSummaryModal();
    toggleModal('messageModal', false);
    
    // Fechar sidebar se estiver aberta no mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar?.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay?.classList.remove('active');
    }
}

export function showAlert(message, title = 'Aviso', type = 'info', timeout = 0) {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageTitle');
        const contentEl = document.getElementById('messageContent');
        const confirmBtn = document.getElementById('messageConfirmBtn');
        const cancelBtn = document.getElementById('messageCancelBtn');
        const icon = document.getElementById('messageIcon');
        const iconContainer = document.getElementById('messageIconContainer');

        if (!modal) { console.warn("Modal de mensagem não encontrado"); resolve(); return; }

        titleEl.textContent = title;
        contentEl.textContent = message;
        cancelBtn.classList.add('hidden');
        confirmBtn.textContent = 'Entendi';
        confirmBtn.classList.remove('hidden');
        
        // Estilo baseado no tipo
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle text-red-500 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition';
        } else if (type === 'success') {
            icon.className = 'fas fa-check-circle text-green-500 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 transition';
        } else {
            icon.className = 'fas fa-info-circle text-purple-600 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition';
        }

        const handleConfirm = () => {
            if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
            toggleModal('messageModal', false);
            confirmBtn.removeEventListener('click', handleConfirm);
            resolve();
        };

        confirmBtn.addEventListener('click', handleConfirm);
        toggleModal('messageModal', true);

        // Fechamento automático se timeout for definido
        let autoCloseTimeout = null;
        if (timeout > 0) {
            confirmBtn.classList.add('hidden'); // Esconde o botão se for auto-close
            autoCloseTimeout = setTimeout(handleConfirm, timeout);
        }
    });
}

export function showConfirm(message, title = 'Confirmar', confirmText = 'Sim, continuar') {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageTitle');
        const contentEl = document.getElementById('messageContent');
        const confirmBtn = document.getElementById('messageConfirmBtn');
        const cancelBtn = document.getElementById('messageCancelBtn');
        const icon = document.getElementById('messageIcon');
        const iconContainer = document.getElementById('messageIconContainer');

        if (!modal) { resolve(false); return; }

        titleEl.textContent = title;
        contentEl.textContent = message;
        cancelBtn.classList.remove('hidden');
        confirmBtn.textContent = confirmText;
        
        icon.className = 'fas fa-question-circle text-purple-600 text-2xl';
        iconContainer.className = 'w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6';
        confirmBtn.className = 'flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition';

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        const cleanup = () => {
            toggleModal('messageModal', false);
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        toggleModal('messageModal', true);
    });
}

export function openRoomsSummaryModal() {
    renderRoomsSummary();
    toggleModal('roomsSummaryModal', true);
}

export function closeRoomsSummaryModal() {
    toggleModal('roomsSummaryModal', false);
}

export function renderRoomsSummary() {
    const container = document.getElementById('roomsSummaryContainer');
    const totalEl = document.getElementById('roomsSummaryTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    
    if (state.rooms.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum cômodo cadastrado.</p>';
        totalEl.textContent = formatCurrency(0);
        return;
    }

    let grandTotal = 0;

    state.rooms.forEach(room => {
        const roomTotal = parseFloat(room.totalEstimated || 0);
        grandTotal += roomTotal;

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 border border-purple-100';
        row.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full" style="background-color: ${room.primaryColor}"></div>
                <span class="font-bold text-purple-900">${room.name}</span>
            </div>
            <span class="font-mono font-bold text-purple-600">${formatCurrency(roomTotal)}</span>
        `;
        container.appendChild(row);
    });

    totalEl.textContent = formatCurrency(grandTotal);
}

export function openPurchasedItemsModal() {
    renderPurchasedItemsSummary();
    toggleModal('purchasedItemsModal', true);
}

export function closePurchasedItemsModal() {
    toggleModal('purchasedItemsModal', false);
}

export function renderPurchasedItemsSummary() {
    const container = document.getElementById('purchasedItemsContainer');
    const totalEl = document.getElementById('purchasedItemsTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    
    const purchasedItems = state.items.filter(item => item.purchased);
    
    if (purchasedItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item comprado ainda.</p>';
        totalEl.textContent = formatCurrency(0);
        return;
    }

    let totalGasto = 0;

    purchasedItems.forEach(item => {
        const price = parseFloat(item.price || 0);
        totalGasto += price;

        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-green-50/30 border border-green-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category}
                </span>
            </div>
            <span class="font-mono font-bold text-green-600 text-sm">${formatCurrency(price)}</span>
        `;
        container.appendChild(row);
    });

    totalEl.textContent = formatCurrency(totalGasto);
}

export function openHighPriorityModal() {
    renderHighPriorityItems();
    toggleModal('highPriorityModal', true);
}

export function closeHighPriorityModal() {
    toggleModal('highPriorityModal', false);
}

export function renderHighPriorityItems() {
    const container = document.getElementById('highPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const highPriorityItems = state.items.filter(item => item.priority === 'high' && !item.purchased);
    
    if (highPriorityItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de alta prioridade.</p>';
        return;
    }

    highPriorityItems.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-orange-50/30 border border-orange-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category}
                </span>
            </div>
            <span class="font-mono font-bold text-orange-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openMediumPriorityModal() {
    renderMediumPriorityItems();
    toggleModal('mediumPriorityModal', true);
}

export function closeMediumPriorityModal() {
    toggleModal('mediumPriorityModal', false);
}

export function renderMediumPriorityItems() {
    const container = document.getElementById('mediumPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const items = state.items.filter(item => item.priority === 'medium' && !item.purchased);
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de média prioridade.</p>';
        return;
    }

    items.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-amber-50/30 border border-amber-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category}
                </span>
            </div>
            <span class="font-mono font-bold text-amber-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openLowPriorityModal() {
    renderLowPriorityItems();
    toggleModal('lowPriorityModal', true);
}

export function closeLowPriorityModal() {
    toggleModal('lowPriorityModal', false);
}

export function renderLowPriorityItems() {
    const container = document.getElementById('lowPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const items = state.items.filter(item => item.priority === 'low' && !item.purchased);
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de baixa prioridade.</p>';
        return;
    }

    items.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-blue-50/30 border border-blue-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category}
                </span>
            </div>
            <span class="font-mono font-bold text-blue-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openCategoriesSummaryModal() {
    renderCategoriesSummary();
    toggleModal('categoriesSummaryModal', true);
}

export function closeCategoriesSummaryModal() {
    toggleModal('categoriesSummaryModal', false);
}

export function renderCategoriesSummary() {
    const container = document.getElementById('categoriesSummaryContainer');
    if (!container) return;

    container.innerHTML = '';
    
    if (state.rooms.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhuma categoria (cômodo) cadastrada.</p>';
        return;
    }

    state.rooms.forEach(room => {
        const itemCount = state.items.filter(i => i.category === room.name).length;
        const purchasedCount = state.items.filter(i => i.category === room.name && i.purchased).length;
        const progress = itemCount > 0 ? (purchasedCount / itemCount) * 100 : 0;

        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-purple-50/50 border border-purple-100';
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${room.primaryColor}"></div>
                    <span class="font-bold text-purple-900">${room.name}</span>
                </div>
                <span class="text-[10px] font-bold text-purple-400 uppercase">${purchasedCount}/${itemCount} itens</span>
            </div>
            <div class="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-purple-600 h-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderSavingsGrid() {
    const gridContainer = document.getElementById('savingsGrid');
    const container = document.getElementById('savingsContainer');
    const setupSection = document.getElementById('savingsSetup');
    const summarySection = document.getElementById('savingsSummary');
    const emptyState = document.getElementById('emptySavingsState');
    
    if (!gridContainer) return;

    if (!state.savingsGrid || state.savingsGrid.length === 0) {
        if (container) container.classList.add('hidden');
        if (summarySection) summarySection.classList.add('hidden');
        if (setupSection) setupSection.classList.remove('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        
        // Pre-fill inputs if state has data
        const targetInput = document.getElementById('savingsTargetInput');
        if (targetInput && state.savingsTarget) targetInput.value = state.savingsTarget;
        
        return;
    }

    if (container) container.classList.remove('hidden');
    if (summarySection) summarySection.classList.remove('hidden');
    if (setupSection) setupSection.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    gridContainer.innerHTML = '';
    
    let totalSaved = 0;
    state.savingsGrid.forEach((cell, index) => {
        if (cell.completed) totalSaved += cell.value;
        
        const cellEl = document.createElement('div');
        cellEl.className = `savings-cell ${cell.completed ? 'completed' : 'pending'}`;
        cellEl.dataset.index = index;
        
        cellEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span class="text-[10px] font-bold opacity-70">${index + 1}</span>
            <span class="text-xs font-black">${formatCurrency(cell.value)}</span>
        `;
        
        gridContainer.appendChild(cellEl);
    });

    // Update Summary
    const totalSavedDisplay = document.getElementById('totalSavedDisplay');
    const progressDisplay = document.getElementById('savingsProgressDisplay');
    const remainingDisplay = document.getElementById('remainingToSaveDisplay');

    if (totalSavedDisplay) totalSavedDisplay.textContent = formatCurrency(totalSaved);
    
    const progress = state.savingsTarget > 0 ? (totalSaved / state.savingsTarget) * 100 : 0;
    if (progressDisplay) progressDisplay.textContent = `${progress.toFixed(1)}%`;
    
    const remaining = state.savingsTarget - totalSaved;
    if (remainingDisplay) remainingDisplay.textContent = formatCurrency(remaining);
}

export function renderProjectMembers(members, currentUserEmail) {
    const listContainer = document.getElementById('projectMembersList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    if (members.length === 0) {
        listContainer.innerHTML = '<p class="text-[10px] text-gray-400 italic">Nenhum membro encontrado.</p>';
        return;
    }

    members.forEach(member => {
        const isMe = member.email === currentUserEmail;
        const memberEl = document.createElement('div');
        memberEl.className = 'flex items-center space-x-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-100/30 hover:bg-purple-100/50 transition';
        
        const photoContent = member.photoURL 
            ? `<img src="${member.photoURL}" class="w-full h-full object-cover rounded-full">`
            : `<i class="fas fa-user text-purple-600 text-xs"></i>`;

        memberEl.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                ${photoContent}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-purple-900 truncate">${member.name || 'Sem nome'}</p>
                <p class="text-[10px] text-purple-400 font-medium truncate">${member.email}</p>
            </div>
            <div class="shrink-0 text-right">
                <span class="px-2 py-1 bg-white rounded-lg text-[8px] font-black uppercase tracking-wider text-purple-400 border border-purple-100 shadow-sm">
                    ${isMe ? 'Você' : (member.role === 'owner' ? 'Dono' : 'Parceiro')}
                </span>
            </div>
        `;
        listContainer.appendChild(memberEl);
    });
}