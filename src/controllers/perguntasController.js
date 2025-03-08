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
        req.session.respostas = []; // Garante que respostas seja um array
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

    // Se a sessão não estiver inicializada, inicializa corretamente
    if (typeof req.session.perguntaIndex === "undefined") {
        req.session.perguntaIndex = 0;
        req.session.respostas = [];
    }

    const index = req.session.perguntaIndex;

    // Garante que a pergunta existe antes de tentar acessar
    if (!perguntas || !perguntas[index]) {
        console.error("Erro: Pergunta não encontrada no índice", index);
        return res.status(500).json({ mensagem: "Erro interno: pergunta não encontrada." });
    }

    console.log("Recebida resposta:", resposta);
    console.log("Pergunta ID:", perguntas[index].id);

    req.session.respostas.push({ pergunta_id: perguntas[index].id, resposta });

    // Atualiza o índice corretamente
    req.session.perguntaIndex++;

    // Salva explicitamente a sessão antes de responder
    req.session.save((err) => {
        if (err) {
            console.error("Erro ao salvar sessão:", err);
            return res.status(500).json({ mensagem: "Erro ao salvar progresso da sessão." });
        }

        if (req.session.perguntaIndex < perguntas.length) {
            res.json({ proximaPergunta: perguntas[req.session.perguntaIndex] });
        } else {
            res.json({ mensagem: "Todas as perguntas foram respondidas!" });
        }
    });
};

// Calcula o resultado final após todas as respostas
exports.calcularResultado = (req, res) => {
    if (!req.session.respostas || req.session.respostas.length < perguntas.length) {
        return res.status(400).json({ mensagem: "Ainda há perguntas pendentes." });
    }

    // Converter objeto de respostas da sessão para um array de respostas
    const respostasArray = req.session.respostas;

    const resultado = calcularPontuacao(respostasArray);

    // Reseta a sessão após calcular o resultado
    req.session.destroy();

    res.json({ resultado });
};

