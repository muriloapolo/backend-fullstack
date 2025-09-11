import mongoose from 'mongoose';

const PacienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    cpf: { type: String, required: true, unique: true },
    telefone: { type: String },
    cep: { type: String },
    logradouro: { type: String },
    numero: { type: String },
    complemento: { type: String },
    cidade: { type: String },
    estado: { type: String }
});

const Paciente = mongoose.model('Paciente', PacienteSchema);

export default Paciente;