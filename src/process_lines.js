const { LogParser, defaultModules } =  require("logstf-parser");
const { parentPort, workerData } = require("worker_threads");


const parser = new LogParser()
for (const module of Object.values(defaultModules)) {
    parser.addModule(module);
}

function parseLines(lines, steam64, log_format) {
    if (steam64 !== undefined)
        parser.useSteam64Id()
    const game = parser.parseLines(lines);
    return log_format ? game.toLogstf() : game.toJSON();
}

parentPort.on("message", async (param) => {
    const result = parseLines(param, workerData.steam64, workerData.format);
    // return the result to main thread.
    parentPort.postMessage(result);
});
