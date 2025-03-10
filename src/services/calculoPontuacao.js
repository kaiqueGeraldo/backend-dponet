const calcularPontuacao = (respostas) => {
    let pilares, perguntas;

    try {
        pilares = require('../data/pilares.json');
        perguntas = require('../data/perguntas.json');
    } catch (error) {
        console.error("Erro ao carregar arquivos JSON:", error);
        return { mensagem: "Erro interno ao processar os dados." };
    }

    if (!Array.isArray(perguntas) || !respostas || !Array.isArray(respostas)) {
        return { mensagem: "Dados inválidos para o cálculo." };
    }

    const calcularDefasagemPorPilar = () => {
        const defasagemPorPilar = {};

        const todasPerguntasRespondidas = perguntas.every(pergunta =>
            respostas.some(resposta => resposta.pergunta_id === pergunta.id)
        );

        if (!todasPerguntasRespondidas) {
            return { mensagem: "Ainda há perguntas pendentes." };
        }

        perguntas.forEach(pergunta => {
            const pilar = pilares[pergunta.pilar_id];
            if (!pilar || !pergunta.opcoes || !Array.isArray(pergunta.opcoes)) {
                console.warn(`Dados inconsistentes para a pergunta ID: ${pergunta.id}`);
                return;
            }

            const respostaSelecionada = respostas.find(resposta => resposta.pergunta_id === pergunta.id);
            if (!respostaSelecionada) return;

            const opcaoEscolhida = pergunta.opcoes.find(opcao => opcao.resposta === respostaSelecionada.resposta);
            if (!opcaoEscolhida || typeof opcaoEscolhida.pontos !== "number") {
                console.warn(`Opção inválida para a pergunta ID: ${pergunta.id}`);
                return;
            }

            if (!defasagemPorPilar[pilar.nome]) {
                defasagemPorPilar[pilar.nome] = {
                    defasagem: 0,
                    maxPontos: pilar.max_pontos,
                    percentual: 0,
                    mensagem: "",
                    melhorias: []
                };
            }

            defasagemPorPilar[pilar.nome].defasagem += opcaoEscolhida.pontos;

            // Adicionar sugestões de melhoria diretamente das perguntas
            if (opcaoEscolhida.melhoria) {
                defasagemPorPilar[pilar.nome].melhorias.push(opcaoEscolhida.melhoria);
            }
        });

        // Converter os pontos de cada pilar para um percentual de deficiência
        Object.keys(defasagemPorPilar).forEach(pilarNome => {
            const pilar = defasagemPorPilar[pilarNome];
            pilar.percentual = ((pilar.defasagem / pilar.maxPontos) * 100).toFixed(2);
            pilar.mensagem = gerarMensagemFeedback(pilar.percentual);
        });

        return defasagemPorPilar;
    };

    const calcularDefasagemGeral = (defasagemPorPilar) => {
        let defasagemTotal = 0;

        for (const pilarNome in defasagemPorPilar) {
            const pilar = Object.values(pilares).find(p => p.nome === pilarNome);
            if (!pilar) continue;

            const { defasagem, maxPontos } = defasagemPorPilar[pilarNome];
            const porcentagem = (defasagem / maxPontos) * 100;
            const impactoFinal = (porcentagem / 100) * pilar.peso;
            defasagemTotal += impactoFinal;
        }

        return defasagemTotal.toFixed(2);
    };

    const classificarRisco = (defasagemTotal) => {
        if (defasagemTotal == 0) return "Nenhuma deficiência";
        if (defasagemTotal <= 20) return "Defasagem mínima";
        if (defasagemTotal <= 40) return "Defasagem moderada";
        if (defasagemTotal <= 60) return "Defasagem significativa";
        if (defasagemTotal <= 80) return "Defasagem grave";
        return "Defasagem crítica";
    };

    const gerarMensagemFeedback = (percentual) => {
        if (percentual == 0) return "Excelente! Nenhuma deficiência identificada.";
        if (percentual <= 20) return "Muito bom! Pequenos ajustes podem ser feitos.";
        if (percentual <= 40) return "Moderado. Você pode melhorar com algumas ações específicas.";
        if (percentual <= 60) return "Atenção! Algumas áreas precisam de melhorias significativas.";
        if (percentual <= 80) return "Preocupante. Muitas deficiências detectadas.";
        return "Crítico! Esse pilar exige atenção urgente.";
    };

    const defasagemPorPilar = calcularDefasagemPorPilar();
    if (defasagemPorPilar.mensagem) return defasagemPorPilar;

    const defasagemTotal = parseFloat(calcularDefasagemGeral(defasagemPorPilar));
    const risco = classificarRisco(defasagemTotal);

    return { defasagemTotal, risco, detalhesPilares: defasagemPorPilar };
};

module.exports = { calcularPontuacao };
