import mongoose from "mongoose";
import { ReadError } from "../utils/error.js";
import ora from "ora";


export default async function services(data) {
    const { libreria, id_chat } = data;
    if (!libreria || !id_chat) {
        let infoError = "Se encontró el sigiente campo vacío: " + (!libreria ? " [libreria] " : "") + (!id_chat ? " [id_chat] " : "")
        throw new ReadError(new Error(infoError), "Faltan datos para la búsqueda del documento.", data);
    }

    // Esquema de la colección
    const chatSchema = new mongoose.Schema({
        genero: { type: [String], default: [] },
        titulo: { type: [String], default: [] },
        autores: { type: [String], default: [] },
        tema_principal: { type: [String], default: [] },
        ambientacion: { type: [String], default: [] },
        contexto_emocional: { type: [String], default: [] },
        hojas: { type: [Number], default: [] },
        gpt: { type: String,default: "" },
        nivel1: { type: String, default: "" },
        nivel2: { type: String, default: "" },
        nivel3: { type: String, default: "" }
    }, { timestamps: true });


    const Chat = mongoose.models[libreria] || mongoose.model(libreria, chatSchema, libreria);
    const spinner = ora({ spinner: 'moon' });
    try {
        spinner.start("Buscando nuevo documento...");
        const res = await Chat.findById(id_chat).lean();
        if (!res) {
            spinner.fail(`No se pudo encontrar el documento con id: ${id_chat}.`);
            throw new Error(`No se pudo encontrar el documento con id: ${id_chat}.`);
        }
        spinner.succeed("Documento encontrado con id: " + res._id);
        const { _id, ...data } = res;
        return {id_chat: _id, ...data};
    } catch (error) {
        spinner.stop();
        throw new ReadError(error, `Error en la búsqueda del documento con id: ${id_chat}.`, data);
    }
}
