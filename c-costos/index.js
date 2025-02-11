import Chalk from 'chalk';
import ora from 'ora';
import { ConnectionMongoError, ConnectionRabbitMQError, ConnectionServerError, CreateError } from './utils/error.js';
import connectDB from './connections/mongo.js';
import connectRabbitMQ from './connections/amqp.js';
import config from './config/config.js';
import startServer from './connections/server.js';
import services from './services/services.js';
import ApiErrors from './utils/apiErrors.js';

/**
 * Función principal que inicia el microservicio.
 *
 * Esta función realiza las siguientes tareas:
 * 1. Conecta a MongoDB.
 * 2. Conecta a RabbitMQ.
 * 3. Inicia el servidor Express.
 * 4. Escucha mensajes en la cola de RabbitMQ y los procesa.
 *
 * @async
 * @function main
 * @throws {ConnectionMongoError} Si ocurre un error al conectar a MongoDB.
 * @throws {ConnectionRabbitMQError} Si ocurre un error al conectar a RabbitMQ.
 * @throws {ConnectionServerError} Si ocurre un error al iniciar el servidor.
 */
async function main() {
    console.log(Chalk.bold.bgGreen(" 🚀 Iniciando Microservicio: " + config.nameMicroservice + "  "));
    const spinner = ora({ spinner: 'moon' });
    const antennaSpinner = ora({
        text: 'Esperando mensajes en la cola: ' + config.queue,
        spinner: {
            interval: 200, // Velocidad del cambio (ms)
            frames: [
                '📡 .',
                '📡 ..',
                '📡 ...',
                '📡 ..',
                '📡 .',
            ]
        }
    });

    try {

        // Iniciar conexión con MongoDB,RabbitMQ y el Servidor
        await connectDB();
        const { channel } = await connectRabbitMQ();
        await startServer();

        // Escuchar mensajes en la cola de RabbitMQ y procesarlos con el servicio correspondiente 
        antennaSpinner.start();
        channel.consume(config.queue, async (message) => {
            antennaSpinner.stopAndPersist({ symbol: '📩', text: `Mensaje recibido en la cola: ${config.queue}` });
            try {
                const data = JSON.parse(message.content.toString());
                const res = await services(data);
                if (res) {
                    const confirmation = { success: true, message: "Datos guardados correctamente", id_chat:res};
                    channel.sendToQueue(message.properties.replyTo,
                        Buffer.from(JSON.stringify(confirmation)),
                        { correlationId: message.properties.correlationId }
                    );
                    console.log("✅ Datos guardados y confirmación enviada");
                    channel.ack(message)
                } else {
                    channel.nack(message)
                }

            } catch (error) {
                if (error instanceof CreateError) {
                    await ApiErrors(error);
                    spinner.fail(error.message_error)
                    const msg_confirmation = { success: false, message: error.message_error };
                    channel.sendToQueue(message.properties.replyTo,
                        Buffer.from(JSON.stringify(msg_confirmation)),
                        { correlationId: message.properties.correlationId }
                    );
                }
            }
            console.log('\n')
            antennaSpinner.start();

        })

    } catch (error) {
        console.log("Existe un error")
        await ApiErrors(error);
        spinner.fail(error.message_error)
        if (error instanceof ConnectionMongoError || error instanceof ConnectionRabbitMQError || error instanceof ConnectionServerError) {
            console.log(Chalk.bold.bgRedBright(" 🚀💥 No se pudo iniciar el Microservicio: " + config.nameMicroservice + "  "));
            process.exit(1);
        }

    }
}
main()