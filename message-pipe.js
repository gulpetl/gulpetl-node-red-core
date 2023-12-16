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
                                let linetransform = transform((line) => {
                                    // console.log(`msg.pipe (line): ${line.trim()}`)

                                    // send a gulpetl-message for each line of our message stream
                                    msg = RED.util.cloneMessage(msg);
                                    msg.payload = JSON.parse(line);
                                    msg.gulpfile = file;
                                    msg.topic = "gulpetl-message";
                                    send(msg);

                                    return null; // DON'T return this line; remove it from the stream, counting on msg-restream to reinsert it later
                                });


                                file.contents = file.contents
                                    .pipe(linetransform)
                                    .on("end", () => {
                                        // console.log("msg.pipe end(): ", file.basename)

                                        // send a gulpfile-end message to notify msg-restream that gulpfile is done
                                        msg = RED.util.cloneMessage(msg);
                                        msg.payload = "";
                                        msg.gulpfile = file;
                                        msg.topic = "gulpfile-end"; 
                                        send(msg);
                                    })

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