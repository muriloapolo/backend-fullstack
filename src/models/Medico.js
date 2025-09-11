import mongoose from 'mongoose';

const MedicoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    cpf: { type: String, required: true, unique: true },
    crm: { type: String, required: true, unique: true },
    especialidade: { type: String, required: true }
});

const Medico = mongoose.model('Medico', MedicoSchema);

export default Medico;