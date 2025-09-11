import express from 'express';
import Agendamento from '../models/Agendamento.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Middleware para encontrar um agendamento por ID
async function getAgendamento(req, res, next) {
    let agendamento;
    try {
        agendamento = await Agendamento.findById(req.params.id);
        if (agendamento == null) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.agendamento = agendamento;
    next();
}

// Rota 1: Criar um novo agendamento (POST)
// Essa rota é protegida e exige autenticação
router.post('/', auth, async (req, res) => {
    const agendamento = new Agendamento({
        paciente: req.body.paciente,
        cpf: req.body.cpf,
        medico: req.body.medico,
        data: req.body.data,
        horario: req.body.horario,
        duracao: req.body.duracao
    });
    try {
        const novoAgendamento = await agendamento.save();
        res.status(201).json(novoAgendamento);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota 2: Buscar todos os agendamentos (GET)
// Esta rota é pública e não exige autenticação para fins de demonstração
router.get('/', async (req, res) => {
    try {
        const agendamentos = await Agendamento.find();
        res.json(agendamentos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 3: Buscar agendamentos pendentes (GET)
// Essa rota é protegida e exige autenticação
router.get('/pendentes', auth, async (req, res) => {
    try {
        const agendamentos = await Agendamento.find({ status: 'pendente' });
        res.json(agendamentos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 4: Buscar agendamentos confirmados (GET)
// Essa rota é protegida e exige autenticação
router.get('/confirmados', auth, async (req, res) => {
    try {
        const agendamentos = await Agendamento.find({ status: 'confirmado' });
        res.json(agendamentos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota 5: Confirmar um agendamento (PUT)
// Essa rota é protegida e exige autenticação
router.put('/:id/confirmar', auth, getAgendamento, async (req, res) => {
    try {
        res.agendamento.status = 'confirmado';
        const agendamentoAtualizado = await res.agendamento.save();
        res.json(agendamentoAtualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rota 6: Deletar um agendamento (DELETE)
// Essa rota é protegida e exige autenticação
router.delete('/:id', auth, getAgendamento, async (req, res) => {
    try {
        await res.agendamento.deleteOne();
        res.json({ message: 'Agendamento removido com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;