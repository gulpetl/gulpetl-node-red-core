const gulp = require('gulp');
const transform = require('stream-transform').transform;
const combine = require('stream-combiner')
const mergeStream = require('merge-stream');
const  vinylSource = require('vinyl-source-stream')
const from2 = require('from2');
const Vinyl = require('vinyl');

module.exports = function (RED) {
    function MessageRestreamNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;
        // console.log("config", config)

        node.on('input', function (msg, send) {
            // let configObj = tapCsv.extractConfig(null/*local.config*/, msg.config);  // TODO: config?
            // else if (!msg.topic?.startsWith("gulp-")) {
            //     node.error("Gulp stream required (e.g. gulp.src)");
            // }


            // set the payload to give info on the gulp stream we're creating
            // msg.payload = "msg-restream: " + node.path;
            // msg.topic = "gulp-initialize";

            if (msg.topic == "gulp-initialize") {
                console.log("message-restream:initialize")
                msg.plugins = [];
                msg.plugins.push({
                    name: config.type, init: () => {
                        // return //tapCsv.tapCsv({ raw: true, columns: true/*, info:true */ }) 
                        // return transform(function (file) {
                        //     // let fileName = file.stem;
                        //     console.log("message-restream:", file)

                        //     file.appender = transform(function (line) {
                        //         // using this as a passthrough; no changes here
                        //         return line;
                        //     });

                        //     file.contents = mergeStream(file.appender, file.contents);

                        //     // file?.contents?.on("data", (data) => {
                        //     //     console.log("message-restream:" + fileName + ":", data.toString().trim())
                        //     //     msg = RED.util.cloneMessage(msg);
                        //     //     msg.payload = data;

                        //     //     send(msg);
                        //     //     // return msg;
                        //     // })

                        //     return file;
                        // })

                        let msgIn = transform((line) => {
                            // change line here
                            return line;
                        });

                        // let gulpStream = 
                        //     vinylSource('index.js')
                        //         .pipe(msgIn);
                        // gulpStream.appender = msgIn;

                        
                        // create a file wrapper that will pretend to gulp that it came from the path represented by pretendFilePath
                        let vinylFile = new Vinyl({
                        //   base: path.dirname(pretendFilePath),    
                        //   path:pretendFilePath,
                            base:".",
                            path:"carzz.ndjson",
                            contents:msgIn
                        });           
                        // vinylFile.contents = msgIn;           
                        let gulpStream = from2.obj([vinylFile])
                        .on("data", (file) => {
                            let fileName = file.stem;
                            file.contents.on("data", (data) => {
                                console.log("test:" + fileName + ":", data.toString().trim())
                            })
                        })
                        this.context().set("appender", msgIn);  // set appender on node context
                        console.log("msg.restream: set appender")

                        return gulpStream;
                    }
                });
            }
            else if (msg.topic == "gulpetl-message") {
                let appender = this.context().get("appender"); // get appender from node context
                console.log("msg.restream:write to appender:",JSON.stringify(msg.payload))
                appender.write(JSON.stringify(msg.payload) + "\n");
            }
            else if (msg.topic == "gulpetl-end"){
                let appender = this.context().get("appender"); // get appender from node context
                appender.end();
            }


//             if (msg.topic?.startsWith("gulpetl-message")) {
//                 try {
//                     msg.gulpfile.contents.write(JSON.stringify(msg.payload))
// if (msg.payload.record.carModel == "Porsche"){
//     msg.gulpfile.contents.end();
//     console.log("message-restream:", "Porsche; end!")
// }
//                 }
//                 catch (err) {
//                     console.error(err)
//                 }
//                 console.log("message-restream:", msg.payload)
//             }


            node.send(msg);
        })

    }
    RED.nodes.registerType("msg-restream", MessageRestreamNode);
}