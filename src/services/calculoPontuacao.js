const calcularPontuacao = (respostas) => {
    let pilares, perguntas;

    try {
        // Carrega os arquivos JSON contendo os pilares e as perguntas
        pilares = require('../data/pilares.json');
        perguntas = require('../data/perguntas.json');
    } catch (error) {
        console.error("Erro ao carregar arquivos JSON:", error);
        return { mensagem: "Erro interno ao processar os dados." };
    }

    // Validações iniciais para garantir que os dados são válidos
    if (!Array.isArray(perguntas) || !respostas || !Array.isArray(respostas)) {
        return { mensagem: "Dados inválidos para o cálculo." };
    }

    const calcularDefasagemPorPilar = () => {
        const defasagemPorPilar = {};

        // Verifica se todas as perguntas possuem uma resposta
        const todasPerguntasRespondidas = perguntas.every(pergunta =>
            respostas.some(resposta => resposta.pergunta_id === pergunta.id)
        );

        if (!todasPerguntasRespondidas) {
            return { mensagem: "Ainda há perguntas pendentes." };
        }

        // Percorre todas as perguntas para calcular a defasagem por pilar
        perguntas.forEach(pergunta => {
            const pilar = pilares[pergunta.pilar_id];
            if (!pilar || !pergunta.opcoes || !Array.isArray(pergunta.opcoes)) {
                console.warn(`Dados inconsistentes para a pergunta ID: ${pergunta.id}`);
                return;
            }

            // Obtém a resposta selecionada para a pergunta
            const respostaSelecionada = respostas.find(resposta => resposta.pergunta_id === pergunta.id);
            if (!respostaSelecionada) return;

            // Encontra a opção escolhida dentro da pergunta
            const opcaoEscolhida = pergunta.opcoes.find(opcao => opcao.resposta === respostaSelecionada.resposta);
            if (!opcaoEscolhida || typeof opcaoEscolhida.pontos !== "number") {
                console.warn(`Opção inválida para a pergunta ID: ${pergunta.id}`);
                return;
            }

            // Inicializa o pilar caso ele ainda não tenha sido adicionado ao objeto
            if (!defasagemPorPilar[pilar.nome]) {
                defasagemPorPilar[pilar.nome] = {
                    defasagem: 0,
                    maxPontos: pilar.max_pontos,
                    percentual: 0,
                    mensagem: "",
                    melhorias: []
                };
            }

            // Soma a pontuação da resposta ao total do pilar correspondente
            defasagemPorPilar[pilar.nome].defasagem += opcaoEscolhida.pontos;

            // Adiciona sugestões de melhoria caso existam
            if (opcaoEscolhida.melhoria) {
                defasagemPorPilar[pilar.nome].melhorias.push(opcaoEscolhida.melhoria);
            }
        });

        // Calcula o percentual de deficiência de cada pilar
        Object.keys(defasagemPorPilar).forEach(pilarNome => {
            const pilar = defasagemPorPilar[pilarNome];
            pilar.percentual = ((pilar.defasagem / pilar.maxPontos) * 100).toFixed(2);
            pilar.mensagem = gerarMensagemFeedback(pilar.percentual);
        });

        return defasagemPorPilar;
    };

    const calcularDefasagemGeral = (defasagemPorPilar) => {
        let defasagemTotal = 0;

        // Calcula a defasagem total considerando o peso de cada pilar
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

    // Classifica o risco com base na defasagem total
    const classificarRisco = (defasagemTotal) => {
        if (defasagemTotal == 0) return "Nenhuma deficiência";
        if (defasagemTotal <= 20) return "Defasagem mínima";
        if (defasagemTotal <= 40) return "Defasagem moderada";
        if (defasagemTotal <= 60) return "Defasagem significativa";
        if (defasagemTotal <= 80) return "Defasagem grave";
        return "Defasagem crítica";
    };

    // Gera uma mensagem de feedback com base no percentual de deficiência
    const gerarMensagemFeedback = (percentual) => {
        if (percentual == 0) return "Excelente! Nenhuma deficiência identificada.";
        if (percentual <= 20) return "Muito bom! Pequenos ajustes podem ser feitos.";
        if (percentual <= 40) return "Moderado. Você pode melhorar com algumas ações específicas.";
        if (percentual <= 60) return "Atenção! Algumas áreas precisam de melhorias significativas.";
        if (percentual <= 80) return "Preocupante. Muitas deficiências detectadas.";
        return "Crítico! Esse pilar exige atenção urgente.";
    };

    // Calcula a defasagem por pilar
    const defasagemPorPilar = calcularDefasagemPorPilar();
    if (defasagemPorPilar.mensagem) return defasagemPorPilar;

    // Calcula a defasagem total e classifica o risco
    const defasagemTotal = parseFloat(calcularDefasagemGeral(defasagemPorPilar));
    const risco = classificarRisco(defasagemTotal);

    return { defasagemTotal, risco, detalhesPilares: defasagemPorPilar };
};

module.exports = { calcularPontuacao };
