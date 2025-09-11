import mongoose from 'mongoose';

// Define the appointment schema
const AgendamentoSchema = new mongoose.Schema({
    // Store the patient's ID, referencing the 'Paciente' collection
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: true
    },
    // Store the doctor's ID, referencing the 'Medico' collection
    medicoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medico',
        required: true
    },
    data: { 
        type: String, 
        required: true 
    },
    horario: { 
        type: String, 
        required: true 
    },
    duracao: { 
        type: Number, 
        default: 20 
    },
    status: { 
        type: String, 
        enum: ['pendente', 'confirmado'], 
        default: 'pendente' 
    }
}, {
    timestamps: true
});

// Create the 'Agendamento' model from the schema
const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);

export default Agendamento;
