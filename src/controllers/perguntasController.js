const { calcularPontuacao } = require('../services/calculoPontuacao');
const perguntas = require('../data/perguntas.json');

// Retorna todas as perguntas do JSON
exports.getTodasPerguntas = (req, res) => {
    res.json(perguntas);
};

// Inicia a sessão do usuário para controlar o progresso nas perguntas
exports.getPerguntaAtual = (req, res) => {
    if (!req.session.perguntaIndex) {
        req.session.perguntaIndex = 0; // Define o índice inicial
        req.session.respostas = []; // Inicializa o array de respostas
    }

    const index = req.session.perguntaIndex;

    // Verifica se todas as perguntas já foram respondidas
    if (index >= perguntas.length) {
        return res.json({ mensagem: "Todas as perguntas foram respondidas!" });
    }

    res.json(perguntas[index]); // Retorna a pergunta atual
};

// Salva a resposta da pergunta atual e avança para a próxima
exports.responderPergunta = (req, res) => {
    const { resposta } = req.body; // Obtém a resposta do corpo da requisição

    // Se a sessão não estiver inicializada, a inicializa
    if (typeof req.session.perguntaIndex === "undefined") {
        req.session.perguntaIndex = 0;
        req.session.respostas = [];
    }

    const index = req.session.perguntaIndex;

    // Verifica se a pergunta atual existe
    if (!perguntas || !perguntas[index]) {
        console.error("Erro: Pergunta não encontrada no índice", index);
        return res.status(500).json({ mensagem: "Erro interno: pergunta não encontrada." });
    }

    console.log("Recebida resposta:", resposta);
    console.log("Pergunta ID:", perguntas[index].id);
    console.log("Índice da sessão antes:", req.session.perguntaIndex);

    // Salva a resposta da pergunta atual
    req.session.respostas.push({ pergunta_id: perguntas[index].id, resposta });
    req.session.perguntaIndex++; // Avança para a próxima pergunta

    console.log("Índice da sessão depois:", req.session.perguntaIndex);
    console.log("respostas length:", req.session.respostas.length);

    req.session.save((err) => {
        if (err) {
            console.error("Erro ao salvar sessão:", err);
            return res.status(500).json({ mensagem: "Erro ao salvar progresso da sessão." });
        }

        // Verifica se ainda há perguntas a serem respondidas
        if (req.session.perguntaIndex < perguntas.length) {
            res.json({ proximaPergunta: perguntas[req.session.perguntaIndex] });
        } else {
            res.json({ mensagem: "Todas as perguntas foram respondidas!" });
        }
    });
};

// Calcula o resultado final após todas as respostas
exports.calcularResultado = (req, res) => {
    try {
        // Verifica se a sessão e as respostas estão presentes
        if (!req.session || !req.session.respostas) {
            return res.status(400).json({ mensagem: "Nenhuma resposta foi encontrada na sessão." });
        }

        const respostasArray = req.session.respostas;

        // Verifica se todas as perguntas foram respondidas
        if (!Array.isArray(perguntas) || respostasArray.length < perguntas.length) {
            return res.status(400).json({ mensagem: "Ainda há perguntas pendentes." });
        }

        console.log("Calculando resultado...");

        setTimeout(() => {
            const resultado = calcularPontuacao(respostasArray); // Calcula a pontuação com base nas respostas

            if (resultado.mensagem) {
                return res.status(400).json({ mensagem: resultado.mensagem });
            }

            // Destroi a sessão após o cálculo do resultado
            req.session.destroy((err) => {
                if (err) {
                    console.error("Erro ao destruir sessão:", err);
                    return res.status(500).json({ mensagem: "Erro ao finalizar a sessão." });
                }

                res.json({ resultado }); // Retorna o resultado final
            });
        }, 500); // Pequeno atraso para simular processamento
    } catch (error) {
        console.error("Erro ao calcular resultado:", error);
        res.status(500).json({ mensagem: "Erro interno ao processar a pontuação." });
    }
};
