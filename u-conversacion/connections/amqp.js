import amqp from "amqplib";
import ora from "ora";
import config from "../config/config.js";
import { ConnectionRabbitMQError } from "../utils/error.js";

/**
 * Conecta a RabbitMQ y configura el canal, exchange y colas necesarias.
 *
 * @async
 * @function connectRabbitMQ
 * @returns {Promise<Object>} Un objeto que contiene la conexión y el canal de RabbitMQ.
 * @throws {ConnectionRabbitMQError} Si ocurre un error durante la conexión o configuración de RabbitMQ.
 */
export default async function connectRabbitMQ() {
    const spinner = ora({spinner: 'moon'});
    try {
        spinner.start('Conectando a RabbitMQ...');
        const connection = await amqp.connect(config.amqpUrl);
        spinner.succeed('Conexión exitosa a RabbitMQ');

        spinner.start('Creando Channel en RabbitMQ...');
        const channel = await connection.createChannel();
        spinner.succeed('Channel creado en RabbitMQ');

        spinner.start('Creando Exchange en RabbitMQ...');
        await channel.assertExchange(config.exchange, 'direct', { durable: true });// Crea el exchange new_chat
        spinner.succeed('Exchange creado en RabbitMQ');

        spinner.start('Creando Colas en RabbitMQ...');
        await channel.assertQueue(config.queue, { durable: true });// Crea la cola Q0
        await channel.assertQueue(config.queueErrors, { durable: true });// Crea la cola Errores_Data

        spinner.succeed('Colas creadas en RabbitMQ');
        
        spinner.start('Asociando Colas en RabbitMQ...');
        await channel.bindQueue(config.queue, config.exchange, config.routingKey);// Asocia la cola Q0 al exchange new_chat con la routingKey paso1  
        spinner.succeed('Colas asociadas en RabbitMQ');

        
        return { connection, channel };
    } catch (error) {
        throw new ConnectionRabbitMQError(error,"Hubo un error conectando RabbitMQ");
    }
}
