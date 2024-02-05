const gulp = require('gulp');

const localDefaultConfigObj = { buffer: false }; // default to streaming mode
const extractConfig = require('./extract-config.js').extractConfig;

module.exports = function (RED) {
    function GulpSrcNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;
        this.config = config.config;

        let node = this;
        // console.log("config", config)

        node.on('input', function (msg, send, done) {
            let configObj;
            try {
                if (this.config.trim())
                    configObj = JSON.parse(this.config);
            }
            catch (err) {
                done("Unable to parse gulp.src.config: " + err);
                return;
            }

            configObj = extractConfig(configObj, msg?.config, "gulp.src", localDefaultConfigObj);

            // msg = RED.util.cloneMessage(msg);

            /** 
             * plugins will be an array of objects where obj.init is a function that returns a stream. This clones well for
             * when msg is cloned by Node-RED (for passing down multiple wires), unlike arrays of streams or other such options
             */
            msg.plugins = [];

            // set the payload to give info on the gulp stream we're creating
            msg.payload = "gulp.src: " + node.path;
            msg.topic = "gulp-initialize";

            msg.plugins.push({
                name: config.type,
                // init:() => gulp.src(node.path, configObj)
                init: () => {
                    return gulp.src(node.path, configObj)
                        .on("data", () => {
                            this.status({ fill: "green", shape: "dot", text: "active" });
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