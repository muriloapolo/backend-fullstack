import express from 'express';
import mongoose from 'mongoose';
import Paciente from './models/Paciente.js';
import Medico from './models/Medico.js';
import Agendamento from './models/Agendamento.js';
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

// Middleware para permitir requisições de diferentes origens (CORS)
app.use(cors({
  origin: '*', // Permite todas as origens para simplificar o teste. Para produção, é recomendado especificar a URL do front-end.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());


// ======================================
// Rotas de Cadastro
// ======================================

// Rota para cadastrar um novo secretário e sua senha
app.post('/api/secretarios/register', async (req, res) => {
  try {
    const { nome, email, telefone, password } = req.body;
    
    if (!nome || !email || !telefone || !password) {
      return res.status(400).json({ message: 'Nome, e-mail, telefone e senha são obrigatórios.' });
    }

    const secretarioExistente = await Secretario.findOne({ email });
    if (secretarioExistente) {
        return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }

    // Criptografa a senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);

    // Cria o secretário
    const newSecretary = new Secretario({ nome, email, telefone, password: senhaHash });
    await newSecretary.save();

    res.status(201).json({ message: 'Secretário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do secretário:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para cadastrar um novo médico
app.post('/api/medicos/register', async (req, res) => {
  try {
    const { nome, email, cpf, crm, especialidade } = req.body;
    
    if (!nome || !email || !cpf || !crm || !especialidade) {
      return res.status(400).json({ message: 'Todos os campos do médico são obrigatórios.' });
    }

    const medicoExistente = await Medico.findOne({ email });
    if (medicoExistente) {
      return res.status(409).json({ message: 'Este e-mail, CPF ou CRM já está em uso.' });
    }

    // Cria o médico
    const newMedico = new Medico({ nome, email, cpf, crm, especialidade });
    await newMedico.save();

    res.status(201).json({ message: 'Médico cadastrado com sucesso!' });
  } catch (error) { 
    console.error('Erro no registro do médico:', error);
    res.status(500).json({ message: 'Erro interno do servidor, CPF / CRM já cadastradaso.' });
  }
});

// Rota para cadastrar um novo paciente
app.post('/api/pacientes/register', async (req, res) => {
  try {
    const { nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado } = req.body;
    
    if (!nome || !email || !cpf || !telefone || !cep) {
      return res.status(400).json({ message: 'Nome, e-mail, CPF, telefone e CEP são obrigatórios.' });
    }

    const pacienteExistente = await Paciente.findOne({ email });
    if (pacienteExistente) {
      return res.status(409).json({ message: 'Este e-mail ou CPF já está em uso.' });
    }

    // Cria o paciente
    const newPaciente = new Paciente({ nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado });
    await newPaciente.save();

    res.status(201).json({ message: 'Paciente cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro do paciente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// ======================================
// Rota de Login e Logout
// ======================================

app.post('/api/secretarios/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const secretario = await Secretario.findOne({ email });
    if (!secretario) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const isPasswordValid = await bcrypt.compare(password, secretario.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    res.status(200).json({
      message: 'Login bem-sucedido!',
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

// Função utilitária para converter "HH:mm" para minutos desde a meia-noite
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Nova Rota para agendamentos por médico e data, retornando APENAS horários disponíveis
app.get('/api/agendamentos/disponibilidade', async (req, res) => {
  try {
    const { medicoId, data } = req.query;
    if (!medicoId || !data) {
      return res.status(400).json({ message: 'ID do médico e data são obrigatórios.' });
    }

    // Busca todos os agendamentos existentes para o médico e a data selecionados
    const agendamentosExistentes = await Agendamento.find({ medicoId, data });
    
    // Converte os horários de agendamento para minutos para facilitar a comparação
    const horariosOcupadosEmMinutos = agendamentosExistentes.map(agendamento => ({
      inicio: timeToMinutes(agendamento.horario),
      fim: timeToMinutes(agendamento.horario) + agendamento.duracao,
    }));
    
    // Define o horário de início e fim do expediente do médico e a duração da consulta
    const inicioExpediente = 8 * 60; // 8:00
    const fimExpediente = 17 * 60; // 17:00
    const duracaoConsulta = 20;

    const horariosDisponiveis = [];

    // Itera sobre todos os possíveis horários de consulta
    for (let horario = inicioExpediente; horario < fimExpediente; horario += duracaoConsulta) {
      const fimHorario = horario + duracaoConsulta;
      let isDisponivel = true;
      
      // Verifica se o horário atual se sobrepõe a algum agendamento existente
      for (const ocupado of horariosOcupadosEmMinutos) {
        // Verifica se há sobreposição
        const sobreposicao = (horario >= ocupado.inicio && horario < ocupado.fim) ||
                             (fimHorario > ocupado.inicio && fimHorario <= ocupado.fim);
                             
        if (sobreposicao) {
          isDisponivel = false;
          break; // Sai do loop interno assim que encontrar um conflito
        }
      }

      // Se não houver sobreposição, adiciona o horário à lista de disponíveis
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

// Rota para criar um novo agendamento com verificação de conflito
app.post('/api/agendamentos', async (req, res) => {
    const { pacienteId, medicoId, data, horario } = req.body;
    const duracaoConsulta = 20; // 20 minutos por consulta, conforme especificado

    try {
        // Encontra todos os agendamentos existentes para o mesmo médico e na mesma data
        const agendamentosExistentes = await Agendamento.find({
            medicoId: medicoId,
            data: data
        });

        // Converte o horário da nova consulta e dos agendamentos existentes para minutos
        const novoAgendamentoInicioEmMinutos = timeToMinutes(horario);
        const novoAgendamentoFimEmMinutos = novoAgendamentoInicioEmMinutos + duracaoConsulta;

        // Itera sobre os agendamentos existentes para verificar conflitos
        for (const agendamentoExistente of agendamentosExistentes) {
            const agendamentoExistenteInicioEmMinutos = timeToMinutes(agendamentoExistente.horario);
            const agendamentoExistenteFimEmMinutos = agendamentoExistenteInicioEmMinutos + agendamentoExistente.duracao;

            // Verifica se há sobreposição de horários
            const sobreposicao = (
                (novoAgendamentoInicioEmMinutos >= agendamentoExistenteInicioEmMinutos && novoAgendamentoInicioEmMinutos < agendamentoExistenteFimEmMinutos) ||
                (novoAgendamentoFimEmMinutos > agendamentoExistenteInicioEmMinutos && novoAgendamentoFimEmMinutos <= agendamentoExistenteFimEmMinutos) ||
                (agendamentoExistenteInicioEmMinutos >= novoAgendamentoInicioEmMinutos && agendamentoExistenteInicioEmMinutos < novoAgendamentoFimEmMinutos)
            );

            if (sobreposicao) {
                // Se houver sobreposição, retorna um erro de conflito
                return res.status(409).json({ message: 'Conflito de horário. O médico já possui um agendamento nesse período.' });
            }
        }

        // Se não houver conflitos, cria o novo agendamento
        const novoAgendamento = new Agendamento({
            pacienteId,
            medicoId,
            data,
            horario,
            duracao: duracaoConsulta
        });

        // Salva o novo agendamento no banco de dados
        await novoAgendamento.save();

        // Retorna uma resposta de sucesso
        return res.status(201).json({ message: 'Atendimento agendado com sucesso!', agendamento: novoAgendamento });

    } catch (error) {
        console.error('Erro ao agendar atendimento:', error);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar agendar o atendimento.' });
    }
});


// ======================================
// Rotas Adicionais para Agendamentos
// ======================================

// Rota para buscar agendamentos com status 'Pendente'
app.get('/api/agendamentos/pendentes', async (req, res) => {
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

// Rota para buscar agendamentos com status 'Confirmado'
app.get('/api/agendamentos/confirmados', async (req, res) => {
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

// Rota para buscar agendamentos por data, agora com filtro de status opcional
app.get('/api/agendamentos/data/:data', async (req, res) => {
    const { data } = req.params;
    const { status } = req.query; // Pega o parâmetro de status da query
    
    try {
        // Constrói o objeto de busca com base na data e no status
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

// Rota para atualizar o status de um agendamento
app.put('/api/agendamentos/:id', async (req, res) => {
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


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
