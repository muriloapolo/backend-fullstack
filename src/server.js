import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import Paciente from './models/Paciente.js';
import Medico from './models/Medico.js';
import Agendamento from './models/Agendamento.js';
import Secretario from './models/Secretario.js';
import bcrypt from 'bcrypt';
import cors from 'cors';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// A variável de ambiente para a chave secreta do JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERRO: JWT_SECRET não está definida no arquivo .env.");
  process.exit(1);
}

// Configuração e conexão com o banco de dados
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
mongoose.connect(DB_CONNECTION_STRING);

const db = mongoose.connection;
db.on('error', (error) => console.error('Erro de conexão com o banco de dados:', error));
db.once('open', () => console.log('Conectado ao Banco de Dados!'));

// Opções de CORS para permitir requisições de diferentes origens
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ======================================
// Middleware de Autenticação JWT
// ======================================
const authMiddleware = (req, res, next) => {
  // Pega o token do cabeçalho 'Authorization'
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido. Acesso negado.' });
  }

  // O header geralmente vem como "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido.' });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Adiciona as informações do usuário (payload do token) ao objeto 'req'
    req.user = decoded;

    // Continua para a próxima função (a rota original)
    next();
  } catch (error) {
    // Se o token for inválido ou expirado
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// ======================================
// NOVO Middleware para checar a Função (Role)
// ======================================
const secretarioAuthMiddleware = (req, res, next) => {
  // Usa o middleware de autenticação padrão primeiro
  authMiddleware(req, res, () => {
    // Se a requisição passou do authMiddleware, o objeto req.user existe
    if (req.user && req.user.role === 'secretario') {
      next(); // Permite o acesso
    } else {
      // Acesso negado se o usuário não for um secretário
      res.status(403).json({ message: 'Acesso negado. Apenas secretários podem realizar esta ação.' });
    }
  });
};

// ======================================
// Rotas de Cadastro (Públicas)
// ======================================
app.get('/', async (req, res) => {
  res.send("Hello World");
});

app.post('/api/secretarios/register', async (req, res) => {
  try {
    const { nome, email, telefone, password, cpf } = req.body;
    if (!nome || !email || !telefone || !password, !cpf) {
      return res.status(400).json({ message: 'Todos os dados são obrigatórios.' });
    }
    const secretarioExistente = await Secretario.findOne({ cpf });
    if (secretarioExistente) {
      return res.status(409).json({ message: 'Este CPF já está cadastrado.' });
    }
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);
    const newSecretary = new Secretario({ nome, email, cpf, telefone, password: senhaHash });
    await newSecretary.save();
    res.status(201).json({ message: 'Secretário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do secretário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/medicos/register', async (req, res) => {
  try {
    const { nome, email, cpf, crm, especialidade } = req.body;
    if (!nome || !email || !cpf || !crm || !especialidade) {
      return res.status(400).json({ message: 'Todos os campos do médico são obrigatórios.' });
    }
    const medicoExistente = await Medico.findOne({
      $or: [{ email: email }, { cpf: cpf }, { crm: crm }]
    });
    if (medicoExistente) {
      return res.status(409).json({ message: 'Este e-mail, CPF ou CRM já está em uso.' });
    }
    const newMedico = new Medico({ nome, email, cpf, crm, especialidade });
    await newMedico.save();
    res.status(201).json({ message: 'Médico cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do médico:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/pacientes/register', async (req, res) => {
  try {
    const { nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado } = req.body;
    if (!nome || !email || !cpf || !telefone || !cep) {
      return res.status(400).json({ message: 'Nome, e-mail, CPF, telefone e CEP são obrigatórios.' });
    }
    const pacienteExistente = await Paciente.findOne({
      $or: [{ email: email }, { cpf: cpf }]
    });
    if (pacienteExistente) {
      return res.status(409).json({ message: 'Este e-mail ou CPF já está em uso.' });
    }
    const newPaciente = new Paciente({ nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado });
    await newPaciente.save();
    res.status(201).json({ message: 'Paciente cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// ======================================
// Rota de Login (Pública)
// ======================================
app.post('/api/secretarios/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const secretario = await Secretario.findOne({ email });

    if (!secretario || !(await bcrypt.compare(password, secretario.password))) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    // Payload do token
    const payload = {
      id: secretario._id,
      email: secretario.email,
      role: 'secretario' // Informação crucial para o middleware
    };

    // Cria o token com a chave secreta e um tempo de expiração
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token, // Envia o token para o front-end
      user: {
        email: secretario.email,
        role: 'secretario',
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
});

app.post('/api/secretarios/logout', (req, res) => {
  res.status(200).json({ message: 'Logout bem-sucedido.' });
});

// ======================================
// Rotas Protegidas pelo Middleware de Secretário
// ======================================
// Todas as rotas abaixo só podem ser acessadas por um usuário que é um secretário logado.

app.get('/api/pacientes/cpf/:cpf', secretarioAuthMiddleware, async (req, res) => {
  try {
    const cpf = req.params.cpf;
    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ message: 'CPF inválido. Por favor, digite 11 dígitos.' });
    }
    const paciente = await Paciente.findOne({ cpf: cpf });
    if (paciente) {
      res.status(200).json(paciente);
    } else {
      res.status(404).json({ message: 'Paciente não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao buscar paciente por CPF:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/medicos/especialidades', secretarioAuthMiddleware, async (req, res) => {
  try {
    const especialidades = await Medico.distinct('especialidade');
    res.status(200).json(especialidades);
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/medicos', secretarioAuthMiddleware, async (req, res) => {
  try {
    const { especialidade } = req.query;
    if (!especialidade) {
      return res.status(400).json({ message: 'A especialidade é obrigatória.' });
    }
    const medicos = await Medico.find({ especialidade: especialidade });
    if (medicos.length > 0) {
      res.status(200).json(medicos);
    } else {
      res.status(404).json({ message: 'Nenhum médico encontrado para esta especialidade.' });
    }
  } catch (error) {
    console.error('Erro ao buscar médicos por especialidade:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/agendamentos', secretarioAuthMiddleware, async (req, res) => {
  const { pacienteId, medicoId, data, horario } = req.body;
  const duracaoConsulta = 20;

  try {
    const agendamentosExistentes = await Agendamento.find({ medicoId: medicoId, data: data });
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const novoAgendamentoInicioEmMinutos = timeToMinutes(horario);
    const novoAgendamentoFimEmMinutos = novoAgendamentoInicioEmMinutos + duracaoConsulta;

    for (const agendamentoExistente of agendamentosExistentes) {
      const agendamentoExistenteInicioEmMinutos = timeToMinutes(agendamentoExistente.horario);
      const agendamentoExistenteFimEmMinutos = agendamentoExistenteInicioEmMinutos + agendamentoExistente.duracao;

      const sobreposicao = (
        (novoAgendamentoInicioEmMinutos >= agendamentoExistenteInicioEmMinutos && novoAgendamentoInicioEmMinutos < agendamentoExistenteFimEmMinutos) ||
        (novoAgendamentoFimEmMinutos > agendamentoExistenteInicioEmMinutos && novoAgendamentoFimEmMinutos <= agendamentoExistenteFimEmMinutos) ||
        (agendamentoExistenteInicioEmMinutos >= novoAgendamentoInicioEmMinutos && agendamentoExistenteInicioEmMinutos < novoAgendamentoFimEmMinutos)
      );

      if (sobreposicao) {
        return res.status(409).json({ message: 'Conflito de horário. O médico já possui um agendamento nesse período.' });
      }
    }

    const novoAgendamento = new Agendamento({
      pacienteId, medicoId, data, horario, duracao: duracaoConsulta
    });

    await novoAgendamento.save();
    return res.status(201).json({ message: 'Atendimento agendado com sucesso!', agendamento: novoAgendamento });

  } catch (error) {
    console.error('Erro ao agendar atendimento:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao tentar agendar o atendimento.' });
  }
});

app.get('/api/agendamentos/disponibilidade', secretarioAuthMiddleware, async (req, res) => {
  try {
    const { medicoId, data } = req.query;
    if (!medicoId || !data) {
      return res.status(400).json({ message: 'ID do médico e data são obrigatórios.' });
    }
    const agendamentosExistentes = await Agendamento.find({ medicoId, data });
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const horariosOcupadosEmMinutos = agendamentosExistentes.map(agendamento => ({
      inicio: timeToMinutes(agendamento.horario),
      fim: timeToMinutes(agendamento.horario) + agendamento.duracao,
    }));
    const inicioExpediente = 8 * 60;
    const fimExpediente = 17 * 60;
    const duracaoConsulta = 20;
    const horariosDisponiveis = [];
    for (let horario = inicioExpediente; horario < fimExpediente; horario += duracaoConsulta) {
      const fimHorario = horario + duracaoConsulta;
      let isDisponivel = true;
      for (const ocupado of horariosOcupadosEmMinutos) {
        const sobreposicao = (horario >= ocupado.inicio && horario < ocupado.fim) ||
          (fimHorario > ocupado.inicio && fimHorario <= ocupado.fim);
        if (sobreposicao) {
          isDisponivel = false;
          break;
        }
      }
      if (isDisponivel) {
        const hours = Math.floor(horario / 60);
        const minutes = horario % 60;
        const horaFormatada = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        horariosDisponiveis.push(horaFormatada);
      }
    }
    res.status(200).json(horariosDisponiveis);
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/agendamentos/pendentes', secretarioAuthMiddleware, async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({ status: 'Pendente' })
      .populate('pacienteId')
      .populate('medicoId');
    res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/agendamentos/confirmados', secretarioAuthMiddleware, async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({ status: 'Confirmado' })
      .populate('pacienteId')
      .populate('medicoId');
    res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos confirmados:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/agendamentos/data/:data', secretarioAuthMiddleware, async (req, res) => {
  const { data } = req.params;
  const { status } = req.query;
  try {
    const query = { data: data };
    if (status) {
      query.status = status;
    }
    const agendamentos = await Agendamento.find(query)
      .populate('pacienteId')
      .populate('medicoId');
    if (agendamentos.length > 0) {
      res.status(200).json(agendamentos);
    } else {
      res.status(404).json({ message: 'Nenhum agendamento encontrado para esta data.' });
    }
  } catch (error) {
    console.error('Erro ao buscar agendamentos por data:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.put('/api/agendamentos/:id', secretarioAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const agendamentoAtualizado = await Agendamento.findByIdAndUpdate(id, { status: status }, { new: true });
    if (!agendamentoAtualizado) {
      return res.status(404).json({ message: 'Agendamento não encontrado.' });
    }
    res.status(200).json({
      message: `Agendamento atualizado para o status: ${agendamentoAtualizado.status}.`,
      agendamento: agendamentoAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
