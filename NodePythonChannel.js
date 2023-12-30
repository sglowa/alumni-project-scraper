// const amqp = require('amqplib')
import amqp from 'amqplib'
// const uniqid = require('uniqid')
import uniqid from 'uniqid'

async function establishChannelToPython () {
  const reqQueue = 'node_req_queue'
  const resQueue = 'python_res_queue'

  const connection = await amqp.connect('amqp://localhost:3213')
  const channel = await connection.createChannel()
  await channel.assertQueue(resQueue)
  const resCbDictionary = {}
  await channel.consume(resQueue, (msg) => {
    try {
      if (msg === 'EXITING') {
        console.log('Python script is exiting')
        return
      }
      // i can also validate if it is json
      resCbDictionary[msg.properties.correlationId](msg, connection.close)
      delete resCbDictionary[msg.properties.correlationId]
    } catch (error) {
      console.log('error', error)
    }
  }, { noAck: true })

  /**
      * send data to python and register response callback
      * @param {string} msg - string message to send to python
      * @param {requestCallback} reqCb - requestCallback (res msg as arg1)
      */
  function sendMessage (msg, reqCb) {
    const correlationId = uniqid()
    resCbDictionary.correlationId = reqCb
    channel.sendToQueue(reqQueue, Buffer.from(msg), {
      replyTo: resQueue,
      correlationId
    })
  }
  return sendMessage
}

const sendReqToPython = establishChannelToPython()
export { sendReqToPython }
