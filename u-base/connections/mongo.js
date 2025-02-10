import mongoose from "mongoose";
import { ConnectionMongoError } from "../utils/error.js";
import config from "../config/config.js";
import ora from "ora";
/**
 * Conecta a la base de datos MongoDB.
 *
 * Utiliza Mongoose para establecer una conexión con la base de datos MongoDB
 * especificada en la configuración. Muestra un spinner durante el proceso de conexión.
 *
 * @async
 * @function connectDB
 * @throws {ConnectionMongoError} Si ocurre un error al conectar a MongoDB.
 */
export default async function connectDB() {
    const spinner = ora({spinner: 'moon'});
    try {
        spinner.start('Conectando a MongoDB...');
        await mongoose.connect(config.mongoUri);
        spinner.succeed('Conexión exitosa a MongoDB');
    } catch (error) {
        throw new ConnectionMongoError(error,"Hubo un error conectando a MongoDB");
    }
}
