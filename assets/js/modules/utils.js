import { state } from './state.js';

export function calculateCurrentSpending() {
    // Valor do que já foi comprado
    state.currentSpending = state.items.reduce((total, item) => {
        return item.purchased ? total + parseFloat(item.price || 0) : total;
    }, 0);

    // Valor total planejado (tudo na lista)
    state.totalEstimated = state.items.reduce((total, item) => {
        return total + parseFloat(item.price || 0);
    }, 0);
}

export function getRoomColor(roomName, type) {
    const room = state.rooms.find(r => r.name === roomName);
    if (!room) return '#b399d4';
    switch(type) {
        case 'primary': return room.primaryColor;
        case 'secondary': return room.secondaryColor;
        case 'accent': return room.accentColor;
        case 'neutral': return room.neutralColor;
        default: return room.primaryColor;
    }
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}