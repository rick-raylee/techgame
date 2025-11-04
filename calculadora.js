/* === CALCULADORA INTERATIVA - JAVASCRIPT (AJUSTADO PARA CLASSE) === */

// Variável global para a instância da calculadora
let calculadora;

// Função utilitária para atualizar o rótulo do toggle de Imposto
function updateToggleLabel(inputId, toggleId) {
    const inputElement = document.getElementById(inputId);
    const toggleElement = document.getElementById(toggleId);
    
    if (inputElement && toggleElement) {
        if (inputId === 'imposto') {
            const value = parseFloat(inputElement.value) || 0;
            // Procura o elemento <label> dentro do mesmo grupo
            const labelElement = toggleElement.closest('.toggle-group').querySelector('label');
            if (labelElement) {
                // Atualiza o texto, arredondando para evitar muitas casas decimais
                labelElement.textContent = `Incluir Imposto (${value.toFixed(1)}%)`;
            }
        }
    }
}


/**
 * CLASSE PRINCIPAL DA CALCULADORA DE COMPRA
 * Gerencia a funcionalidade de cálculo, Toggles, Gráfico e interface.
 */
class CalculadoraInterativa {
    constructor() {
        this.resultadosDiv = document.getElementById('calculadoraResultados');
        this.historico = []; // Mantido como placeholder para o futuro
        this.graficoAtual = null; // Instância do Chart.js
        
        this.init();
    }

    /**
     * INICIALIZAÇÃO
     */
    init() {
        this.configurarValidacoes();

        // Configura o botão Calcular Compra para chamar o método da classe
        const btnCalcular = document.querySelector('.calc-section[data-section="compra"] .btn-calcular');
        if (btnCalcular) {
            btnCalcular.addEventListener('click', () => this.calcularCompra());
        }
        
        // Configura o input de imposto e os toggles para atualizar os rótulos e recalcular
        this.configurarToggles();
        
        // Exibir placeholder inicial
        this.limparResultados();

        console.log('Calculadora de Compra inicializada!');
    }

    /**
     * CONFIGURAR TOGGLES E LISTENERS
     */
    configurarToggles() {
        // Inicializa o rótulo do imposto com o valor padrão do input
        updateToggleLabel('imposto', 'toggleImposto');

        // Adiciona listener para recalcular o rótulo do imposto em tempo real
        document.getElementById('imposto')?.addEventListener('input', () => {
            updateToggleLabel('imposto', 'toggleImposto');
        });

        // Adiciona listeners aos toggles para recalcular (opcional, mas bom para UX)
        document.getElementById('toggleFrete')?.addEventListener('change', () => this.calcularCompra());
        document.getElementById('toggleImposto')?.addEventListener('change', () => this.calcularCompra());
    }

    /**
     * CONFIGURAR VALIDAÇÕES (Ligeiramente simplificado para remover a cor de erro no JS)
     */
    configurarValidacoes() {
        const inputs = document.querySelectorAll('input[type="number"]');
        
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                // A cor de erro é removida aqui. A validação mais estrita fica no clique do botão.
                e.target.style.borderColor = ''; 
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === '-' && parseFloat(input.min || 0) >= 0) {
                    e.preventDefault();
                }
            });
        });
    }

    /**
     * LIMPAR RESULTADOS
     */
    limparResultados() {
        this.resultadosDiv.innerHTML = `
            <div class="placeholder-resultado">
                <h3>Aguardando Cálculo</h3>
                <p>Preencha os campos e clique em calcular para ver o resumo e o gráfico.</p>
            </div>
        `;

        // Destruir gráfico se existir
        if (this.graficoAtual) {
            this.graficoAtual.destroy();
            this.graficoAtual = null;
        }
    }

    /**
     * EXIBIR RESULTADO (Adaptado para o novo HTML com Gráfico)
     */
    exibirResultado(dados) {
        const { totalFinal, parcelamento, subtotal, valorImposto, totalFrete, valorDesc, impostoPercentual, freteIncluido, impostoIncluido } = dados;

        const resultadoHTML = `
            <div class="resultado-visivel" style="width: 100%;">
                <div class="resultado-header">
                    <h3 style="color: var(--accent-primary);">Total Final da Compra</h3>
                    <p class="resultado-valor" style="font-size: 2.5em; color: var(--accent-secondary); margin-bottom: 5px;">R$ ${totalFinal.toFixed(2).replace('.', ',')}</p>
                    ${parcelamento}
                </div>

                <hr style="border-color: var(--border-color); margin: 20px 0;">

                <div class="resultado-detalhes">
                    <h4 style="color: var(--accent-primary);">Detalhamento dos Custos</h4>
                    <div class="detalhe-item" style="background: var(--bg-dark);">
                        <span class="detalhe-label">Subtotal (Produto)</span>
                        <span class="detalhe-valor" style="color: var(--text-primary);">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="detalhe-item" style="background: var(--bg-dark);">
                        <span class="detalhe-label">Imposto (${impostoPercentual.toFixed(1)}%)</span>
                        <span class="detalhe-valor" style="color: ${impostoIncluido && valorImposto > 0 ? 'var(--accent-secondary)' : 'var(--accent-primary)'};">R$ ${valorImposto.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="detalhe-item" style="background: var(--bg-dark);">
                        <span class="detalhe-label">Frete</span>
                        <span class="detalhe-valor" style="color: ${freteIncluido && totalFrete > 0 ? 'var(--accent-secondary)' : 'var(--accent-primary)'};">R$ ${totalFrete.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="detalhe-item" style="background: var(--bg-dark);">
                        <span class="detalhe-label">Desconto à vista (${(dados.desc * 100).toFixed(1)}%)</span>
                        <span class="detalhe-valor" style="color: var(--accent-primary);">-R$ ${valorDesc.toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                
                <hr style="border-color: var(--border-color); margin: 20px 0;">

                <div class="resultado-grafico" style="width: 100%;">
                    <h4 style="color: var(--accent-primary); text-align: center;">Composição do Custo Final</h4>
                    <canvas id="graficoCanvas"></canvas>
                </div>
            </div>
        `;
        
        this.resultadosDiv.innerHTML = resultadoHTML;
        
        // 5. Renderiza o gráfico
        // O valor base é o subtotal - o desconto
        this.renderizarGrafico(subtotal - valorDesc, valorImposto, totalFrete);
    }
    
    /**
     * RENDERIZAÇÃO DO GRÁFICO (Chart.js)
     */
    renderizarGrafico(valorBase, valorImposto, valorFrete) {
        // Destrói a instância anterior do gráfico, se existir
        if (this.graficoAtual) {
            this.graficoAtual.destroy();
        }
        
        // Remove os valores zero para evitar fatias invisíveis
        const labels = [];
        const data = [];
        const colors = [];

        if (valorBase > 0) {
            labels.push('Valor Base (Produto c/ Desconto)');
            data.push(valorBase);
            colors.push('#00ffcc'); // Accent Primary
        }
        if (valorImposto > 0) {
            labels.push('Imposto');
            data.push(valorImposto);
            colors.push('#ff4444'); // Accent Secondary
        }
        if (valorFrete > 0) {
            labels.push('Frete');
            data.push(valorFrete);
            colors.push('#667eea'); // Terciária
        }

        if (data.length === 0) return;

        const ctx = document.getElementById('graficoCanvas')?.getContext('2d');
        
        if (!ctx) return; 

        // Cria a nova instância e armazena
        this.graficoAtual = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += 'R$ ' + context.parsed.toFixed(2).replace('.', ',');
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * MÉTODO DE CÁLCULO DA COMPRA
     */
    calcularCompra() {
        // 1. Validar inputs essenciais
        if (!this.validarInputs(['preco', 'quantidade', 'frete', 'imposto', 'parcelas', 'desconto'])) {
            return;
        }

        // 2. Coletar e converter valores
        const preco = parseFloat(document.getElementById('preco').value) || 0;
        const qtd   = parseInt(document.getElementById('quantidade').value) || 1;
        let frete   = parseFloat(document.getElementById('frete').value) || 0;
        let imp     = parseFloat(document.getElementById('imposto').value) / 100 || 0;
        const parc  = parseInt(document.getElementById('parcelas').value) || 1;
        const desc  = parseFloat(document.getElementById('desconto').value) / 100 || 0;

        // Coleta o estado dos toggles
        const incluirFrete = document.getElementById('toggleFrete')?.checked ?? true; 
        const incluirImposto = document.getElementById('toggleImposto')?.checked ?? true; 

        // 3. Aplica Toggles
        if (!incluirFrete) {
            frete = 0;
        }
        if (!incluirImposto) {
            imp = 0;
        }

        // 4. Executar o cálculo
        const subtotal      = preco * qtd;
        const valorImposto  = subtotal * imp;
        const totalImposto  = subtotal + valorImposto;
        const totalFrete    = frete; 
        const totalSemDesc  = totalImposto + totalFrete;
        const valorDesc     = totalSemDesc * desc;
        const totalFinal    = totalSemDesc - valorDesc;
        const parcela       = totalFinal / parc;

        // 5. Preparar dados para exibição (passando todos os detalhes)
        const dadosExibicao = {
            tipo: 'compra',
            totalFinal: totalFinal,
            subtotal: subtotal,
            valorImposto: valorImposto,
            totalFrete: totalFrete,
            valorDesc: valorDesc,
            impostoPercentual: (imp * 100),
            desc: desc,
            freteIncluido: incluirFrete,
            impostoIncluido: incluirImposto,
            parcelamento: parc > 1 
                ? `<p><strong>Parcelamento:</strong> ${parc}x de R$ ${parcela.toFixed(2).replace('.', ',')} (sem juros)</p>` 
                : '',
        };

        // 6. Exibir resultado e renderizar gráfico
        this.exibirResultado(dadosExibicao);
    }

    // --- Métodos utilitários (Mantidos da sua estrutura) ---
    validarInputs(ids) {
        // Lógica de validação...
        for (let id of ids) {
            const elemento = document.getElementById(id);
            if (!elemento) continue;

            const valor = elemento.value.trim();
            
            if (valor === '' || valor === null) {
                elemento.focus();
                elemento.style.borderColor = '#ff4444'; // Cor de erro
                return false;
            }

            if (elemento.type === 'number') {
                const num = parseFloat(valor);
                const min = parseFloat(elemento.min || -Infinity);
                const max = parseFloat(elemento.max || Infinity);

                if (isNaN(num) || num < min || num > max) {
                    elemento.focus();
                    elemento.style.borderColor = '#ff4444'; // Cor de erro
                    return false;
                }
            }
            // Resetar a cor da borda se a validação passar
            elemento.style.borderColor = '#00ffcc'; 
        }
        return true;
    }

    compartilharResultado() {
        const resultadoTexto = this.resultadosDiv.querySelector('.resultado-valor')?.textContent;
        const tipoCalculo = 'Calculadora de Compra';

        if (!resultadoTexto) return;

        const texto = `Meu resultado da Compra (Tech Game): Total a Pagar ${resultadoTexto}.`;

        if (navigator.share) {
            navigator.share({
                title: tipoCalculo,
                text: texto
            }).catch(err => console.log('Erro ao compartilhar:', err));
        } else {
            navigator.clipboard.writeText(texto).then(() => {
                alert('Resultado copiado para área de transferência!');
            });
        }
    }
    
    // Métodos de histórico mantidos como stubs
    adicionarAoHistorico(dados) {}
    atualizarHistoricoUI() {}
    verDetalheHistorico(index) {}
    obterTituloCalculo(tipo) { return 'Cálculo de Compra'; }
}

// Inicializa a instância da calculadora quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    calculadora = new CalculadoraInterativa();
});