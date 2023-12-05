const gulp = require('gulp');

module.exports = function(RED) {
    function GulpDestNode(config) {
        RED.nodes.createNode(this,config);        
        this.path = config.path;
        var node = this;
        node.on('input', function(msg) {

            if (!msg.topic?.startsWith("gulp-")) {
                this.status({fill:"red",shape:"dot",text:"missing .src node"});
            }
            else if (msg.topic == "gulp-info") {
                // ignore this informational message
            }
            else if (msg.topic == "gulp-initialize") {
                if (!node.context().flow.get("streams") || !node.context().flow.get("streams")[msg._msgid]) {
                    node.warn(`gulp.dest: cannot initialize; missing gulp.src?`)
                    return;
                }

                node.context().flow.get("streams")[msg._msgid]?.push(gulp.dest(node.path));
                this.status({fill:"green",shape:"ring",text:"ready"});
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("gulp.dest",GulpDestNode);
}