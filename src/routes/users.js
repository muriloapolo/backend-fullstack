import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Medico from '../models/Medico.js';
import Paciente from '../models/Paciente.js';
import Secretario from '../models/Secretario.js';

const router = express.Router();

const JWT_SECRET = '3DehqxNjNSloPV6R';

// Rota de registro de Médico
router.post('/register/medico', async (req, res) => {
    const { nome, email, cpf, crm, especialidade } = req.body;
    try {
        let medico = await Medico.findOne({ email });
        if (medico) {
            return res.status(400).json({ message: 'Médico já existe.' });
        }
        medico = new Medico({ nome, email, cpf, crm, especialidade });
        await medico.save();
        res.status(201).json({ message: 'Médico registrado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro do servidor.', error: err.message });
    }
});

// Rota de registro de Paciente
router.post('/register/paciente', async (req, res) => {
    const { nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado } = req.body;
    try {
        let paciente = await Paciente.findOne({ email });
        if (paciente) {
            return res.status(400).json({ message: 'Paciente já existe.' });
        }
        paciente = new Paciente({ nome, email, cpf, telefone, cep, logradouro, numero, complemento, cidade, estado });
        await paciente.save();
        res.status(201).json({ message: 'Paciente registrado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro do servidor.', error: err.message });
    }
});

// Rota de registro de Secretário (a única que salva a senha)
router.post('/register/secretario', async (req, res) => {
    const { nome, email, cpf, telefone, password } = req.body;
    try {
        let secretario = await Secretario.findOne({ cpf });
        if (secretario) {
            return res.status(400).json({ message: 'Secretário já existe.' });
        }
        secretario = new Secretario({ nome, email, cpf, telefone, password });
        const salt = await bcrypt.genSalt(10);
        secretario.password = await bcrypt.hash(password, salt);
        await secretario.save();
        res.status(201).json({ message: 'Secretário registrado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro do servidor.', error: err.message });
    }
});

// Rota de login (apenas para Secretário)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Encontra o usuário APENAS na coleção de secretários
        const secretario = await Secretario.findOne({ email });
        if (!secretario) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha digitada com a senha criptografada
        const isMatch = await bcrypt.compare(password, secretario.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Se as credenciais estiverem corretas, cria um token JWT
        const payload = {
            user: {
                id: secretario.id,
                role: 'secretario'
            }
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Erro do servidor.', error: err.message });
    }
});

export default router;