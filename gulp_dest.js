const gulp = require('gulp');
const combine = require('stream-combiner')

module.exports = function(RED) {
    function GulpDestNode(config) {
        RED.nodes.createNode(this,config);        
        this.path = config.path;
        var node = this;
        node.on('input', function(msg) {
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
                    .pipe(gulp.dest(node.path));

                this.status({fill:"green",shape:"ring",text:"ready"});
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("gulp.dest",GulpDestNode);
}