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
	"esri/views/MapView"
	
],function(
	declare, lang, Color, Graphic, Map, PopupTemplate, Extent, Point, Polyline, Polygon, SpatialReference, ClassBreaksRenderer, SimpleRenderer, UniqueValueRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, GeometryService, ProjectParameters, MapView 
) {
	return declare(null, {
		
		constructor: function(options){},
		
		createRandomColor: function(alpha) {
			let r = Math.floor(Math.random() * 255) + 1;
			let g = Math.floor(Math.random() * 255) + 1;
			let b = Math.floor(Math.random() * 255) + 1;
			let a = 1;
			if(alpha) a = 0.5
			return new Color([r,g,b,a]);
		},
		
		createRenderer: function(geometryType, type, field, fieldValues, breaks) {
			if(type == "simple") {
				return new SimpleRenderer({symbol: this.createRandomSymbol(geometryType, true)});
			}
			else if(type == "breaks" && breaks != null && field != null) {
				let renderer = new ClassBreaksRenderer({
					field: field
				});
				for(let i = 0; i < breaks.length - 1; i++) {
					renderer.addClassBreakInfo({
						minValue: breaks[i],
						maxValue: breaks[i + 1],
						symbol: this.createRandomSymbol(geometryType, true),
						
					});
				}
				return renderer;
			}
			else if(type == "unique" && field != null && fieldValues != null) {
				var renderer = new UniqueValueRenderer({
					field: field,
					defaultSymbol: this.createRandomSymbol(geometryType, true)
				});
				for(let i = 0; i < fieldValues.length; i++) {
					renderer.addUniqueValueInfo({
						value: fieldValues[i],
						symbol: this.createRandomSymbol(geometryType, true)
					});
				}
				return renderer;
			}
			else return null;
		},
		
		gService: new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"),
		
		_checkFieldType: function(attribute) {
			if(typeof attribute == "number" && attribute.toString().length >= 12) return "date";
			else return typeof attribute;
		},
		
		_convertFeaturesToString: function(features) {
			var newArray = [];
			for(let i = 0; i < features.length; i++) {
				let graphic = new Graphic({
					geometry: features[i].geometry,
					attributes: features[i].attributes
				});
				newArray.push(JSON.stringify(graphic.toJSON()));
			}
			return newArray;
		},
		
		_createFieldsList: function(attributes, service) {
			let fields = [];
			fields.push({
				name: "ObjectID",
				alias: "ObjectID",
				type: "oid"
			});
			if(service) {
				fields[0].type = "esriFieldTypeOID";
				fields[0].sqlType = "sqlTypeOther";
				fields[0].nullable = "false";
				fields[0].domain = null;
				fields[0].defaultValue = null;
			}
			for(let property in attributes) {
				if(attributes.hasOwnProperty(property)) {
					let field = {
						name: property,
						alias: property.charAt(0).toUpperCase() + property.slice(1),
						type: this._checkFieldType(attributes[property])
					}
					if(service) {
						field.sqlType = this._checkServiceGeometryType(field.type);
						field.type = this._checkServiceGeometryType(field.type);
						field.editable = true;
						field.domain = null;
						field.defaultValue = null;
						field.length = 256;
					}
					fields.push(field);
				}
			}
			return fields;
		},
		
		_checkServiceGeometryType: function(basicType) {
			if(basicType == "string") return "esriFieldTypeString";
			else if(basicType == "number") return "esriFieldTypeDouble";
			else if(basicType == "date") return "esriFieldTypeDate";
		},
		
		_checkSQLType: function(basicType) {
			if(basicType == "string") return "sqlTypeNVarchar";
			else if(basicType == "number") return "sqlTypeDecimal";
			else if(basicType == "date") return "sqlTypeOther";
		},
		
		_esriBasemaps: {
			"imagery": {
				title: "World Imagery",
				layers: [{
					title: "World Imagery",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
				}]
			},
			"hybrid": {
				title: "World Imagery",
				layers: [{
					title: "World Imagery",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
				},{
					title: "World Boundaries and Places",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
				}]
			},
			"streets": {
				title: "Streets",
				layers: [{
					title: "World Street Map",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
				}]
			},
			"topo": {
				title: "Topographic",
				layers: [{
					title: "World Topographic Map",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
				}]
			},
			"dark-gray": {
				title: "Dark Gray Canvas",
				layers: [{
					title: "World Dark Gray Canvas Base",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer"
				},{
					title: "World Dark Gray Reference",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer"
				}]
			},
			"light-gray": {
				title: "Light Gray Canvas",
				layers: [{
					title: "World Light Gray Canvas Base",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer"
				},{
					title: "World Light Gray Reference",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Reference/MapServer"
				}]
			},
			"natgeo": {
				title: "National Geographic",
				layers: [{
					title: "National Geographic World Map",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer"
				}]
			},
			"terrain": {
				title: "World Terrain Base",
				layers: [{
					title: "World Terrain Base",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer"
				},{
					title: "World Terrain Reference",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer"
				}]
			},
			"oceans": {
				title: "Oceans",
				layers: [{
					title: "World Ocean Base",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer"
				},{
					title: "World Ocean Reference",
					url: "https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer"
				}]
			},
			"osm": {
				title: "OpenStreetMap",
				layers: [{
					url: null,
					layerType: "OpenStreetMap",
					type: "OpenStreetMap"
				}]
			},			
		},
		
		_esriUnits: {
			unknown: "esriUnknownUnits",
			inches: "esriInches",
			points: "esriPoints",
			feet: "esriFeet",
			yards: "esriYards",
			miles: "esriMiles",
			nauticalMiles: "esriNauticalMiles",
			millimeters: "esriMillimeters",
			centimeters: "esriCentimeters",
			meters: "esriMeters",
			kilometers: "esriKilometers",
			decimaldegrees: "esriDecimalDegrees",
			decimeters: "esriDecimeters",
		},
		
		_reprojectGeometries:function(features, sr) {
			return new Promise(async (resolve, reject) => {
				let params = new ProjectParameters();
				params.geometries = features;
				params.outSR = new SpatialReference(sr);
				if(features[0].spatialReference.wkid == params.outSR.wkid) resolve(features);
				else {
					let results = await this.gService.project(params);
					resolve(results);
				}
			});
		}
	});
});		