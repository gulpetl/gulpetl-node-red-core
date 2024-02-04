const merge = require('merge');

/**
 * Merges config information for this plugin from all potential sources
 * @param specificConfigObj A configObj set specifically for this plugin
 * @param pipelineConfigObj A "super" configObj (e.g. file.data or msg.config) for the whole pipeline which may/may not apply to this plugin; 
 * only used in absence of specificConfigObj
 * @param defaultConfigObj A default configObj whose properties are overridden by the others
 */
module.exports = function extractConfig(specificConfigObj, pipelineConfigObj, defaultConfigObj) {
    let configObj;
    try {
      let dataObj;
      if (specificConfigObj)
        dataObj = specificConfigObj
      else if (pipelineConfigObj) {
        // look for a property based on our plugin's name; assumes a complex object meant for multiple plugins
        dataObj = pipelineConfigObj["gulp.src"];
        // if we didn't find a config above, use the entire pipelineConfigObj object as our config
        if (!dataObj) dataObj = pipelineConfigObj;
        // merge superConfigObj config into our passed-in origConfigObj
      }
  
      // merge our chosen dataObj into defaultConfigObj, overriding any conflicting properties in defaultConfigObj
      // merge.recursive(defaultConfigObj, dataObj); // <-- huge bug: can't parameter objects: changing them affects subsequent plugins in the pipeline
      configObj = merge.recursive(true, defaultConfigObj, dataObj );
    }
    catch { 
      // ignore errors
    }
    return configObj;
  }