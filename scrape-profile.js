const amqp = require('amqplib');

async function publishMessage(){
    const connection = await amqp.connect('amqp://localhost:3213');
    const channel = await connection.createChannel();

    requestQueue = ''
}

function mainScrapeProfile(linkedInProfilePathname){
    const profileId =  extractProfileId(linkedInProfilePathname);
    // run python script, get json from stdout
    // clean json 
        // filter irrelevant
        // filter jobs
    // save to database 
}

function extractProfileId(urlPathname){
    "".matchAll
}

export default mainScrapeProfile