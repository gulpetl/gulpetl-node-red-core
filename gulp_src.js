const gulp = require('gulp');

module.exports = function (RED) {
    function GulpSrcNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;
        // console.log("config", config)

        node.on('input', function (msg, send) {
            let configObj = { buffer: false, ...msg.config } // default to streaming mode
            // msg = RED.util.cloneMessage(msg);

            /** 
             * plugins will be an array of objects where obj.init is a function that returns a stream. This clones well for
             * when msg is cloned by Node-RED (for passing down multiple wires), unlike arrays of streams or other such options
             */
            msg.plugins = [];

            // set the payload to give info on the gulp stream we're creating
            msg.payload = "gulp.src: " + node.path;
            msg.topic = "gulp-initialize";


            // when cloning messages takes place (if this node has multiple wires)
            // it causes duplication of the send(newMsg) below in an odd way.
            msg.plugins.push({
                name: config.type,
                // init:() => gulp.src(node.path, configObj)
                init: () => {
                    return gulp.src(node.path, configObj)
                        .on("data", (file) => {
                            this.status({ fill: "green", shape: "dot", text: "active" });

                            // // new msg for each file; otherwise we just change the same one and they'll all look the same in the debug pain
                            // let newMsg = RED.util.cloneMessage(msg);

                            // // send an info message to announce the file we're processing
                            // newMsg.payload = "gulpfile: " + file.inspect();
                            // newMsg.topic = "gulp-info";
                            // newMsg.gulpfile = file;

                            // send(newMsg);
                            // console.log("gulp.src:", file)

                            // let fileName = file.stem;
                            // file.contents.on("data", (data) => {
                            //     console.log("test:" + fileName + ":", data.toString().trim())
                            // })
                        })
                        .on("end", () => {
                            this.status({ fill: "green", shape: "ring", text: "ready" });
                        })
                }
            })

            send(msg);


        });


    }
    RED.nodes.registerType("gulp.src", GulpSrcNode);
}