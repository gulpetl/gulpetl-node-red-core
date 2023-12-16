const transform = require('stream-transform').transform;
const mergeStream = require('merge-stream');

module.exports = function (RED) {
    function MessageRestreamNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', function (msg, send) {
            const prepInitializeMsg = (msg) => {
                msg.topic = "gulp-initialize";

                msg.plugins.push({
                    name: config.type, init: () => {

                        let filetransform = transform((file) => {

                            // set up appender as a "passthrough" stream--it will pass data through unchanged
                            file.appender = transform((line) => {return line});
    
                            // mergeStream will merge (interleave) these two streams. We expect file.contents to be coming from msg-pipe, where each line is being
                            // used to create a gulpetl-message and then removed from the stream. file.appender, OTOH, is used below to append each new gulpetl-message
                            // BACK into the stream. So, this way we keep a continuous stream flowing while piping each line out into Node-RED messages and then
                            // back into the stream.
                            file.contents = mergeStream(file.appender, file.contents);
                            return file;
                        });

                        return filetransform;
                    }
                });

                return msg;
            }

            if (!msg.topic?.startsWith("gulp")) {
                node.error("Gulp stream required (e.g. gulp.src)");
            }
            else if (msg.topic == "gulp-initialize") {
                try {
                    prepInitializeMsg(msg);
                }
                catch (err) {
                    node.error("Gulp stream required (e.g. gulp.src)");
                }
            }
            else if (msg.topic == "gulpetl-message") {
                let appender = msg.gulpfile?.appender;
                if (appender) {
                    // console.log(`msg.restream:write to ${msg.gulpfile.stem}.appender:`, JSON.stringify(msg.payload))
                    
                    // write the gulpetl-message BACK into the gulpfile's stream
                    appender.write(JSON.stringify(msg.payload) + "\n");
                }
            }
            else if (msg.topic == "gulpfile-end") {
                // console.log(`msg.restream: ${msg.gulpfile.stem}.appender.end()`)

                let appender = msg?.gulpfile?.appender;
                appender.end();
            }

            send(msg);
        })

    }
    RED.nodes.registerType("msg-restream", MessageRestreamNode);
}