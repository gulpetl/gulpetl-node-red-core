//
// Note: this file must be updated manually upon any changes to function signatures referred to below
//

/**
 * Merges config information for this plugin from all potential sources
 * @param specificConfigObj A configObj set specifically for this plugin
 * @param pipelineConfigObj A "super" configObj (e.g. file.data or msg.config) for the whole pipeline which may/may not apply to this plugin; 
 * only used in absence of specificConfigObj
 * @param pluginName Name to search in pipelineConfigObj for settings, i.e. pipelineConfigObj[pluginName]
 * @param defaultConfigObj A default configObj whose properties are overridden by the others
 */
export declare function extractConfig(specificConfigObj: any, pipelineConfigObj?: any, pluginName?:string, defaultConfigObj?: any): any;