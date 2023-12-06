const gulp = require('gulp');

module.exports = function (RED) {
    function GulpSrcNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;
console.log("config", config)

        node.on('input', function (msg, send) {
            let configObj = { buffer: false, ...msg.config } // default to streaming mode
            msg.plugins = [];

            // set the payload to give info on the gulp stream we're creating
            msg.payload = "gulp.src: " + node.path;
            msg.topic = "gulp-initialize";

console.log("START");

            msg.plugins.push({
                name: config.type,
                // init:() => gulp.src(node.path, configObj)
                init: () => {
                    return gulp.src(node.path, configObj)
                        .on("data", (file) => {
                            this.status({ fill: "green", shape: "dot", text: "active" });
                            // console.log("DATA");

                            // new msg for each file; otherwise we just change the same one and they'll all look the same in the debug pain
                            let newMsg = RED.util.cloneMessage(msg);

                            // send an info message to announce the file we're processing
                            newMsg.payload = "gulpfile: " + file.inspect();
                            newMsg.topic = "gulp-info";
                            newMsg.gulpfile = file;
// send(msg);
                            send(newMsg);
                            console.log("gulp.src:", file)

                            // let fileName = file.stem;
                            // file.contents.on("data", (data) => {
                            //     console.log("test:" + fileName + ":", data.toString().trim())
                            // })
                        })
                        .on("end", () => {
                            this.status({ fill: "green", shape: "ring", text: "ready" });
                            // console.log("END")
                        })
                }
            })

            send(msg);
            console.log('sendMsg')
        });


    }
    RED.nodes.registerType("gulp.src", GulpSrcNode);
}