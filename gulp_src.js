const gulp = require('gulp');
const combine = require('stream-combiner')

module.exports = function (RED) {
    function GulpSrcNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;

        // get/create new "streams" property in the flow context; it's an object where each property is name with a _msg_id and will be
        // an array of streams for the corresponding msg
        let nodeStreams = node.context().flow.get("streams");
        if (!nodeStreams)
            node.context().flow.set("streams", nodeStreams = {}); // get/initialize this node's streams object

        node.on('input', function (msg, send, done) {
            config = { buffer: false, ...msg.config } // default to streaming mode
            // console.log("config", config)

            nodeStreams[msg._msgid] = []; // create an empty streams array for this message

            // set the payload to give info on the gulp stream we're creating
            msg.payload = "gulp.src: " + node.path;
            msg.topic = "gulp-initialize";

            setTimeout(() => {
                console.log(`gulp.src: creating gulp stream for ${msg._msgid}; combining ${this.context().flow.get("streams")[msg._msgid]?.length} plugin streams`)
                /* */

                msg.gulpstream = gulp.src(node.path, config)
                    .on("data", (file) => {
                        this.status({ fill: "green", shape: "dot", text: "active" });
                        // console.log("DATA");

                        // send an info message to announce the file we're processing
                        msg.payload = "gulpfile: " + file.inspect();
                        msg.topic = "gulp-info";
                        msg.gulpfile = file;
                        send(msg);
                        // console.log("gulp.src:", file)

                        // let fileName = file.stem;
                        // file.contents.on("data", (data) => {
                        //     console.log("test:" + fileName + ":", data.toString().trim())
                        // })
                    })
                    .on("end", (file => {
                        this.status({ fill: "green", shape: "ring", text: "ready" });
                        // console.log("END")
                        // TODO: when all files have ended, remove nodeStreams[msg._msgid] to allow garbage collection
                    }))
                    .pipe(combine(this.context().flow.get("streams")[msg._msgid]))

                done(); // OK to run this here?

            }, 2000);

            send(msg);

        });
    }
    RED.nodes.registerType("gulp.src", GulpSrcNode);
}