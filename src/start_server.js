#!/usr/bin/env node

const { fetchLog, pushLog, createPool, jsonifyData, commonArgs } = require("./common")
const express = require("express");
const app = express();
const cors = require("cors")
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const optionDefinitions = [
    ...commonArgs,
    {
        name: "request_size", alias: "r", type: String, defaultValue: "50mb",
        description: "The maximum size of a request to the server"
    },
    {
        name: "port", alias: "p", type: Number, defaultValue: 8001,
        description: "The port the server uses. Default : 8001"
    }
]
const sections = [
    {
        header: "Log parser server",
        content: "Options for the server"
    },
    {
        header: "Options",
        optionList: optionDefinitions
    }
];
const usage = commandLineUsage(sections);
const options = commandLineArgs(optionDefinitions);

function main() {
    if (options.help) {
        console.log(usage);
        return;
    }
    const pool = createPool(options.workers, options.log_format, options.steam64)
    console.log("Starting server with options:", options)
    app.use(cors())
    app.use(express.urlencoded({ limit: options.request_size }));
    app.post("/parse/", (req, res) => {
        (async () => {
            const lines = req.body.split("\n");
            return pushLog(pool, lines);
        })()
            .then(result => res.send(result))
            .catch(err => res.send(err));
    })
    app.get("/id/:logId", (req, res) => {
        (async () => {
            const lines = await fetchLog(options.url, req.params.logId);
            let data = await pushLog(pool, lines);
            if (!options.log_format)
                data = jsonifyData(data);
            return data;
        })()
            .then(result => res.send(result))
            .catch(err => res.send(err));
    })
    app.listen(options.port, () => {
        console.log(`Server is listening on port ${options.port}`);
    });
}

if (require.main === module) {
    main();
}
