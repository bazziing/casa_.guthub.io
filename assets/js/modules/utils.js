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

export function translateFirebaseError(error) {
    const code = error.code || error.message;
    
    // Mapeamento de códigos comuns do Firebase Auth
    const errors = {
        'auth/email-already-in-use': 'Este e-mail já está sendo utilizado por outra conta.',
        'auth/invalid-email': 'O e-mail digitado não é válido.',
        'auth/operation-not-allowed': 'O login com e-mail e senha não está habilitado.',
        'auth/weak-password': 'A senha digitada é muito fraca. Use pelo menos 6 caracteres.',
        'auth/user-disabled': 'Esta conta de usuário foi desativada.',
        'auth/user-not-found': 'Não encontramos nenhuma conta com este e-mail.',
        'auth/wrong-password': 'A senha está incorreta. Tente novamente.',
        'auth/invalid-credential': 'As credenciais de login são inválidas ou expiraram.',
        'auth/too-many-requests': 'Muitas tentativas de login sem sucesso. Tente mais tarde.',
        'auth/popup-closed-by-user': 'O popup de autenticação foi fechado antes de completar.',
        'auth/network-request-failed': 'Erro de rede. Verifique sua conexão com a internet.',
        'auth/internal-error': 'Ocorreu um erro interno no servidor. Tente novamente.'
    };

    // Tentar encontrar por código ou mensagem parcial
    for (const key in errors) {
        if (code.includes(key)) return errors[key];
    }

    return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
}

export function compressImage(file, { maxWidth = 500, maxHeight = 500, quality = 0.7 } = {}) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcula as novas dimensões mantendo o aspecto
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(blob => {
                    if (blob) {
                        // Cria um novo arquivo a partir do blob comprimido
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Erro ao processar imagem.'));
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = err => reject(err);
        };
        reader.onerror = err => reject(err);
    });
}