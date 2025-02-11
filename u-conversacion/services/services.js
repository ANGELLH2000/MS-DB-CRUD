import mongoose from "mongoose";
import { UpdateError } from "../utils/error.js";
import ora from "ora";


export default async function services(data) {
    const { libreria, chat, id_chat } = data;
    console.log(data)
    if (!libreria || !chat || !id_chat) {
        let infoError = "Se encontró el sigiente campo vacío: " + (!libreria ? " [libreria] " : "") + (!chat ? " [chat] " : "") + (!id_chat ? " [id_chat] " : "")
        throw new UpdateError(new Error(infoError), "Faltan datos para la actualización del documento.", data);
    }

    // Esquema de la colección
    const chatSchema = new mongoose.Schema({
        chat: [{
            emisor: { type: String, required: true },
            message: { type: String, required: true }
        }]
    });

    const Chat = mongoose.models[libreria] || mongoose.model(libreria, chatSchema, libreria);
    const spinner = ora({ spinner: 'moon' });
    try {
        spinner.start("Actualizando documento...");
        const res = await Chat.findOneAndUpdate(
            { _id: id_chat },
            { $push: { chat: chat } },
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
