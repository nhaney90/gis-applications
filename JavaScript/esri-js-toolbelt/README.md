# The Esri JS Toolkit

## About
As an SDK Support Analyst for Esri I spend my days writing sample applications for customers to demonstrate how to implement particular workflows using the Esri JavaScript API. Create a map, create some fake data to test with, style the map, and add relevant widgets. After this initial setup I could write the code to the customer is looking for. After doing this for a number of years I decided much of this work could be automated. The Esri JS Toolkit is a library that can handle tedious tasks such as publishing to AGOL, creating random data and basic GUI design with a single method call. Methods will continue to be added to this library as I think of tasks to automate. If you have any suggestions please let me know!

[Live Sample - Creates a FeatureLayer and populates it with randomly placed polygons](https://nhaney90.github.io/esri-js-toolbelt/index.html)

## Limitations:

This library targets the Esri JavaScript API version 4.4 or higher. There are currently no plans to add support for the 3.x version of the API. The methods in this library are designed to work with 2D MapViews. Support for 3D MapViews will be added in the future. This library uses some JavaScript keywords (await, async etc) that are not supported in Internet Explorer or older verisons of Chrome and Firefox. This library will need to be transpiled before you can use it within one of those browsers.

## Usage notes:
The following code snippets show how to use this library in your application

Configure the dojo loader to pull from the widget's location:
```html
<script type="text/javascript">
    var dojoConfig = {
        packages: [{
            name: "EsriJSToolbelt",
            location: "/EsriJSToolbelt"
        }]
    };
</script>
```
Include the widget in your require statement:
```javascript
require([
	"EsriJSToolbelt/EsriJSToolbelt"
], function(EsriJSToolbelt){
```

Create an instance of the library. Now you can call one of the library's functions:
```javascript
const ToolBelt = new EsriJSToolbelt();
let token = await ToolBelt.getAToken("username", "password");
```
## Method List (will continue to update):

**createAnExtent(** *Point* point, *string* wkid(optional), *number* size(optional) **)** - Create an extent centered on a point with a spatial reference of 4326 with it's size expanded by 5 decimal degrees in each direction. Optionally create an extent in any spatial reference by specifing a WKID. Optionally expand the extent by a number of decimal degrees up to 10. 

**createEmptyWebmapInAGOL(** *string* organization, *string* username, *Extent* extent, *string* title, *String* tags, *String* token, *string* basemapName(optional)) - Create an empty webmap in ArcGIS Online. Optionally specify the basemap for the webmap. The default value is "streets".

**createGraphics(** *Geometry[]* geometries, *json[]* attributes(optional), *string* wkid(optional), *Symbol* symbol(optional), *PopupTemplate* popupTemplate(optional)) - Create an array of graphics based on an input geometry with a randomly created symbology. Optionally specify an array of attributes to be used with each graphic. Optionally specify a WKID to reproject the graphics into. Otherwise the default spatial reference of the input geometries will be used. Optionally specify the symbol to be used with the graphics. Optionally specify the popuptemplate to be used with the graphics.

**createRandomColor(** *number* alpha(optional) **)** - Create a random color. Optionally specify the alpha value for the color.

**createRenderer(** *string* geometryType, *string* rendererType, *string* field(optional), *object[]* fieldValues(optional), *number[]* breakValues(optional) **)** - Create a renderer based on a string representing the renderer type with randomly generated symbols. The possible values are "simple", "unique" and "breaks". If creating a UniqueValueRenderer or a ClassBreaksRenderer a string representing the field the renderer is based on must be specified. If creating a ClassBreaksRenderer an array of break values must be included. If creating a UniqueValueRenderer an array of field values must be included.

**createRandomGeometry(** *string* geometryType, *number* numberOfFeatures, *string* wkid(optional), *Extent* extent(optional) **)** - Create randomly generated geometries of the specified geometry type with a spatial reference of 4326. The possible geometry type values are "point", "polyline" and "polygon". Optionally create the geometries in the specified spatial reference. Optionally generate each geometry within the area of the specified extent.

**createRandomSymbol(** *string* symbolType, *boolean* randomStyle, *number* alpha(optional) **)** - Create a random symbol based on a string representing the geometry type. The posible values are "point", "polyline" and "polygon". You can specify whether you would like a random style for the symbol. The default values are solid for polylines and polygons and circle for points. Optionally specify an alpha value for the symbol's color.

**deleteAllFeaturesInService(** *string* featureServiceURL, *string* token **)** - Delete all features in the given FeatureService.

**getAToken(** *string* username, *string* username, *string* portalUrl(optional), *number* timeUntilExpiration(optional) **)** - Create a portal token using the given username and password. Optionally specify the portal url. The default value is www.arcgis.com. Optionally specify the expiration time for the token in minutes. The default value is 60.

**justMakeMeAFeatureService(** *string* userName, *string* token, *string* featureServiceName, *string* listOfTags, *string* geometryType, *json* sampleAttributeObject, *json* options(optional) **)** - Creates an empty FeatureService in ArcGIS Online. Optionaly specify a set of options used to customize the FeatureService. The optional values are:

* *string* displayField - Default value is "ObjectID".
* *string* description - Service description. Default value is "This is a service that was auto-generated by Nicholas Haney's EsriJSToolbelt".
* *number* minScale - Minimum scale of the service. Default value is 0.
* *number* maxScale - Maximum scale of the service. Default value is 0.
* *number* transparency - The transparency of features in the service. Default value is 0.
* *string* objectIdField - The field representing the object id field of the service. Default value is ObjectID.
* *Extent* extent - The geographic extent of the service. The spatial reference of the extent will also be the spatial reference of the service. Default value is {xmin: -170,ymin: -80,xmax: 170,ymax: 80,spatialReference: { wkid: 4326 }}
* *json* drawingTemplate - The drawing template to be used when creating features. The default value is a simple symbol with no present attribute values.
* *linearUnit* - The linear unit of the service. The default value is "meters".

**justMakeMeAFeatureServiceWithSomeDataInIt(** *string* userName, *string* token, *string* featureServiceName, *string* listOfTags, *string* geometryType, *json* sampleAttributeObject, *number* numberOfFeatures, *json* options **)** - Creates a FeatureService in ArcGIS Online and populate it with randomly generated features based on the geometryType string. The possible values for the geometryType are "point", "polyline" and "polygon". Optionaly specify a set of options used to customize the FeatureService. The optional values are:

* *string* displayField - Default value is "ObjectID".
* *string* description - Service description. Default value is "This is a service that was auto-generated by Nicholas Haney's EsriJSToolbelt".
* *number* minScale - Minimum scale of the service. Default value is 0.
* *number* maxScale - Maximum scale of the service. Default value is 0.
* *number* transparency - The transparency of features in the service. Default value is 0.
* *string* objectIdField - The field representing the object id field of the service. Default value is ObjectID.
* *Extent* extent - The geographic extent of the service. Default value is {xmin: -170,ymin: -80,xmax: 170,ymax: 80,spatialReference: { wkid: 4326 }}
* *json* drawingTemplate - The drawing template to be used when creating features. The default value is a simple symbol with no present attribute values.
* *linearUnit* - The linear unit of the service. The default value is "meters".

**justMakeMeSomeData**(*string* geometryType, *number* numberOfFeatures, *json* sampleAttributeObject(optional), *string* wkid(optional), *PopupTemplate* infoTemplate(optional), *Extent* extent(optional), *Map* map(optional) **)** - Create a FeatureSet populated with randomly generated features of the specified geometry type. The possible geometry type values are "point", "polyline" and "polygon". Optionally specify a sample attribute object to be used with the features. Optionally specify a spatial reference for the features using a string representing a WKID. The default spatial reference is 4326. Optionally specify the popuptemplate to be used with the features. Optionally generate each geometry within the area of the specified extent. If a map object is specified, a FeatureLayer will be created from the FeatureSet and added to the map.

**populateServiceWithFeatures(** *string* featureServiceURL, *Graphic[]* featuresToAdd, *string* token) - Add an array of features to a FeatureService.

**updateWebmap(** *string* organization, *string* username, *Extent* extent, *string* basemap,  *string[]* operationalLayers, *string* title, *string* listOfTags, *string* token, *string* webmapId) - Update the basemap, operational layers and metadata of a Webmap hosted in ArcGIS Online.