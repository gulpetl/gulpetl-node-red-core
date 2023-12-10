const gulp = require('gulp');
const transform = require('stream-transform').transform;
const combine = require('stream-combiner')
const mergeStream = require('merge-stream');

module.exports = function (RED) {
    function MessagePipeNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;
        // console.log("config", config)

        node.on('input', function (msg, send) {
            // let configObj = tapCsv.extractConfig(null/*local.config*/, msg.config);  // TODO: config?
            if (!msg.topic?.startsWith("gulp-")) {
                node.error("Gulp stream required (e.g. gulp.src)");
            }
            else {
                if (msg.topic == "gulp-initialize") {
                    // msg.plugins.push({
                    //     name: config.type, init: () => transform(function (file) {
                    //         // let fileName = file.stem;
                    //         console.log("message-restreamZZ:", file)

                    //         let newAppender = transform(function (line) {
                    //             // using this as a passthrough; no changes here
                    //             return line;
                    //         });

                    //         let newFile = file.clone({
                    //             // appender:newAppender,
                    //             contents:mergeStream(newAppender, file.contents)
                    //             // contents: newAppender
                    //         });
                    //         newFile.appender = newAppender;

                    //         // newFile.contents = mergeStream(newFile.appender, file.contents);

                    //         return newFile;
                    //     })
                    // })

                    console.log(`msg-pipe: creating gulp stream; combining ${msg.plugins.length} plugin streams`)
                    combine(msg.plugins.map((plugin) => plugin.init()))
                        .on("data", (file) => {
                            this.status({ fill: "green", shape: "dot", text: "active" });

                            // send an info message to announce the file we're processing
                            let fileDescription = `${file.history[0].split(/[\\/]/).pop()} -> ${file.inspect()}`
                            msg.payload = `gulpfile: ${fileDescription}`;
                            msg.topic = "gulp-info";
                            msg.gulpfile = file;
                            console.log("msg.pipe:", fileDescription)

                            node.send(msg);

                            // stream through the file, sending each message line as a node-red message
                            let fileName = file.stem;
                            file.contents.on("data", (data) => {
                                console.log("msg.pipe:" + fileName + ":", data.toString().trim())

                                msg = RED.util.cloneMessage(msg);
                                msg.payload = JSON.parse(data);
                                msg.topic = "gulpetl-message";

                                node.send(msg);
                            })
                                .on("end", () => {
                                    console.log("END")
                                    msg = RED.util.cloneMessage(msg);
                                    msg.payload = "";//JSON.parse(data);
                                    msg.topic = "gulpetl-end";
    
                                    node.send(msg);
                                    })

                        })
                        .on("end", () => {
                            console.log("FINAL")
                        })
                        // .pipe(transform(function (file) {
                        //     // let fileName = file.stem;
                        //     console.log("message-restreamZZ:", file)

                        //     let newAppender = transform(function (line) {
                        //         // using this as a passthrough; no changes here
                        //         return line;
                        //     });

                        //     let newFile = file.clone({
                        //         // appender:newAppender,
                        //         // contents:mergeStream(newAppender, file.contents)
                        //         contents: newAppender
                        //     });
                        //     newFile.appender = newAppender;

                        //     // newFile.contents = mergeStream(newFile.appender, file.contents);

                        //     return newFile;
                        // }))

                }

                node.send(msg);
            }
        })

    }
    RED.nodes.registerType("msg-pipe", MessagePipeNode);
}