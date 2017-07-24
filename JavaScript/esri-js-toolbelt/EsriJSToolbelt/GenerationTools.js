define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	
	"esri/Color",
	"esri/Graphic",
	"esri/Map",
	"esri/PopupTemplate",
	"esri/geometry/Extent",
	"esri/geometry/Point",
	"esri/geometry/Polyline",
	"esri/geometry/Polygon",
	"esri/geometry/SpatialReference",
	"esri/renderers/ClassBreaksRenderer",
	"esri/renderers/SimpleRenderer",
	"esri/renderers/UniqueValueRenderer",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/tasks/GeometryService",
	"esri/tasks/support/ProjectParameters",
	"EsriJSToolbelt/GeneralTools.js",
	"esri/views/MapView"
	
],function(
	declare, lang, Color, Graphic, Map, PopupTemplate, Extent, Point, Polyline, Polygon, SpatialReference, ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, GeometryService, ProjectParameters, GeneralTools, MapView 
) {
	return declare([GeneralTools], {
		
		constructor: function(options){},
			
		createFeatureCollection: function(features, symbol, name, fields, spatialReference, reproject, popupTemplate, renderer) {
			return new Promise(async (resolve, reject) => {
				let fSet = {};

				fSet.geometryType = this._getGeometryType(features[0].geometry);
				fSet.name = (name ? name : fSet.geometryType + "Layer");
				fSet.spatialReference = (spatialReference ? spatialReference : new SpatialReference(4326));
				fSet.fields = (fields ? fields : this._createFieldsList(features[0].attributes));
				fSet.objectIdField = "ObjectID";
				fSet.renderer = (renderer ? renderer : this.createRenderer(fSet.geometryType, "simple"));
				fSet.displayFieldName = fSet.fields[0].name;
				fSet.popupTemplate = (popupTemplate ? popupTemplate : this.createPopupTemplate(fSet.displayFieldName));
				
				if(reproject) fSet.source = await this._reprojectFeatures(features, spatialReference);
				else fSet.source = features;
				resolve(fSet);
			});
		},
		
		createAnExtent:function(point, sr, size) {
			return new Promise(async (resolve, reject) => {
				if(size) {
					if(size > 10) size = 10;
				}
				else size = 5;
				if(point == null) {
					let tempExtent = new Extent({
						xmin: -170,
						ymin: -80,
						xmax: 170,
						ymax: 80,
						spatialReference: { wkid: 4326 }
					});
					point = this.createRandomPoint(tempExtent);
				}
				let reprojectedPoint = await this._reprojectGeometries([point], 4326);
				let extent = new Extent({
					xmin: reprojectedPoint[0].x - size,
					ymin: reprojectedPoint[0].y - size,
					xmax: reprojectedPoint[0].x + size,
					ymax: reprojectedPoint[0].y + size,
					spatialReference: { wkid: 4326 }
				});
				if(sr) {
					let projectedExtent = await this._reprojectGeometries([extent], sr);
					resolve(projectedExtent[0]);
				}
				else resolve(extent);
			});
		},
		
		createPopupTemplate: function(name) {
			let popupTemplate = new PopupTemplate();
			popupTemplate.title = "{" + name + "}";
			popupTemplate.content = "{*}";
			return popupTemplate;
		},
		
		createRandomGeometry: function(type, number, spatialReference, extent) {
			return new Promise(async (resolve, reject) => {
				if(type && number) {
					let geometries = [];
					let method
					
					if(type == "point") method = lang.hitch(this, this.createRandomPoint);
					else if(type == "polyline") method = lang.hitch(this, this.createRandomPolyline);
					else if(type == "polygon") method = lang.hitch(this, this.createRandomPolygon);
					
					if(!extent) {
						extent = new Extent({
							xmin: -170,
							ymin: -80,
							xmax: 170,
							ymax: 80,
							spatialReference: { wkid: 4326 }
						});
					}
					
					let newExtent = await this._reprojectGeometries([extent], 4326);
					extent = newExtent[0];
					for(let i = 0; i < number; i++) {
						geometries.push(method(extent));
					}
					if(spatialReference) {
						let projectedGeometries = await this._reprojectGeometries(geometries, spatialReference);
						resolve(projectedGeometries);
					}
					else resolve(geometries);
				}
				else reject("Must included all required field parameters");
			});
		},
		
		createRandomPoint:function(extent) {
			return new Point({
				x: Math.random() * (extent.xmin - extent.xmax) + extent.xmax,
				y: Math.random() * (extent.ymin - extent.ymax) + extent.ymax,
				spatialReference: extent.spatialReference
			});
		},
		
		createRandomPolygon:function(extent) {
			let anchorPoint = this.createRandomPoint(extent);
			return new Polygon({
				rings: [
					[
						[anchorPoint.x, anchorPoint.y],
						[anchorPoint.x + 2, anchorPoint.y],
						[anchorPoint.x + 2, anchorPoint.y + 2],
						[anchorPoint.x, anchorPoint.y + 2],
						[anchorPoint.x, anchorPoint.y]
					]
				],
				spatialReference: { wkid: 4326 }
			});
		},
		
		createRandomPolyline:function(extent) {
			let anchorPoint = this.createRandomPoint(extent);
			return new Polyline({
				paths: [
					[
						[anchorPoint.x, anchorPoint.y],
						[anchorPoint.x + 2, anchorPoint.y],
						[anchorPoint.x + 2, anchorPoint.y + 2]
					]
				],
				spatialReference: { wkid: 4326 }
			});
		},
		
		createRandomSymbol: function(type, randomStyle, alpha) {
			if(!type) type == "point";
			if(type == "point") {
				return new SimpleMarkerSymbol({
					style: this.getRandomStyle(type, randomStyle),
					size: 12,
					color: this.createRandomColor(alpha)
				});
			}
			else if(type == "polyline") {
				return new SimpleLineSymbol({
					style: this.getRandomStyle(type, randomStyle),
					width: 1.25,
					color: this.createRandomColor(alpha)
				});
			}
			else if(type == "polygon"){
				return new SimpleFillSymbol({
					style: this.getRandomStyle(type, randomStyle),
					outline: {
						style: "solid",
						color: [0,0,0,1]
					},
					color: this.createRandomColor(alpha)
				});
			}
		},
		
		createGraphics:function(geometries, attributes, spatialReference, symbol, infoTemplate) {
			return new Promise(async (resolve, reject) => {
				let features = [];
				if(infoTemplate && attributes) infoTemplate = this.createPopupTemplate(attributes[Object.keys(attributes)[0]]);
				if(!symbol) symbol = this.createRandomSymbol(geometries[0].type);
				for(let i = 0; i < geometries.length; i++) {
					features.push(new Graphic(geometries[i],symbol,attributes,infoTemplate));
				}
				if(spatialReference) {
					let results = await this._reprojectFeatures(features, spatialReference)
					resolve(results);
				}
				else resolve(features);
			});
		},	
		
		getRandomStyle: function(type, randomOutline) {
			const pointStyles = ["circle","cross","diamond","square","x"];
			const lineStyles = ["dash","dash-dot","dot","long-dash","long-dash-dot","long-dash-dot-dot","short-dash","short-dash-dot","short-dash-dot-dot","short-dot","solid"];
			const polygonStyles = ["backward-diagonal","cross","diagonal-cross","forward-diagonal","horizontal","solid","verticle"];
		
			if(type == "point") {
				if(randomOutline) return pointStyles[Math.floor(Math.random() * pointStyles.length)];
				else return "circle";
			}
			else if(type == "polyline") {
				if(randomOutline) return lineStyles[Math.floor(Math.random() * lineStyles.length)];
				else return "solid";			
			}
			else if(type == "polygon") {
				if(randomOutline) return polygonStyles[Math.floor(Math.random() * polygonStyles.length)];
				else return "solid";		
			}
		},
		
		_getGeometries: function(features, sr) {
			let geometries = [];
			for(let i = 0; i < features.length; i++) {
				if(sr) features[i].spatialReference = sr;
				geometries.push(features[i].geometry);
			}
			return geometries;
		},
			
		_getGeometryType: function(geometry) {
			if(geometry.hasOwnProperty('paths')) return "polyline";
			else if(geometry.hasOwnProperty('rings')) return "polygon";
		},
		
		_reprojectFeatures: function(features, sr) {
			return new Promise(async (resolve, reject) => {
				let params = new ProjectParameters();
				if(features[0].geometry.spatialReference) {
					params.inSr = features[0].geometry.spatialReference;
					params.geometries = this._getGeometries(features);
				}
				else {
					params.inSr = new SpatialReference(4326);
					params.geometries = this._getGeometries(features, params.inSr);
				}
				params.outSR = new SpatialReference(sr);
				let results = await this.gService.project(params);
				resolve(this._updateGeometries(features, results));
			});
		},
		
		_updateGeometries: function(features, geometries) {
			for(let i = 0; i < features.length; i++) {
				features[i].geometry = geometries[i];
			}
			return features;
		}
	});
});