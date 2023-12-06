const gulp = require('gulp');
const combine = require('stream-combiner')

module.exports = function(RED) {
    function GulpDestNode(config) {
        RED.nodes.createNode(this,config);        
        this.path = config.path;
        var node = this;
        node.on('input', function(msg, send) {
            // msg.debug = {};
            // msg.debug.config = config;
            // msg.debug.node = node;

            if (!msg.topic?.startsWith("gulp-")) {
                this.status({fill:"red",shape:"dot",text:"missing .src node"});
            }
            else if (msg.topic == "gulp-info") {
                // ignore this informational message
            }
            else if (msg.topic == "gulp-initialize") {
                if (!msg.plugins) {
                    node.warn(`gulp.dest: cannot initialize; missing gulp.src?`)
                    return;
                }

                console.log(`gulp.dest: creating gulp stream; combining ${msg.plugins.length} plugin streams`)
                combine(msg.plugins.map((plugin) => plugin.init()))
                    .pipe(gulp.dest(node.path)
                    .on("data", (file) => {
                        this.status({ fill: "green", shape: "dot", text: "active" });
                        // console.log("DATA");

                        // new msg for each file; otherwise we just change the same one and they'll all look the same in the debug pain
                        let newMsg = msg;//RED.util.cloneMessage(msg);

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
                    );

                this.status({fill:"green",shape:"ring",text:"ready"});
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("gulp.dest",GulpDestNode);
}