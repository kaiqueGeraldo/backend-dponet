const { calcularPontuacao } = require('../services/calculoPontuacao');
const perguntas = require('../data/perguntas.json');

// Retorna todas as perguntas do JSON
exports.getTodasPerguntas = (req, res) => {
    res.json(perguntas);
};

// Inicia a sessão do usuário para controlar o progresso nas perguntas
exports.getPerguntaAtual = (req, res) => {
    if (!req.session.perguntaIndex) {
        req.session.perguntaIndex = 0;
        req.session.respostas = [];
    }

    const index = req.session.perguntaIndex;

    if (index >= perguntas.length) {
        return res.json({ mensagem: "Todas as perguntas foram respondidas!" });
    }

    res.json(perguntas[index]);
};

// Salva a resposta da pergunta atual e avança para a próxima
exports.responderPergunta = (req, res) => {
    const { resposta } = req.body;

    if (typeof req.session.perguntaIndex === "undefined") {
        req.session.perguntaIndex = 0;
        req.session.respostas = [];
    }

    const index = req.session.perguntaIndex;

    if (!perguntas || !perguntas[index]) {
        console.error("Erro: Pergunta não encontrada no índice", index);
        return res.status(500).json({ mensagem: "Erro interno: pergunta não encontrada." });
    }

    console.log("Recebida resposta:", resposta);
    console.log("Pergunta ID:", perguntas[index].id);
    console.log("Índice da sessão antes:", req.session.perguntaIndex);

    // Salvar a resposta da pergunta
    req.session.respostas.push({ pergunta_id: perguntas[index].id, resposta });

    req.session.perguntaIndex++;

    console.log("Índice da sessão depois:", req.session.perguntaIndex);
    console.log("respostas lenght:", req.session.respostas.length);

    req.session.save((err) => {
        if (err) {
            console.error("Erro ao salvar sessão:", err);
            return res.status(500).json({ mensagem: "Erro ao salvar progresso da sessão." });
        }

        // Verifica se há mais perguntas
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
        if (!req.session || !req.session.respostas) {
            return res.status(400).json({ mensagem: "Nenhuma resposta foi encontrada na sessão." });
        }

        const respostasArray = req.session.respostas;

        if (!Array.isArray(perguntas) || respostasArray.length < perguntas.length) {
            return res.status(400).json({ mensagem: "Ainda há perguntas pendentes." });
        }

        console.log("Calculando resultado...");

        setTimeout(() => {
            const resultado = calcularPontuacao(respostasArray);

            if (resultado.mensagem) {
                return res.status(400).json({ mensagem: resultado.mensagem });
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error("Erro ao destruir sessão:", err);
                    return res.status(500).json({ mensagem: "Erro ao finalizar a sessão." });
                }

                res.json({ resultado });
            });
        }, 500);
    } catch (error) {
        console.error("Erro ao calcular resultado:", error);
        res.status(500).json({ mensagem: "Erro interno ao processar a pontuação." });
    }
};
