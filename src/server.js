const express = require('express');
const cors = require('cors');
const session = require('express-session');
const perguntasRoutes = require('./routes/perguntasRouters');

const app = express();

app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'chave-secreta',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use('/api', perguntasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
