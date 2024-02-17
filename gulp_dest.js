const gulp = require('gulp');
const combine = require('stream-combiner')

const localDefaultConfigObj = {}; // no defaults to override
const extractConfig = require('./extract-config.js').extractConfig;

module.exports = function (RED) {
    function GulpDestNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;
        this.config = config.config;

        var node = this;
        node.on('input', function (msg, send, done) {
            let configObj;
            try {
                if (this?.config?.trim())
                    configObj = JSON.parse(this.config);
            }
            catch (err) {
                done("Unable to parse gulp.dest.config: " + err);
                return;
            }

            configObj = extractConfig(configObj, msg?.config, "gulp.dest", localDefaultConfigObj);

            if (!msg.topic?.startsWith("gulp")) {
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
                    .pipe(gulp.dest(node.path, configObj)
                        .on("data", (file) => {
                            this.status({ fill: "green", shape: "dot", text: "active" });

                            // send an info message to announce the file we're processing
                            let fileDescription = `${file.history[0].split(/[\\/]/).pop()} -> ${file.basename}`
                            msg.payload = `gulpfile: ${fileDescription}`;
                            msg.topic = "gulp-info";
                            msg.gulpfile = file;
                            // console.log("gulp.dest:", fileDescription)

                            send(msg);
                        })
                        .on("end", () => {
                            this.status({ fill: "green", shape: "ring", text: "ready" });
                        })

                    );

                this.status({ fill: "green", shape: "ring", text: "ready" });
            }

            send(msg);
        });
    }
    RED.nodes.registerType("gulp.dest", GulpDestNode);
}