import { state, elements } from './state.js';
import { formatCurrency } from './utils.js';

export function loadItemsFromLocalStorage() {
    const savedItems = localStorage.getItem('weddingHomeItems');
    const savedCategories = localStorage.getItem('weddingHomeCategories');
    const savedRooms = localStorage.getItem('weddingHomeRooms');
    const savedBudget = localStorage.getItem('weddingHomeBudget');
    const savedSavingsTarget = localStorage.getItem('weddingHomeSavingsTarget');
    const savedSavingsDate = localStorage.getItem('weddingHomeSavingsDate');
    const savedSavingsGrid = localStorage.getItem('weddingHomeSavingsGrid');
   
    try {
        if (savedItems) state.items = JSON.parse(savedItems);
        if (savedCategories) state.categories = JSON.parse(savedCategories);
        if (savedRooms) state.rooms = JSON.parse(savedRooms);
        
        if (savedBudget) {
            state.totalBudget = parseFloat(savedBudget);
            if (elements.totalBudget) elements.totalBudget.value = formatCurrency(state.totalBudget);
        }
        
        if (savedSavingsTarget) state.savingsTarget = parseFloat(savedSavingsTarget);

        // Proteção contra dados corrompidos "[object Object]"
        if (savedSavingsDate && savedSavingsDate !== "[object Object]") {
            state.savingsDate = JSON.parse(savedSavingsDate);
        }
        
        if (savedSavingsGrid && savedSavingsGrid !== "[object Object]") {
            state.savingsGrid = JSON.parse(savedSavingsGrid);
        }
    } catch (e) {
        console.warn("Cache local corrompido, limpando dados problemáticos...", e);
        // Não limpa tudo, apenas ignora o que deu erro para deixar o Firebase sobrescrever
    }
}

export function saveItemsToLocalStorage() {
    try {
        localStorage.setItem('weddingHomeItems', JSON.stringify(state.items));
        localStorage.setItem('weddingHomeCategories', JSON.stringify(state.categories));
        localStorage.setItem('weddingHomeRooms', JSON.stringify(state.rooms));
        localStorage.setItem('weddingHomeBudget', (state.totalBudget || 0).toString());
        
        localStorage.setItem('weddingHomeSavingsTarget', (state.savingsTarget || 0).toString());
        localStorage.setItem('weddingHomeSavingsDate', JSON.stringify(state.savingsDate || {}));
        localStorage.setItem('weddingHomeSavingsGrid', JSON.stringify(state.savingsGrid || []));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
    }
}