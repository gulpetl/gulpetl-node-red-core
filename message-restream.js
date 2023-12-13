const gulp = require('gulp');
const transform = require('stream-transform').transform;
const combine = require('stream-combiner')
const mergeStream = require('merge-stream');
const vinylSource = require('vinyl-source-stream')
const from2 = require('from2');
const Vinyl = require('vinyl');

module.exports = function (RED) {
    function MessageRestreamNode(config) {
        RED.nodes.createNode(this, config);
        this.path = config.path;

        let node = this;
        // console.log("config", config)

        node.on('input', function (msg, send) {
            const prepInitializeMsg = (msg) => {
                // set the payload to give info on the gulp stream we're creating
                // msg.payload = "msg-restream: " + node.path;
                msg.topic = "gulp-initialize";
    
                console.log("message-restream:initialize")
                
                msg.plugins = [];
                msg.plugins.push({
                    name: config.type, init: () => {
                        let gulpStream
                        // if no previous plugins, it's up to us to kick off the gulpstream
                        // if (!msg.plugins || msg.plugins.length == 0) {
    
                        let appender = transform((line) => {
                            // change line here
                            return line;
                        });
    
                        let gulpfile = new Vinyl({
                            //   base: path.dirname(pretendFilePath),    
                            //   path:pretendFilePath,
                            base: ".",
                            path: "carzz.ndjson",
                            contents: appender,
                            appender: appender
                        });
    
    
                        // gulpStream = from2.obj() // not sure if it's possible to start a gulp stream without a vinyl file. We won't try.
                        gulpStream = from2.obj([gulpfile])
                            .on("data", (file) => {
                                let fileName = file.stem;
                                file.contents.on("data", (data) => {
                                    console.log("test:" + fileName + ":", data.toString().trim())
                                })
                            })
                        // }
    
                        this.context().set("appender", appender);  // set appender on node context
                        console.log("msg.restream: set appender")
    
                        this.context().set("gulpstream", gulpStream);  // set appender on node context
                        return gulpStream;
                    }
                });

                return msg;
            }

            // let configObj = tapCsv.extractConfig(null/*local.config*/, msg.config);  // TODO: config?
            // else if (!msg.topic?.startsWith("gulp-")) {
            //     node.error("Gulp stream required (e.g. gulp.src)");
            // }


            // set the payload to give info on the gulp stream we're creating
            // msg.payload = "msg-restream: " + node.path;

            if (msg.topic == "gulp-initialize") {
                // nothing to initialize here; we'll just pass this message along
                
                // no, go ahead and try to initilize 
                try{
                    prepInitializeMsg(msg);
                }
                catch(err) 
                {
                    console.error(err);
                }
                
            }
            else if (msg.topic == "gulpetl-message") {
                // let gulpStream = this.context().get("gulpstream");  // get gulpstream from  node context

                // if (!msg.gulpfile || !msg.gulpfile?.appender) {
                //     let appender = this.context().get("appender"); // get appender from node context
                //     if (!appender)
                //         appender = transform((line) => {
                //         // change line here
                //         return line;
                //     });

                //     if (!msg.gulpfile) {                        
                //         // create a file wrapper that will pretend to gulp that it came from the path represented by pretendFilePath
                //         msg.gulpfile = new Vinyl({
                //             //   base: path.dirname(pretendFilePath),    
                //             //   path:pretendFilePath,
                //             base: ".",
                //             path: "carzz.ndjson",
                //             contents: appender,
                //             appender: appender
                //         });
                //         gulpStream.push(msg.gulpfile);
                //     }
                //     if (!msg.gulpfile.appender) {
                //         msg.gulpfile.contents = mergeStream(appender, msg.gulpfile.contents);

                //         msg.gulpfile.appender = appender;                        
                //     }
                // }


                let appender = msg.gulpfile?.appender;
                if (!appender)
                    appender = this.context().get("appender"); // get appender from node context

                // this doesn't work; no way to delay current message enough for new initialize message to complete...
                // if (!appender){
                //     send(prepInitializeMsg(RED.util.cloneMessage(msg)));
                    
                //     appender = this.context().get("appender"); // get appender from node context
                // }

                if (appender) {
                    this.context().set("appender", appender);  // set appender on node context

                    console.log("msg.restream:write to appender:", JSON.stringify(msg.payload))
                    appender.write(JSON.stringify(msg.payload) + "\n");    
                }
            }
            else if (msg.topic == "gulpetl-end") {
                let appender = msg?.gulpfile?.appender;
                (!appender)
                    appender = this.context().get("appender"); // get appender from node context
                appender.end();

                
                // let gulpStream = this.context().get("gulpstream");  // get gulpstream from  node context
                // if (gulpStream)
                //     gulpStream.end();
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