define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"esri/geometry/Extent",
	"EsriJSToolbelt/GeneralTools.js",
	"esri/request"
	
],function(
	declare, lang, Extent, GeneralTools, esriRequest
) {
	return declare([GeneralTools], {
	
		constructor: function(options){},
		
		createEmptyWebmapInAGOL: function(organization, username, extent, title, tags, token, basemap) {
			return new Promise(async (resolve, reject) => {
				if(organization && username && extent && title && tags && token) {
					basemap = (basemap ? basemap : "Streets").toLowerCase();
					basemap = this._createBasemapJSON(basemap);
			
					let webMapText = '{"operationalLayers":[],"spatialReference":{"wkid":102100,"latestWkid":3857},"baseMap":{"baseMapLayers":' + basemap.basemapLayers + ',"title":"' + basemap.title + '"},"authoringApp":"WebMapViewer","authoringAppVersion":"3.10","version":"2.3"}';
					
					let response = await esriRequest(
						"https://" + organization + "/sharing/rest/content/users/" + username + "/addItem",
						{
							query: {
								type: "Web Map",
								extent: extent,
								text: webMapText,
								title: title,
								tags: tags,
								snippet: title,
								f: "json",
								token: token
							},
							responseType: "json",
							method: "post"
						}
					);
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to Create the WebMap");
				}
				else reject("You must provide all needed parameters");
			});
		},
		
		deleteAllFeaturesInService: function(featureServiceURL, token) {
			return new Promise(async (resolve, reject) => {
				if(featureServiceURL) {
					let query = {
						where: '1=1',
						f: "json"
					};
					if(token) query.token = token;
					try {
						let response = await esriRequest(featureServiceURL + "/deleteFeatures",{query: query,responseType: "json",method: "post"});
						resolve(response.data);
					} catch (error) {
						reject(error);
					}
				}
				else reject("You must provide the URL to a FeatureService");				
			});
		},
		
		getAToken: function(user, pass, portalUrl, expiration) {
			return new Promise(async (resolve, reject) => {
				if(user && pass) {
					portalUrl = "https://" + (portalUrl ? portalUrl : "www.arcgis.com");
					expiration = expiration ? expiration : 60;
					portalUrl += "/sharing/rest/generateToken";
					expiration = (expiration ? fields : 10);
					let response = await esriRequest(
						portalUrl,
						{
							query: {
								username: user,
								password: pass,
								client: "referer",
								referer: window.location.href,
								expiration: expiration,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					);
					if(response.data.token) resolve(response.data.token);
					else reject(response);
				}
				else reject("Both the username and password parameters must have a value");
			});
		},
		
		populateServiceWithFeatures: function(featureServiceURL, featuresToAdd, token) {
			return new Promise(async (resolve, reject) => {
				if(featureServiceURL && featuresToAdd) {
					try {
						let startIndex = 0;
						let endIndex = 0;
						let dataRemains = true;
						while(dataRemains) {
							if(endIndex + 1000 <= featuresToAdd.length) endIndex += 1000;
							else {
								endIndex = featuresToAdd.length;
								dataRemains = false;
							}
							console.log(featuresToAdd.slice(startIndex, endIndex));
							let stringifiedFeatures = this._convertFeaturesToString(featuresToAdd.slice(startIndex, endIndex));
							let query = {
								features: '[' + stringifiedFeatures.join() + ']',
								f: "json"
							}
							if(token) query.token = token;
							console.log(query);
							let response = await esriRequest(featureServiceURL + "/addFeatures",{query: query,responseType: "json",method: "post"});
							startIndex += 1000;
						}
						resolve("sdd");
					} catch (error) {
						reject(error);
					}
				}
				else reject("You must provide the URL to a FeatureService and an array of features");
			});
		},

		updateWebmap: function(organization, username, extent, basemap, operationalLayers, title, tags, token, webmapId) {
			return new Promise(async (resolve, reject) => {
				if(organization && username && extent && title && tags && token) {
					
					let webmapInfo = await this._getWebMapJSON(organization, webmapId, token);
					
					if(basemap) {
						basemap = basemap.toLowerCase();
						basemap = this._createBasemapJSON(basemap);
						console.log(basemap);
						webmapInfo.baseMap.baseMapLayers = basemap.baseMapLayers;
						webmapInfo.baseMap.title = basemap.title;
					}
					
					if(operationalLayers) {
						let layers = [];
						for(url in operationalLayers) {
							let layerInfo = await esriRequest(
								operationalLayers[url],
								{
									query: {
										f:"json"
									},
									responseType: "json",
									method: "post"
								}
							)
							console.log(layerInfo);
							let layer = {
								url: layerInfo.url,
								layerType: "ArcGISFeatureLayer",
								visibility: true,
								opacity: 1,
							}
							if(layerInfo.data.layers) {
								serviceName = this._getMapServiceName(layerInfo.url);
								layer.layerType = "ArcGISMapServiceLayer";
								layer.id = serviceName + "_" + this._getFourDigitNumber();
								layer.title = serviceName;
								if(layerInfo.data.itemId) layer.itemId = layerInfo.data.itemId;
							}
							else {
								layer.id = layerInfo.data.name + "_" + this._getFourDigitNumber();
								layer.popupInfo = {
									title: layerInfo.data.title,
									content: "*"
								};
								layer.description = layerInfo.data.description,
								layer.showAttachments = layerInfo.data.hasAttachments
							}
							layers.push(layer);
						}
						webmapInfo.operationalLayers = layers;
					}
					
					let response = await esriRequest(
						"https://" + organization + "/sharing/rest/content/users/" + username + "/items/" + webmapId + "/update", 
						{
							query: {
								type: "Web Map",
								extent: extent,
								text: JSON.stringify(webmapInfo),
								title: title,
								tags: tags,
								snippet: title,
								f: "json",
								token: token
							},
							responseType: "json",
							method: "post"
						}
					);
					
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to Create the WebMap");
				}
				else reject("You must provide all needed parameters");
			});
		},
		
		_addToServiceDefinition: async function(serviceName, orgId, wkid, geometryType, fields, renderer, token, options) {
			options.displayField = (options.displayField ? options.displayField : "ObjectID");
			options.description = (options.description ? options.description : "This is a service that was auto-generated by Nicholas Haney's EsriJSToolbelt");
			options.minScale = (options.minScale ? options.minScale : 0);
			options.maxScale = (options.maxScale ? options.maxScale : 0);
			options.transparency = (options.transparency ? options.transparency : 0);
			options.objectIdField = (options.objectIdField ? options.objectIdField : "ObjectID");
			options.drawingTemplate = this._createDrawingTemplate(geometryType, fields[1]);
			
			return new Promise(async (resolve, reject) => {
				if(serviceName && orgId && wkid && geometryType && fields && renderer && token) {
					let fixedGeometryType = "esriGeometry" + geometryType.charAt(0).toUpperCase() + geometryType.slice(1);
					let definition = '{"layers":[{"adminLayerInfo":{"geometryField":{"name":"Shape","srid":' + wkid + '}},"name":"' + serviceName + '","type":"Feature Layer","displayField":"' + options.displayField + '","description":"' + options.description +  '","copyrightText":"Autogenerated using the EsriJSToolbelt created by Nicholas Haney","defaultVisibility":true,"relationships":[],"isDataVersioned":false,"supportsRollbackOnFailureParameter":true,"supportsAdvancedQueries":true,"geometryType":"' + fixedGeometryType + '","minScale":' + options.minScale + ',"maxScale":' + options.maxScale + ',"extent":' + JSON.stringify(options.extent.toJSON()) + ',"drawingInfo":{"transparency":' + options.transparency + ',"labelingInfo":null,"renderer":' + JSON.stringify(renderer.toJSON()) + '},"allowGeometryUpdates":true,"hasAttachments":true,"htmlPopupType":"esriServerHTMLPopupTypeNone","hasM":false,"hasZ":false,"objectIdField":"' + options.objectIdField + '","globalIdField":"","typeIdField":"","fields":' + JSON.stringify(fields) + ',"indexes":[],"types":[],"templates":[' + options.drawingTemplate + '],"supportedQueryFormats":"JSON","hasStaticData":true,"maxRecordCount":10000,"capabilities":"Query"}]}';
					
					let response = await esriRequest(
						"https://services.arcgis.com/" + orgId + "/arcgis/rest/admin/services/" + serviceName + "/FeatureServer/addToDefinition",
						{
							query: {
								addToDefinition: definition,
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to update the service definition");				
				}
				else reject("You must include all required method parameters");
			});
		},
		
		_changeItemSharing: function(username, itemId, token, shareAll, shareOrg, shareGroup) {
			return new Promise(async (resolve, reject) => {
				if(username && itemId && token) {
					let response = await esriRequest(
						"https://www.arcgis.com/sharing/rest/content/users/" + username + "/shareItems",
						{
							query: {
								items: itemId,
								everyone: shareAll,
								org: shareOrg,
								groups: shareGroup,
								confirmItemControl: false,
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.results[0].success == true) resolve({success:true});
					else reject(response);
				}
				else reject("Must include an Organization Id, A Name To Test and a Portal Token");
			});
		},
		
		_checkLayerName: function(testName, orgId, token) {
			return new Promise(async (resolve, reject) => {
				if(orgId && testName && token) {
					let response = await esriRequest(
						"https://www.arcgis.com/sharing/rest/portals/" + orgId + "/isServiceNameAvailable",
						{
							query: {
								name: testName,
								type: "FeatureService",
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "get"
						}
					)
					if(response.data.available) resolve(response.data.available);
					else reject(response);
				}
				else reject("Must include an Organization Id, A Name To Test and a Portal Token");
			});
		},
		
		_createBasemapJSON: function(basemap) {
			let basemapInfo = this._esriBasemaps[basemap];
			let basemapLayers = [];
			for(var i = 0;  i < basemapInfo.layers.length; i++) {
				if(basemapInfo.layers[i].url) {
					basemapLayers.push({
						url:basemapInfo.layers[i].url,
						layerType:"ArcGISTiledMapServiceLayer",
						opacity:1,
						visibility:true,
						title: basemapInfo.layers[i].title,
						id:"defaultBasemap_" + i
					});
				}
				else {
					basemapLayers.push({
						id: "OpenStreetMap",
						layerType: "OpenStreetMap",
						opacity: 1,
						type: "OpenStreetMap",
						visibility: true
					});
				}
			}
			return {title: basemapInfo.title, basemapLayers: JSON.stringify(basemapLayers)};
		},
		
		_createDrawingTemplate: function(geometryType, field, description) {
			let templateJSON = {"name":"NewFeature","description":"","drawingTool":"","prototype":{"attributes":{}}};
			templateJSON.prototype.attributes[field.name] = null;
			if(description) templateJSON.description = description;
			if(geometryType == "point") templateJSON.drawingTool = "esriFeatureEditToolPoint";
			else if(geometryType == "polyline") templateJSON.drawingTool = "esriFeatureEditToolPolyline";
			else if(geometryType == "polygon") templateJSON.drawingTool = "esriFeatureEditToolPolygon";
			console.log(templateJSON);
			return JSON.stringify(templateJSON);
		},		
		
		_createEmptyFeatureService: function(username, token, userTags, extent, unit, serviceName) {
			return new Promise(async (resolve, reject) => {
				if(username && token && userTags && extent && unit && serviceName) {
					let response = await esriRequest(
						"https://www.arcgis.com/sharing/rest/content/users/" + username + "/createService",
						{
							query: {
								name: serviceName,
								typeKeywords: "ArcGIS Server,Data,Feature Access,Feature Service,Service,Hosted Service",
								outputType: "featureService",
								tags: userTags,
								createParameters: '{"maxRecordCount":2000,"supportedQueryFormats":"JSON","capabilities":"Query","description":"","allowGeometryUpdates":true,"hasStaticData":true,"units":"' + this._esriUnits[unit] + '","syncEnabled":false,"editorTrackingInfo":{"enableEditorTracking":false,"enableOwnershipAccessControl":false,"allowOthersToQuery":true,"allowOthersToUpdate":true,"allowOthersToDelete":false,"allowAnonymousToUpdate":true,"allowAnonymousToDelete":true},"xssPreventionInfo":{"xssPreventionEnabled":true,"xssPreventionRule":"InputOnly","xssInputRule":"rejectInvalid"},"initialExtent":' + JSON.stringify(extent.toJSON()) +',"spatialReference":' + JSON.stringify(extent.toJSON().spatialReference) + ',"tables":[],"name":"' + serviceName + '"}',
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.success == true) resolve(response.data);
					else reject(response);					
				}
				else reject("Must include all parameters");
			});
		},
		
		_deleteAGOLItem: function(itemNumber, username, organization, token) {
			return new Promise(async (resolve, reject) => {
				if(token) {
					let response = await esriRequest(
						"https://" + organization + "/sharing/rest/content/users/" + username + "/items/" + itemNumber + "/delete",
						{
							query: {
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to delete item");
				}
				else reject("Must Include All Required Method Parameters");
			});
		},
		
		_getFourDigitNumber: function() {
			return Math.floor(1000 + Math.random() * 9000);
		},
		
		_getMapServiceName: function(url) {
			var parsedUrl = url.split('/');
			return parsedUrl[parsedUrl.length - 2];
		},
		
		_getObjectIdsFromFeatureService: function(featureServiceURL, token) {
			return new Promise(async (resolve, reject) => {
				if(featureServiceURL) {
					let query = {
						where: "1=1",
						geometryType: "esriGeometryEnvelope",
						returnIdsOnly: "true",
						f: "json"
					}
					if(token) query.token = token;
					try {
						let response = await esriRequest(
							featureServiceURL + "/query",
							{
								query: query,
								responseType: "json",
								method: "post"
							}
						)
						resolve(response.data.objectIds);
					} catch (error) {
						reject(error);
					}
				}
				else reject("You must provide the URL to a FeatureService");				
			});
		},
		
		_getOrgId: function(token) {
			return new Promise(async (resolve, reject) => {
				if(token) {
					let response = await esriRequest(
						"https://www.arcgis.com/sharing/rest/portals/self",
						{
							query: {
								culture: "en-us",
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "get"
						}
					)
					if(response.data.id) resolve(response.data.id);
					else reject("Invalid token");
				}
				else reject("Must include a token");
			});
		},
		
		_getWebMapJSON: function(organization, id, token) {
			return new Promise(async (resolve, reject) => {
				if(token && organization && id) {
					let response = await esriRequest(
						"http://" + organization + "/sharing/rest/content/items/" + id + "/data",
						{
							query: {
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "get"
						}
					)
					if(response.data) resolve(response.data);
					else reject("Invalid token");
				}
				else reject("Must include all required method parameters");
			});			
		},
		
		_updateDefinition: function(orgId, serviceName, token) {
			return new Promise(async (resolve, reject) => {
				if(orgId && serviceName && token) {
					let response = await esriRequest(
						"https://services.arcgis.com/" + orgId + "/arcgis/rest/admin/services/" + serviceName + "/FeatureServer/updateDefinition",
						{
							query: {
								updateDefinition: '{"capabilities":"Query,Editing,Create,Update,Delete,Extract","allowGeometryUpdates":true,"hasStaticData":false,"editorTrackingInfo":{"enableEditorTracking":false,"enableOwnershipAccessControl":false,"allowOthersToUpdate":true,"allowOthersToDelete":true,"allowOthersToQuery":true,"allowAnonymousToUpdate":true,"allowAnonymousToDelete":true}}',
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to update the service definition");
				}
				else reject("You must include all required method parameters");
			});
		},
		
		_updateService: function(serviceName, tags, userName, itemId, token) {
			return new Promise(async (resolve, reject) => {
				if(token && serviceName && tags && userName && itemId) {
					let response = await esriRequest(
						"https://www.arcgis.com/sharing/rest/content/users/" + userName + "/items/" + itemId + "/update",
						{
							query: {
								clearEmptyFields: true,
								title: serviceName,
								tags: tags,
								typeKeywords: "ArcGIS Server,Data,Feature Access,Feature Service,Service,Singlelayer,Hosted Service",
								token: token,
								f:"json"
							},
							responseType: "json",
							method: "post"
						}
					)
					if(response.data.success == true) resolve(response.data);
					else reject("Failed to update service");
				}
				else reject("You must include all required method parameters");
			});
		}
	
	});

});