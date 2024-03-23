const transform = require('stream-transform').transform;

module.exports = function (RED) {
    function MessagePipeNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', function (msg, send) {
            if (!msg.topic?.startsWith("gulp-")) {
                node.error("Gulp stream required (e.g. gulp.src)");
            }
            else {
                if (msg.topic == "gulp-initialize") {
                    msg.plugins.push({
                        name: config.type, init: () => {

                            let filetransform = transform((file) => {

                                if (file.isBuffer()) {
                                    // send one node-red message for entire file if the file is in buffer mode--regardless of "level" param
                                    msg = RED.util.cloneMessage(msg);
                                    msg.payload = file.path;
                                    msg.gulpfile = file;
                                    msg.topic = "gulpfile-buffer";
                                    if (config?.level != "file")
                                        msg.notice = "Pipe Level overridden to 'msg-per-file' because file is in `buffer` mode";
                                    send(msg);

                                    return file; 
                                }
                                else if (!file.isStream()) {
                                    // handle file types other than Buffer or Stream (e.g. isNull, isDirectory; see https://gulpjs.com/docs/en/api/vinyl#instance-methods) 

                                    return file; 
                                }

                                // handle messages for streaming mode only (config contained "buffer":false, results in file.isStream())

                                if (config.level == "line") {
                                    file.upstream = file.contents; // attach this stream to file for backpressure management
                                    file.msgCount = 0;             // counter for Node-RED message backlog
                                    let linetransform = transform((line) => {
                                        // console.log(`msg.pipe (line): ${line.trim()}`)

                                        // send a gulpetl-message for each line of our message stream
                                        msg = RED.util.cloneMessage(msg);
                                        msg.payload = JSON.parse(line);
                                        msg.gulpfile = file;
                                        msg.topic = "gulpetl-message";
                                        send(msg);

                                        file.msgCount++;

                                        // console.log("pipe: msgCount: ", file.msgCount)

                                        if (file.msgCount > (config.limit || 99)) {
                                            console.log("pausing--msgCount: " + file.msgCount)
                                            file.upstream?.pause()
                                        }


                                        return null; // DON'T return this line; remove it from the stream, counting on msg-restream to reinsert it later
                                    });

                                    file.contents = file.contents
                                        .pipe(linetransform);
                                }
                                else if (config.level == "file") {
                                    msg = RED.util.cloneMessage(msg);
                                    msg.payload = file.path;
                                    msg.gulpfile = file;
                                    msg.topic = "gulpfile-begin";
                                    send(msg);
                                }

                                file.contents = file.contents
                                .on("end", () => {
                                    // console.log("msg.pipe end(): ", file.basename)

                                    // send a gulpfile-end message to notify msg-restream that gulpfile is done
                                    msg = RED.util.cloneMessage(msg);
                                    msg.payload = file.path;
                                    msg.gulpfile = file;
                                    msg.topic = "gulpfile-end";
                                    send(msg);
                                });

                                return file;
                            });

                            return filetransform;
                        }
                    });
                }

                send(msg);
            }
        })

    }
    RED.nodes.registerType("msg-pipe", MessagePipeNode);
}