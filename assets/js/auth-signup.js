import { cloudService } from './classes/CloudService.js';
import { showAlert } from './modules/ui.js';
import { translateFirebaseError } from './modules/utils.js';

const signupForm = document.getElementById('signupForm');

if (signupForm) {
    const cepInput = document.getElementById('signupCep');
    const addressInput = document.getElementById('signupAddress');
    const neighborhoodInput = document.getElementById('signupNeighborhood');
    const cityInput = document.getElementById('signupCity');
    const numberInput = document.getElementById('signupNumber');

    // Busca de CEP automático
    if (cepInput) {
        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length !== 8) return;

            try {
                // Feedback visual simples
                cepInput.classList.add('animate-pulse');
                
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (data.erro) {
                    showAlert('CEP não encontrado.', 'Erro', 'error');
                } else {
                    addressInput.value = data.logradouro;
                    neighborhoodInput.value = data.bairro;
                    cityInput.value = `${data.localidade} - ${data.uf}`;
                    
                    // Focar no campo de número para o usuário completar
                    numberInput.focus();
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            } finally {
                cepInput.classList.remove('animate-pulse');
            }
        });
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('signupPhone').value;
        const cep = cepInput.value;
        const address = addressInput.value;
        const number = numberInput.value;
        const complement = document.getElementById('signupComplement').value;
        const neighborhood = neighborhoodInput.value;
        const city = cityInput.value;
        const password = document.getElementById('signupPassword').value;

        try {
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Criando conta...';

            await cloudService.signUp(email, password, { 
                name, 
                phone, 
                cep, 
                address: `${address}, ${number}${complement ? ' - ' + complement : ''}`,
                neighborhood,
                city
            });
            
            await showAlert('Conta criada com sucesso! Redirecionando...', 'Sucesso', 'success');
            window.location.href = '../../dashboard/index.html';
        } catch (error) {
            showAlert(translateFirebaseError(error), 'Erro no Cadastro', 'error');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Conta Grátis';
        }
    });
}
cloudService.onAuthChange((user) => {
    if (user) {
        window.location.href = '../../dashboard/index.html';
    }
});