import mongoose from "mongoose";
import { UpdateError } from "../utils/error.js";
import ora from "ora";


export default async function services(data) {
    const { libreria, base, id_chat } = data;
    if (!libreria || !base || !id_chat) {
        let infoError = "Se encontró el sigiente campo vacío: " + (!libreria ? " [libreria] " : "") + (!base ? " [base] " : "") + (!id_chat ? " [id_chat] " : "")
        throw new UpdateError(new Error(infoError), "Faltan datos para la actualización del documento.", data);
    }

    const baseCompleta = {
        genero: base.genero || [],
        titulo: base.titulo || [],
        autores: base.autores || [],
        tema_principal: base.tema_principal || [],
        ambientacion: base.ambientacion || [],
        contexto_emocional: base.contexto_emocional || [],
        hojas: base.hojas || [],
        gpt: base.gpt || "",
        nivel1: base.nivel1 || "",
        nivel2: base.nivel2 || "",
        nivel3: base.nivel3 || ""
    }

    // Esquema de la colección
    const chatSchema = new mongoose.Schema({
        id_chat: { type: mongoose.Schema.Types.ObjectId, required: true },
        genero: { type: [String], required: true },
        titulo: { type: [String], required: true },
        autores: { type: [String], required: true },
        tema_principal: { type: [String], required: true },
        ambientacion: { type: [String], required: true },
        contexto_emocional: { type: [String], required: true },
        hojas: { type: [Number], required: true },
        gpt: { type: String, required: true },
        nivel1: { type: String, required: true },
        nivel2: { type: String, required: true },
        nivel3: { type: String, required: true }
    });


    const Chat = mongoose.models[libreria] || mongoose.model(libreria, chatSchema, libreria);
    const spinner = ora({ spinner: 'moon' });


    try {
        spinner.start("Actualizando documento...");
        const res = await Chat.findOneAndUpdate(
            { _id: id_chat },
            {
                $push: {
                    genero: { $each: baseCompleta.genero },
                    titulo: { $each: baseCompleta.titulo },
                    autores: { $each: baseCompleta.autores },
                    tema_principal: { $each: baseCompleta.tema_principal },
                    ambientacion: { $each: baseCompleta.ambientacion },
                    contexto_emocional: { $each: baseCompleta.contexto_emocional },
                    hojas:{ $each: baseCompleta.hojas}
                }, 
                $set: {
                    gpt: baseCompleta.gpt,
                    nivel1: baseCompleta.nivel1,
                    nivel2: baseCompleta.nivel2,
                    nivel3: baseCompleta.nivel3
                }
            },
            { new: true, upsert: false } // upsert: false, no crea un nuevo documento si no lo encuentra
        );
        if (!res) {
            spinner.fail("No se encontró el documento con id_chat: " + id_chat);
            throw new Error(`No se encontró el documento con id_chat: ${id_chat}.`);
        }
        spinner.succeed("Documento actualizado correctamente.");
        return true;
    } catch (error) {
        spinner.stop();
        throw new UpdateError(error, "Error en la actualización del documento.", data);
    }
}
