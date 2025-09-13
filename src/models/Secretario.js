import mongoose from 'mongoose';

const SecretarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    cpf: {
        type: String,
        required: true,
        unique: true
    },
    telefone: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
});

const Secretario = mongoose.model('Secretario', SecretarioSchema);

export default Secretario;
