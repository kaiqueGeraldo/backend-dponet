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
    // Verificar se as respostas existem e o número de respostas é igual ao número total de perguntas
    if (!req.session.respostas || req.session.respostas.length < perguntas.length) {
        return res.status(400).json({ mensagem: "Ainda há perguntas pendentes." });
    }

    const respostasArray = req.session.respostas;

    console.log("Calculando resultado...");

    // Adiciona um atraso de 1 segundo (1000ms) antes de calcular o resultado
    setTimeout(() => {
        const resultado = calcularPontuacao(respostasArray);

        // Destruir a sessão após calcular o resultado
        req.session.destroy((err) => {
            if (err) {
                console.error("Erro ao destruir sessão:", err);
                return res.status(500).json({ mensagem: "Erro ao finalizar a sessão." });
            }

            // Retornar o resultado final
            res.json({ resultado });
        });
    }, 500);  // Delay de 1 segundo para testar
};

