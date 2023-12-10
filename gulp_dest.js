const gulp = require('gulp');
const combine = require('stream-combiner')

module.exports = function (RED) {
    function GulpDestNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;
        var node = this;
        node.on('input', function (msg, send) {
            // msg.debug = {};
            // msg.debug.config = config;
            // msg.debug.node = node;
            if (!msg.topic?.startsWith("gulp-") && !msg.topic?.startsWith("gulpetl-")) {
                this.status({ fill: "red", shape: "dot", text: "missing .src node" });
            }
            else if (msg.topic == "gulp-info") {
                // ignore this informational message--but pass it along below
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

                            // send an info message to announce the file we're processing
                            // let fileDescription = `${file.history[0].split(/[\\/]/).pop()} -> ${file?.inspect()}`
                            // let fileDescription = `${file.history[0].split(/[\\/]/).pop()}`
                            let fileDescription = `${file.history[0].split(/[\\/]/).pop()} -> ` + '' + file;
                            msg.payload = `gulpfile: ${fileDescription}`;
                            msg.topic = "gulp-info";
                            msg.gulpfile = file;
                            console.log("gulp.dest:", fileDescription)

                            send(msg);

                            let fileName = file.stem;
                            file.contents.on("data", (data) => {
                                console.log("test:" + fileName + ":", data.toString().trim())
                            })
                        })
                    );

                this.status({ fill: "green", shape: "ring", text: "ready" });
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("gulp.dest", GulpDestNode);
}