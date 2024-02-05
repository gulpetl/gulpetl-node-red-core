const merge = require('merge');

//
// Note: ./extract-config.d.ts must be updated manually upon any changes to exported function signatures below
//

/**
 * Merges config information for this plugin from all potential sources
 * @param specificConfigObj A configObj set specifically for this plugin
 * @param pipelineConfigObj A "super" configObj (e.g. file.data or msg.config) for the whole pipeline which may/may not apply to this plugin; 
 * only used in absence of specificConfigObj
 * @param pluginName Name to search in pipelineConfigObj for settings, i.e. pipelineConfigObj[pluginName]
 * @param defaultConfigObj A default configObj whose properties are overridden by the others
 */
module.exports.extractConfig = (specificConfigObj, pipelineConfigObj = undefined, pluginName = undefined, defaultConfigObj = undefined) => {
    let configObj;
    try {
      let dataObj;
      if (specificConfigObj)
        dataObj = specificConfigObj
      else if (pipelineConfigObj) {
        // look for a property based on our plugin's name; assumes a complex object meant for multiple plugins
        dataObj = pipelineConfigObj[pluginName];
        // if we didn't find a config above, use the entire pipelineConfigObj object as our config
        if (!dataObj) dataObj = pipelineConfigObj;
        // merge superConfigObj config into our passed-in origConfigObj
      }
  
      // merge our chosen dataObj into defaultConfigObj, overriding any conflicting properties in defaultConfigObj
      // merge.recursive(defaultConfigObj, dataObj); // <-- huge bug: can't change parameter objects: changing them affects subsequent plugins in the pipeline
      configObj = merge.recursive(true, defaultConfigObj, dataObj );
    }
    catch { 
      // ignore errors
    }
    return configObj;
  }