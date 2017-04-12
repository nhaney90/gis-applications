# Use Print Task In JavaScript 4.2 API

## About
This is a very simple application showing how to use the Print Task in the JavaScript 4.2 API. This sample was written because there is currently no sample in the offical API documentation.

[Live Sample](https://nhaney90.github.io/use-print-task-42/index.html)

## How It Works
Create a print task using the URL to your desired print service.
```javascript
var printUrl = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
var printTask = new PrintTask({
	url: printUrl
});
```

Create a new print template. This is where options such as output format and layout are specified. Then use the current map view and the template to create a print parameters oject.
```javascript
var template = new PrintTemplate({
	format: "pdf",
	exportOptions: {
		dpi: 300
	},
	layout: "a3-landscape",
	layoutOptions: {
		titleText: "My Map",
		authorText: "Esri"
	}
});
var params = new PrintParameters({
	view: view,
	template: template
});
```

Call the print service using the export method of the print task and passing in the print parameters. Handle the successful complete and failure this request using the then method.
```javascript
	printTask.execute(params).then(printResult, printError);
```

After request has successfully completed and the output image has been created, open the file in a new tab using the window.open method and focusing on that tab.
```javascript
function printResult(result) {
	var win = window.open(result.url, '_blank');
	win.focus();
}
```
