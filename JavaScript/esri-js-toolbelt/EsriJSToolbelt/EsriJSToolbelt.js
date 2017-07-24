define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"EsriJSToolbelt/GenerationTools.js",
	"EsriJSToolbelt/PublishingTools.js",
	"esri/layers/FeatureLayer"
],function(
	declare, lang, GenerationTools, PublishingTools, FeatureLayer
) {
	return declare([GenerationTools, PublishingTools], {
		
		constructor: function(options){},

		justMakeMeSomeData:function(type, number, attributes spatialReference, infoTemplate, extent, map) {
			return new Promise(async (resolve, reject) => {
				if(type) {
					try {
						let randomGeometry = await this.createRandomGeometries(type, number, spatialReference, extent);
						let randomGraphics = await this.createGraphics(randomGeometry,attributes,null,null,true);
						let convertedFeatures = await this.createFeatureCollection(randomGraphics, null, null, null, null, null, null, null);
						if(map) {
							let fLayer = new FeatureLayer(convertedFeatures);
							map.layers.add(fLayer);
						}
						resolve(convertedFeatures);
					} catch (err) {
						reject("Failed to create FeatureLayer: " + err);
					}
				}
				else reject("Must Include All Required Function Parameters");
			});
		},
		
		justMakeMeAFeatureService:function(userName, token, serviceName, tags, geometryType, sampleAttributeObject, options) {
			return new Promise(async (resolve, reject) => {
				if(userName && token && serviceName && tags && extent && geometryType && sampleAttributeObject) {
					options = options ? options : {};
					if(!options.extent) options.extent = new Extent({xmin: -170,ymin: -80,xmax: 170,ymax: 80,spatialReference: { wkid: 4326 }});
					if(!options.linearUnit) options.linearUnit = "meters";
					try {
						const orgId = await this._getOrgId(token);
						let nameAvailability = await this._checkLayerName(serviceName, orgId, token);
						let createServiceResult = await this._createEmptyFeatureService(userName, token, tags, options.extent, options.linearUnit, serviceName);
						let updateServiceResult = await this._updateService(serviceName, tags, userName, createServiceResult.serviceItemId, token);
						let updateSharingResult = await this._changeItemSharing(userName, updateServiceResult.id, token, true, true);
						let addToServiceDefResult = await this._addToServiceDefinition(serviceName, orgId, options.extent.spatialReference.wkid, geometryType, this._createFieldsList(sampleAttributeObject, true), this.createRenderer(geometryType, "simple"), token, options);
						let updateServiceDefResult = await this._updateDefinition(orgId, serviceName, token);
						resolve(createServiceResult.serviceurl);
					} catch (err) {
						reject("Failed to create FeatureService: " + err);
					}
				}
				else reject("Must Include All Required Function Parameters");
			});
		},
		
		justMakeMeAFeatureServiceWithSomeDataInIt:function(userName, token, serviceName, tags, geometryType, sampleAttributeObject, numberOfFeatures, options) {
			return new Promise(async (resolve, reject) => {
				if(userName && token && serviceName && tags && geometryType && sampleAttributeObject && numberOfFeatures) {
					options = options ? options : {};
					if(!options.extent) options.extent = new Extent({xmin: -170,ymin: -80,xmax: 170,ymax: 80,spatialReference: { wkid: 4326 }});
					try {
						let fSet = await this.justMakeMeSomeData(geometryType, number, sampleAttributeObject, options.spatialReference, options.infoTemplate, options.extent, null);
						let serviceUrl = await this.justMakeMeAFeatureService(userName, token, serviceName, tags, geometryType, sampleAttributeObject, options);
						let populateResult = await this.populateServiceWithFeatures(serviceUrl, fSet.source, token);
						resolve(populatResult);
					} catch(error) {
						reject(error);
					}
				}
				else reject("Must Include All Required Function Parameters");
			});
		},
		
		justMakeMeAFeatureServiceAndAddItToTheMapAsAFeatureLayer:function() {
			
		}
		
	});
});