var rose_array = [];

// Parameters Events handler
document.getElementById('parameters').addEventListener('change', eventChangeHandler);

function eventChangeHandler(e) {
	if (e.target !== e.currentTarget) {
	
		var item = e.target.id;
		if(item == "layers")
			updateZCamera(document.getElementById("layers").value);
        drawing(document.getElementById("n").value, document.getElementById("d").value);
	}
    e.stopPropagation();
} 
	
// @brief Check if a number is nule, return 0 if not
function isNule(v){
    if(isNaN(v)){
         return 0;
    }else{
        return v;
    }
}

// @brief This functions creates an array holding all the point values for the rose path (x,y,z)

function createRosePath(){
	var k = document.getElementById("n").value/document.getElementById("d").value;
	var finFor = document.getElementById("rose_turns").value;
	rose_array = [];
	for(var h = 0; h < document.getElementById("layers").value; h++){
		// Calculate desired rotation per height
		var loopRotation = document.getElementById("rotation").value * h;
		var loopScale = layerScale(h);
		
		for(var t = 0; t <= finFor; t++){

			var layer_height = Number(document.getElementById("height").value) * h + 
			Number(document.getElementById("first_height").value);
			
			var t_rad = t * (Math.PI/180);
			var x = loopScale * Math.sin(k*t_rad)*Math.sin(t_rad);
			//console.log("x = " + x);
			var y = loopScale * Math.sin(k*t_rad)*Math.cos(t_rad);
			// Scale rose
			// Rotating points
			var rotated = rotateRose(x,y,loopRotation);
			var x_rotated = rotated[0];
			var y_rotated = rotated[1];
			
			x_rotated = Math.round( loopScale*document.getElementById("diameter").value/2 * x_rotated * 100) / 100;
			y_rotated = Math.round( loopScale*document.getElementById("diameter").value/2 * y_rotated * 100) / 100;
			
			rose_array[t+h*finFor]= [ isNule(x_rotated), isNule(y_rotated), isNule(layer_height)];
		}
	}
	addExtrusionValues();
}

function addExtrusionValues(){
	var e = 0;
	var layer = 0;
	
	var material_diameter = parseFloat(document.getElementById("material_diameter").value);
    var nozzle_diameter = parseFloat(document.getElementById("nozzle_diameter").value);
    var nozzle_surface = Math.PI * Math.pow((nozzle_diameter/2),2);
    var material_surface = Math.PI * Math.pow((material_diameter/2),2);
	console.log("Nozzle surface = " + nozzle_surface + ", Material Surface = " + material_surface);
    var nozzle_material_surfaces_ratio = nozzle_surface / material_surface;
	
	for(var i = 0; i < rose_array.length; i++){
		if(i == 0){ // First point no extrusion
			rose_array[i][3] = 0;
		} else if (layer != rose_array[i][2]) {
			// when changing a layer do not calculate extrusion
			rose_array[i][3] = Math.round(10000 * e) / 10000;
		} else {
			// Calculate distance previous and current point
			var delta_x = rose_array[i][0] - rose_array[i-1][0];
			var delta_y = rose_array[i][1] - rose_array[i-1][1];
			
			var distance = Math.sqrt(Math.pow(delta_x,2) + Math.pow(delta_y,2));
			e += distance * nozzle_material_surfaces_ratio;
			rose_array[i][3] = Math.round(10000 * e) / 10000;
			
			//console.log("delta x = " + delta_x + ", delta_y = "  + delta_y);
			//console.log("Distance = " + distance + ", extrusion = " + e);
		}
	layer = rose_array[i][2];
	}
}

function buildGCode() {

	var fullGCode ="G28 \n";
	var layer = 0;
	
	for(var i = 0; i < rose_array.length; i++){
		if(i == 0){ // First layer
			// Origin x,y,z plus feedrate
			fullGCode +=  "G1 X" + rose_array[i][0] + " Y" + rose_array[i][1] 
						+ " Z" + rose_array[i][2] + " E" + rose_array[i][3] 
						+ " F" + document.getElementById("feedrate").value + "\n";
			fullGCode += "M126 \n";
			fullGCode += "G4 P" + document.getElementById("delay").value + "\n";
			layer = rose_array[i][2];
		}
		else if(layer != rose_array[i][2]){ 
		// On each layer change add new Z value to the GCode command
			fullGCode +=  "G1 X" + rose_array[i][0] + " Y" + rose_array[i][1] + " Z" + rose_array[i][2] + " E" + rose_array[i][3] + "\n";
		}
		else {
			fullGCode +=  "G1 X" + rose_array[i][0] + " Y" + rose_array[i][1] + " E" + rose_array[i][3] + "\n";
		}
		layer = rose_array[i][2];
	}
	
	// Close air extrusion
	fullGCode += "M127 \n";
	//homing
	fullGCode += "G28 \n";
	
	return fullGCode;
}

function drawing(){
	createRosePath();
	var radius = Number(document.getElementById("diameter").value)/2;
	draw3dRose(radius);
}

function rotateRose( x, y, layerRotation){
//http://www.mathematics-online.org/inhalt/aussage/aussage444/
// x' = cos(rot) * x + sin(rot) * y
// y' = -sin(rot) * x + cos(rot) * y
	var rot = Number(layerRotation) * ( Math.PI / 180 );
	var x_rot = Math.cos(rot) * x + Math.sin(rot) * y;
	var y_rot = -Math.sin(rot) * x + Math.cos(rot) * y;
	
	return[x_rot, y_rot];
}

// @brief Calculates the layer scale value 1 (100%) for each layer
function layerScale( h ){
	
	var totalScale = document.getElementById("scale").value;
	if (totalScale > 100){
		var layerScale = (totalScale - 100) / (document.getElementById("layers").value);
		return ( 1 + (layerScale/100) * h );
	}
	else if(totalScale < 100){
		var layerScale = (100 - totalScale) / (document.getElementById("layers").value);
		return ( 1 - (layerScale/100) * h );
	}
	else
		return 1;
}

function resize_canvas(){
}

function createFile(){
	var output = getParameters();
	output += buildGCode();
	var GCodeFile = new Blob([output], {type: 'text/plain'});
	saveAs(GCodeFile, document.getElementById("name").value + '.gcode');
	//window.open().document.write(output);
}

function getParameters(){
var params = [];
	params += "; GCode generated with Roses from www.3digitalcooks.com \n";
	params += "; Layer height [mm]: " + document.getElementById("height").value + "\n";
	params += "; 1st layer height [mm]: " + document.getElementById("first_height").value + "\n";
	params += "; Number of layers: " + document.getElementById("layers").value + "\n"; 
	params += "; Feedrate [mm/min]: " + document.getElementById("feedrate").value + "\n"; 
	params += "; Initial delay [ms]: " + document.getElementById("delay").value + "\n"; 
	
return params;
}

drawing();

