import express from 'express';
import mongoose from 'mongoose';
import Paciente from './models/Paciente.js';
import Medico from './models/Medico.js';
import Agendamento from './models/Agendamento.js';
import User from './models/User.js';
import Secretario from './models/Secretario.js';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
const port = 3000;

// Configuração e conexão com o banco de dados
const DB_CONNECTION_STRING = 'mongodb+srv://muriloapolo:3DehqxNjNSloPV6R@db-unijorge-backend.xp0rfcg.mongodb.net/?retryWrites=true&w=majority&appName=db-unijorge-backend';
mongoose.connect(DB_CONNECTION_STRING);

const db = mongoose.connection;
db.on('error', (error) => console.error('Erro de conexão com o banco de dados:', error));
db.once('open', () => console.log('Conectado ao Banco de Dados!'));

// Middleware
app.use(cors());
app.use(express.json());

// ======================================
// Rotas de Cadastro
// ======================================

// Rota para cadastrar um novo secretário e seu usuário
app.post('/api/secretarios/register', async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    
    if (!nome || !email || !telefone) {
      return res.status(400).json({ message: 'Nome, e-mail e telefone são obrigatórios.' });
    }

    // Cria o secretário
    const newSecretary = new Secretario({ nome, email, telefone });
    await newSecretary.save();

    // Criptografa a senha antes de salvar
    const defaultPassword = "123456"; 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Cria o usuário para login com senha criptografada e o papel de recepcionista
    const newUser = new User({
      username: email,
      email,
      password: hashedPassword,
      role: 'recepcionista'
    });
    await newUser.save();

    res.status(201).json({ message: 'Secretário e usuário cadastrados com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do secretário:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para cadastrar um novo médico e seu usuário
app.post('/api/medicos/register', async (req, res) => {
  try {
    const { nome, email, cpf, crm, especialidade } = req.body;
    
    if (!nome || !email || !cpf || !crm || !especialidade) {
      return res.status(400).json({ message: 'Todos os campos do médico são obrigatórios.' });
    }

    // Cria o médico
    const newMedico = new Medico({ nome, email, cpf, crm, especialidade });
    await newMedico.save();

    // Criptografa a senha antes de salvar
    const defaultPassword = "123456";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Cria o usuário para login com senha criptografada e o papel de médico
    const newUser = new User({
      username: email,
      email,
      password: hashedPassword,
      role: 'medico'
    });
    await newUser.save();

    res.status(201).json({ message: 'Médico e usuário cadastrados com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do médico:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Este e-mail, CPF ou CRM já está em uso.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para cadastrar um novo paciente e seu usuário
app.post('/api/pacientes/register', async (req, res) => {
  try {
    const { nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado } = req.body;
    
    if (!nome || !email || !cpf || !telefone || !cep) {
      return res.status(400).json({ message: 'Nome, e-mail, CPF, telefone e CEP são obrigatórios.' });
    }

    // Cria o paciente
    const newPaciente = new Paciente({ nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado });
    await newPaciente.save();

    // Criptografa a senha antes de salvar
    const defaultPassword = "123456";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Cria o usuário para login com senha criptografada e o papel de paciente
    const newUser = new User({
      username: email,
      email,
      password: hashedPassword,
      role: 'paciente'
    });
    await newUser.save();

    res.status(201).json({ message: 'Paciente e usuário cadastrados com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do paciente:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Este e-mail ou CPF já está em uso.' });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// ======================================
// Rota de Login (agora para testes)
// ======================================

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Apenas para testes: verifica se o email e a senha são os valores fixos
    if (email === 'teste@teste.com' && password === '123456') {
      return res.status(200).json({
        message: 'Login de teste bem-sucedido.',
        user: { email: 'teste@teste.com', role: 'recepcionista' }
      });
    } else {
      return res.status(401).json({ message: 'E-mail ou senha de teste inválidos.' });
    }

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
});

// ======================================
// Rotas de Busca e Agendamento
// ======================================

// Rota para buscar paciente por CPF
app.get('/api/pacientes/cpf/:cpf', async (req, res) => {
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

// Rota para todas as especialidades únicas
app.get('/api/medicos/especialidades', async (req, res) => {
  try {
    const especialidades = await Medico.distinct('especialidade');
    res.status(200).json(especialidades);
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para médicos por especialidade
app.get('/api/medicos', async (req, res) => {
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

// Rota para agendamentos por médico e data
app.get('/api/agendamentos/disponibilidade', async (req, res) => {
  try {
    const { medicoId, data } = req.query;
    if (!medicoId || !data) {
      return res.status(400).json({ message: 'ID do médico e data são obrigatórios.' });
    }
    const agendamentos = await Agendamento.find({ medicoId: medicoId, data: data });
    res.status(200).json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para criar um novo agendamento
app.post('/api/agendamentos', async (req, res) => {
  try {
    const { pacienteId, medicoId, data, horario } = req.body;
    if (!pacienteId || !medicoId || !data || !horario) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    const novoAgendamento = new Agendamento({
      pacienteId,
      medicoId,
      data,
      horario,
      duracao: 20
    });
    await novoAgendamento.save();
    res.status(201).json({ message: 'Atendimento agendado com sucesso!' });
  } catch (error) {
    console.error('Erro ao agendar atendimento:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
