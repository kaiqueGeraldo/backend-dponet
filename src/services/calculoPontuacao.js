const calcularPontuacao = (respostas) => {
    const pilares = require('../data/pilares.json');
    const perguntas = require('../data/perguntas.json');

    // Função para calcular a pontuação de cada pilar
    const calcularPontuacaoPilar = () => {
        const pontuacoesPorPilar = {};

        // Verifica se todas as perguntas possuem uma resposta
        const todasPerguntasRespondidas = perguntas.every(pergunta =>
            respostas.some(resposta => resposta.pergunta_id === pergunta.id)
        );

        if (!todasPerguntasRespondidas) {
            return { mensagem: "Ainda há perguntas pendentes." };
        }

        perguntas.forEach(pergunta => {
            const pilar = pilares[pergunta.pilar_id];
            if (!pilar) {
                console.warn(`Pilar não encontrado para pilar_id: ${pergunta.pilar_id}`);
                return;
            }

            const respostaSelecionada = respostas.find(resposta => resposta.pergunta_id === pergunta.id);
            if (!respostaSelecionada) {
                console.warn(`Nenhuma resposta encontrada para pergunta ID: ${pergunta.id}`);
                return;
            }

            const opcaoEscolhida = pergunta.opcoes.find(opcao => opcao.resposta === respostaSelecionada.resposta);
            if (!opcaoEscolhida) {
                console.warn(`Opção não encontrada para pergunta ID: ${pergunta.id}, resposta: ${respostaSelecionada.resposta}`);
                return;
            }

            if (!pontuacoesPorPilar[pilar.nome]) {
                pontuacoesPorPilar[pilar.nome] = {
                    pontosObtidos: 0,
                    maxPontos: pilar.max_pontos,
                };
            }

            pontuacoesPorPilar[pilar.nome].pontosObtidos += opcaoEscolhida.pontos;
        });

        return pontuacoesPorPilar;
    };

    // Função para calcular a pontuação final com base nos pesos dos pilares
    const calcularPontuacaoFinal = (pontuacoesPorPilar) => {
        let pontuacaoTotal = 0;

        for (const pilarNome in pontuacoesPorPilar) {
            const pilar = Object.values(pilares).find(p => p.nome === pilarNome);
            if (!pilar) {
                console.warn(`Pilar não encontrado para o nome: ${pilarNome}`);
                continue;
            }

            const { pontosObtidos, maxPontos } = pontuacoesPorPilar[pilarNome];
            const porcentagem = (pontosObtidos / maxPontos) * 100;
            const impactoFinal = (porcentagem / 100) * pilar.peso;
            pontuacaoTotal += impactoFinal;
        }

        return pontuacaoTotal.toFixed(2);
    };

    // Função para classificar o risco com base na pontuação final
    const classificarRisco = (pontuacaoFinal) => {
        if (pontuacaoFinal == 0) return "Sem riscos";
        if (pontuacaoFinal <= 20) return "Risco muito baixo";
        if (pontuacaoFinal <= 40) return "Baixo risco";
        if (pontuacaoFinal <= 60) return "Médio risco";
        if (pontuacaoFinal <= 80) return "Alto risco";
        return "Risco crítico";
    };


    const pontuacoesPorPilar = calcularPontuacaoPilar();
    if (pontuacoesPorPilar.mensagem) return pontuacoesPorPilar;

    const pontuacaoFinal = parseFloat(calcularPontuacaoFinal(pontuacoesPorPilar));
    const risco = classificarRisco(pontuacaoFinal);

    return { pontuacaoFinal, risco };
};

module.exports = { calcularPontuacao };