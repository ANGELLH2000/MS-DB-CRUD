import mongoose from "mongoose";
import { CreateError } from "../utils/error.js";
import ora from "ora";


export default async function services(data) {
    const { libreria, id_chat } = data;
    if (!libreria ||  !id_chat) {
        let infoError= "Se encontró el sigiente campo vacío: " + (!libreria ? " [libreria] " : "" ) + (!id_chat ? " [id_chat] " : "")
        throw new CreateError(new Error(infoError), "Faltan datos para la creación del documento.", data);
    }
    // Esquema de la colección
    const chatSchema = new mongoose.Schema({
        tokens: [{
            model: { type: String, required: true },
            input: { type: Number, required: true },
            output: { type: Number, required: true }
        }]
    }, { timestamps: true });

    const Chat = mongoose.models[libreria] || mongoose.model(libreria, chatSchema, libreria);
    const spinner = ora({ spinner: 'moon' });
    try {
        spinner.start("Creando nuevo documento...");
        const res = await Chat.create({ _id:id_chat ,tokens:[] });
        if (!res) {
            spinner.fail("No se pudo crear el documento.");
            throw new Error(`No se puedo crear el documento.`);
        }
        spinner.succeed("Nuevo documento creado con id: " + res._id);
        return res._id;
    } catch (error) {
        spinner.stop();
        throw new CreateError(error, "Error en la creación del nuevo documento.", data);
    }
}
