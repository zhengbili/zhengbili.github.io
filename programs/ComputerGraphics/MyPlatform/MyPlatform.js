var gl;
var canvas;
var program;
var vPosition;
var vNormal;
var models = {};
var selectedModel;
var keymap={16:'Shift',27:'Esc',32:'Space',37:'Left',38:'Up',39:'Right',40:'Down',46:'Delete',
65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z'};
var world = {
	time: Date.now(),
	R: 15,
	theta: Math.PI / 2,
	autoRotate: false,
	eye: vec3(0.0, 0.1, 15),
	at: vec3(0.0, 0.0, 0),
	up: vec3(0.0, 1.0, 0.0),
	ProjectionType: 'ortho',
	ShadowType: 'point',
	//ShadeType: 'point',//默认与ShadowType相同
	horizon: -0.5,
	lightPosition : vec4(-1.0, 1.0, 10.0, 0.0 ),
	lightAmbient : vec4(0.2, 0.2, 0.2, 1.0 ),
    lightDiffuse : vec4( 1.0, 1.0, 1.0, 1.0 ),
	lightSpecular : vec4( 1.0, 1.0, 1.0, 1.0 )
};
world.update = function() {
	var k=(Date.now()-world.time)/1000;
	var d=subtract(world.eye,world.at);d[1]=0;
	switch(keymap[document.keyCode]){
		case 'I':world.at=subtract(world.at,scale(k,d));break;
		case 'J':world.at=add(world.at,scale(0.3*k,cross(d,[0,1,0])));break;
		case 'K':world.at=add(world.at,scale(k,d));break;
		case 'L':world.at=add(world.at,scale(0.3*k,cross(d,[0,-1,0])));break;
		case 'W':models.sun.Position[1]+=0.1*k;break;
		case 'S':models.sun.Position[1]-=0.1*k;break;
		case 'A':models.sun.Position[0]-=0.1*k;break;
		case 'D':models.sun.Position[0]+=0.1*k;break;
		case 'P':world.ProjectionType=world.ProjectionType=='perspective'?'ortho':'perspective';document.keyCode=undefined;break;
		case 'Q':world.ShadowType=world.ShadowType=='line'?'point':'line';document.keyCode=undefined;break;
		case 'Esc':cancelAnimationFrame(timer);inform('世界','实时渲染暂停');document.keyCode=undefined;break;
		break;
		case 'Delete':for(modelname in models)if(models[modelname].Id==selectedModel.Id){delete models[modelname];selectedModel=undefined;models['beacon'].Printable=false;document.keyCode=undefined;break;}break;
//三维移动
// T   Y
//  \ /
//F--G--H
//  / \
// V   B
		case 'V':if(selectedModel)selectedModel.Position=add(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Direction)));break;
		case 'Y':if(selectedModel)selectedModel.Position=subtract(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Direction)));break;
		case 'T':if(selectedModel)selectedModel.Position=add(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Up)));break;
		case 'B':if(selectedModel)selectedModel.Position=subtract(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Up)));break;
		case 'H':if(selectedModel)selectedModel.Position=add(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Left)));break;
		case 'F':if(selectedModel)selectedModel.Position=subtract(selectedModel.Position,matmul(selectedModel.getModelStateMatrix(),scale(k,selectedModel.Left)));break;
	}
	if(Math.abs(world.R)<1e-2){console.log(world);inform('world','r过小');world.R+=Math.random()/100-0.005;}
	if (world.autoRotate) world.theta += Math.PI / 160;
	world.eye[0] = world.at[0] + world.R * Math.cos(world.theta);
	world.eye[2] = world.at[2] + world.R * Math.sin(world.theta);
	world.time=Date.now();
	//彩灯效果
	/*if(Math.random()>0.9){
		lightChange=Math.random();
		if (lightChange<0.3 ) {world.lightAmbient=vec4(1.7,0.7,0.7,1);}
		else if (lightChange<0.6 ){world.lightAmbient=vec4(0.7,1.7,0.7,1);}
		else world.lightAmbient=vec4(0.7,0.7,1.7,1);
	}*/
}
world.getModelViewMatrix = function() {
	return lookAt(this.eye, this.at, this.up);
}
world.getProjectionMatrix = function() {
	minSize = Math.min(canvas.width, canvas.height);
	if (world.ProjectionType == 'ortho') return ortho(-canvas.width / minSize, canvas.width / minSize, -canvas.height / minSize, canvas.height / minSize, -100, 100); //return ortho(left,right,bottom,top,near,far);
	if (world.ProjectionType == 'perspective')return perspective(45,canvas.width/canvas.height,0.001,500);//return perspective(fovy, aspect, near, far);
}
world.getShadowMatrix = function(){
	var h=world.horizon+0.001;
	if(world.ShadowType=='line'){
		var m=mat4(world.lightPosition[1]);
		for(var i=0;i<3;i++){m[i][1]-=world.lightPosition[i];m[i][3]+=world.lightPosition[i]*h;}
		return m
	}
	if(world.ShadowType=='point'){
		var m=mat4(world.lightPosition[1]-h);
		for(var i=0;i<3;i++){m[i][1]-=world.lightPosition[i];m[i][3]+=world.lightPosition[i]*h;}
		m[3][1]=-1;
		m[3][3]+=h;
		return m
	}
}

function inform(title,message,url) {
	if (Notification.permission=="granted") new Notification(title,{body:message,icon:url});
	else if (Notification.permission=="default" && location.href.startsWith("http")) {
		Notification.requestPermission(function (permission) {
			inform(title,message,url);
		});
	}
	else console.log(title+':'+message);
}

function matmul(A, x) {
	B = mat4(vec4(x, 0, 0));
	B = mult(A, transpose(B));
	return transpose(B)[0].slice(0, x.length);
}

class Model {
	constructor(argv) {
		var prototype = {
			materials: {'default':{Ka:vec4(),Kd:vec4(),Ks:vec4(),Ns:20}},
			textures: {},
			vertexs: [],
			vectors: [],
			coordinates: [],
			objects: [],
			Position: [0, 0, 0],
			Rotation: [0, 0, 0],
			Direction: [0,0,1],
			Up: [0,1,0],
			Bound: [1, 1, 1],
			Size: 1,
			dirname: './简单模型/',
			needLoaded: [],
			isParsed: false,
			Selectable: true,
			Printable: true,
			onGround: true,
			hasShadow: true,
			hasMaterial: false,
			hasTexture: false
		};
		for (name in prototype) this[name] = prototype[name];
		for (name in argv) this[name] = argv[name];
		for(var filename of this.needLoaded)Ajax(this,filename);
		this.Id=1;for(var modelname in models)if(models[modelname].Id>=this.Id)this.Id=models[modelname].Id+1;
		this.Left=cross(this.Up,this.Direction);
		//this.Direction=vec4(this.Direction);
		//this.Position=vec4(this.Position);
	}
	getScalingMatrix() {
		var m = mat4(this.Size);
		m[3][3] = 1;
		return m;
	};
	getRotateMatrix() {
		if(this.MR)return this.MR;
		else return mult(rotateX(this.Rotation[0]), mult(rotateY(this.Rotation[1]), rotateZ(this.Rotation[2])));
	}
	getTranslateMatrix() {
		var m = mat4();
		m[0][3] = this.Position[0];
		m[1][3] = this.Position[1];
		m[2][3] = this.Position[2];
		return m;
	};
	getModelStateMatrix() {
		return mult(this.getTranslateMatrix(), mult(this.getRotateMatrix(), this.getScalingMatrix()));
	};
	update() {
		if (this.onGround) this.Position[1] = Math.abs(matmul(this.getRotateMatrix(),this.Bound)[1]) * this.Size + world.horizon;
	};
}

window.onload = function init() {
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	gl.enable(gl.DEPTH_TEST);
	//启用透明
	//gl.enable(gl.BLEND);
	//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(vPosition);
	vNormal = gl.getAttribLocation(program, "vNormal");
	gl.enableVertexAttribArray(vNormal);
	vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.enableVertexAttribArray(vTexCoord);
	ModelStateMatrix = gl.getUniformLocation(program, "ModelStateMatrix");
	ModelViewMatrix = gl.getUniformLocation(program, "ModelViewMatrix");
	ProjectionMatrix = gl.getUniformLocation(program, "ProjectionMatrix");

	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(gl.getUniformLocation(program, "textureId"), 0);

	models['beacon'] = initTetrahedron();
	models['ground'] = initGround();
	models['sun'] = initSun();
	models['sphere'] = initSphere();

	//models['cube']=new Model({Size:0.2,Position:[-0.5,-1,0],needLoaded:['cube.obj'],mtl:''});
	/*models['house'] = new Model({
		Size:100,
		Position: [2,0,0],
		needLoaded: ['light house final.obj', 'light_house_final.mtl']
	});*/
	/*models['obj'] = new Model({
		Size: 0.5,
		Position: [1, 0, 0],
		needLoaded: ['obj.obj','obj.mtl']
	});*/
	/*models['al'] = new Model({
		Size: 0.5,
		needLoaded: ['al.obj','al.mtl'],
		hasMaterial: true
	});*/
	/*models['porsche'] = new Model({
		Position: [-1, -0.5, -20],
		needLoaded: ['porsche.obj','porsche.mtl'],
		hasMaterial: true
	});
	models['porsche'].update=function () {
		this.Position=add(this.Position,matmul(this.getModelStateMatrix(),scale(0.1,this.Direction)));
	}*/

	//带明暗模型
	models['tiger'] = new Model({
		Position: [-1.5,0,0],
		needLoaded: ['tigre_sumatra_sketchfab.obj', 'tigre_sumatra_sketchfab.mtl'],
		hasMaterial: true
	});
	//带贴图模型
	models['loli']=new Model({
		Size:0.5,
		Position: [-0.5, 0, 0],
		Rotation: [90,0,180],
		Up: [0,0,1],
		Direction: [0,1,0],
		dirname: './BunnyLoli/',
		needLoaded: ['BunnyLoli.obj','BunnyLoli.mtl'],
		hasTexture: true
	});
	//带明暗和贴图模型
	models['handphone'] = new Model({
		Size: 0.5,
		Rotation: [-90,0,0],
		Position: [1.5,0,0],
		Up: [0,0,-1],
		Direction: [0,1,0],
		dirname: './handphone/',
		needLoaded: ['ea.obj','ea.mtl'],
		onGround: false,
		hasTexture: true,
		hasMaterial: true
	});
	//如果你电脑性能足够好可以加载试试
	models['gril'] = new Model({
		Size: 0.5,
		Position: [0.5, 0, 0],
		dirname: './CCTV新科娘/',
		needLoaded: ['精简.obj','CCTV新科娘.mtl'],
		hasMaterial: true,
		hasTexture: true
	});
	models['gril'].update=function(){
		delete this.objects["Face006_SkinHi_(Instance)_CCTV新科娘.013"];
	}

	render();
	canvas.onmousedown = onMouseDown;
	canvas.onmousemove = onMouseMove;
	canvas.onmouseup = function(event) {
		canvas.button = undefined;
	}
	canvas.ondblclick = function(event) {
		if (selectedModel == undefined) world.autoRotate = !world.autoRotate;
		else selectedModel.onGround = !selectedModel.onGround;
	}
	canvas.onmousewheel = function(event) {
		if (selectedModel == undefined) world.R += (event.wheelDelta / 1200);
		else {
			selectedModel.Size += Math.sqrt(selectedModel.Size) * (event.wheelDelta / 1200);
			if (selectedModel.Size < 0.1) selectedModel.Size = 0.1;
			if (selectedModel.Size > 10) selectedModel.Size = 10;
		}
	}
	canvas.oncontextmenu = function() {
		return false;
	}
	document.onkeydown = function(event){
		if (document.keyCode == 32 && event.keyCode == 32) {
			inform('世界','实时渲染继续');
			document.keyCode = undefined;
			render();
		} else document.keyCode = event.keyCode;
	}
	document.onkeyup = function(event){if(document.keyCode!=32)document.keyCode=undefined;}
}

function createTexture(model,materialname,filename) {
	var image=new Image();
	image.src=model.dirname+filename;
	image.onload=function(){
	    var texture = gl.createTexture();
	    gl.bindTexture( gl.TEXTURE_2D, texture );
	    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
	    gl.generateMipmap( gl.TEXTURE_2D );
	    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
	    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
	    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
	    model.textures[materialname]=texture;
	}
}

function onMouseDown(event) {
	canvas.button = event.button;
	var selectId=getSelectId(event.clientX,canvas.height-event.clientY);
	selectedModel = undefined;
	for (name in models) {
		if(models[name].Id==selectId){
			selectedModel=models[name];
			console.log('选择物体：'+name);
		}
	}
	if (selectedModel!=undefined) {
		models['beacon'].Printable = true;
		models['beacon'].update();
	}
	else {models['beacon'].Printable = false;}
}

function onMouseMove(event) {
	if (canvas.button == undefined) return;
	minSize = Math.min(canvas.width, canvas.height);
	if (selectedModel == undefined) {
		var mouseMove = vec3(2 * event.movementX / minSize, -2 * event.movementY / minSize);
		if (canvas.button == 0) {
			var d=subtract(world.eye,world.at);d[1]=0;
			world.eye = add(world.eye, mouseMove);
			world.at = add(world.at, mouseMove);
		}
		if (canvas.button == 2) {
			world.theta -= 360*Math.PI * mouseMove[0]/canvas.width;
			world.eye[1] += 0.2 * mouseMove[1];
		}
	} else {
		
		var mouseMove = vec3(-2 * event.movementY / minSize, -2 * event.movementX / minSize, 0);
		var pos=matmul(mult(world.getProjectionMatrix(),mult(world.getModelViewMatrix(),selectedModel.getTranslateMatrix())),vec4(selectedModel.Position));
		pos=add(pos,vec4(2 * event.movementX / canvas.width, -2 * event.movementY / canvas.height,0,0));
		pos=matmul(mult(inverse(selectedModel.getTranslateMatrix()),mult(inverse(world.getModelViewMatrix()),inverse(world.getProjectionMatrix()))),pos);
		if (canvas.button == 0) selectedModel.Position = scale(1/pos[3],pos.slice(0,3));
		if (canvas.button == 2) selectedModel.MR=mult(mult(rotateX(100*mouseMove[0]),rotateY(100*mouseMove[1])),selectedModel.getRotateMatrix());//selectedModel.Rotation = add(selectedModel.Rotation, matmul(selectedModel.m,scale(100, mouseMove)));
	}
}

function Ajax(model,filename) {
	var xmlHttpReq = null;
	var ext = filename.slice(-3);
	if (window.ActiveXObject) {
		xmlHttpReq = new ActiveXObject('Microsoft.XMLHTTP');
	} else if (window.XMLHttpRequest) {
		xmlHttpReq = new XMLHttpRequest();
	}

	xmlHttpReq.open('GET', model.dirname+filename, true);
	xmlHttpReq.onreadystatechange = RequestCallBack;
	xmlHttpReq.send();

	function RequestCallBack() {
		if (xmlHttpReq.readyState === 4) {
			if (xmlHttpReq.status === 200 || xmlHttpReq.status === 0) {
				model[ext] = xmlHttpReq.responseText;
				console.log('载入文件' + filename);
				if(model.needLoaded.length)model.needLoaded.pop(model.needLoaded.indexOf(filename));
				if (!model.needLoaded.length) parse(model);
			}
		}
	}
}

function render() {
	if(keymap[document.keyCode]=='Space'){inform('世界','实时渲染暂停');document.keyCode=undefined;return;}
	if (canvas.width != window.innerWidth || canvas.height != window.innerHeight) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, canvas.width, canvas.height);
		console.log('画布大小重置：' + canvas.width + ',' + canvas.height);
	}
	gl.clearColor(0x66 / 0xff, 0xcc / 0xff, 0xff / 0xff, 1.0);//gl.clearColor(0xdd / 0xff, 0xdd / 0xff, 0xdd / 0xff, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.uniformMatrix4fv(ModelViewMatrix, false, flatten(world.getModelViewMatrix()));
	gl.uniformMatrix4fv(ProjectionMatrix, false, flatten(world.getProjectionMatrix()));
	gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(world.lightAmbient));
	gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(world.lightDiffuse));
	gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(world.lightSpecular));
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(world.lightPosition));
	
	gl.uniform4fv(gl.getUniformLocation(program, "eye"), flatten(vec4(world.eye)));
	for (modelname in models) {
		model=models[modelname];
		if (!model.Printable || !model.isParsed) continue;
		model.update();
		drawObj(model);
	}
	world.update();
	requestAnimationFrame(render);
}

function getSelectId(x,y) {
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.uniform1i(gl.getUniformLocation(program, "drawType1"),0);
	gl.uniform1i(gl.getUniformLocation(program, "drawType2"),0);
	for (modelname in models) {
		model=models[modelname];
		if (!model.Printable || !model.isParsed || !model.Selectable) continue;
		gl.uniformMatrix4fv(ModelStateMatrix, false, flatten(model.getModelStateMatrix()));
		gl.uniform4fv(gl.getUniformLocation(program, "uColor"),vec4(model.Id/255));
		gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, model.pointsNumber);
	}
	pixels = new Uint8Array(4);
	gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	return pixels[0];
}

function parse(model) {
	var name;
	objects = model['objects'];
	vertexs = model['vertexs'];
	vectors = model['vectors'];
	coordinates = model['coordinates'];
	materials = model['materials'];
	for (line of model['mtl'].split('\n')) {
		if (line.startsWith('newmtl ')) {
			name = line.split(' ')[1];
			materials[name] = {};
		}
		if (line.startsWith('Ka ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			materials[name]['Ka'] = vec4(temp);
		}
		if (line.startsWith('Kd ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			materials[name]['Kd'] = vec4(temp);
		}
		if (line.startsWith('Ks ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			materials[name]['Ks'] = vec4(temp);
		}
		if (line.startsWith('Ns ')) {
			materials[name]['Ns'] = parseFloat(line.split(' ')[1]);
		}
		if (line.startsWith('d ')) {
			materials[name]['d'] = parseFloat(line.split(' ')[1]);
		}
		if (line.startsWith('illum ')) {
			materials[name]['illum'] = parseInt(line.split(' ')[1]);
		}
		if (line.startsWith('map_Kd ')) {
			createTexture(model,name,line.substr(7));
		}
	}
	for (line of model['obj'].split('\n')) {
		if (line.startsWith('v ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			vertexs.push(temp);
		}
		if (line.startsWith('vn ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			vectors.push(vec4(temp));
		}
		if (line.startsWith('vt ')) {
			temp = [];
			for (num of line.split(' ').slice(1)) temp.push(parseFloat(num));
			coordinates.push(vec2(temp));
		}
		if (line.startsWith('o ') || line.startsWith('g ') || line.startsWith('group ')) {
			name = line.split(' ')[1];
			if (!(name in objects)) objects[name] = {
				's': 0,
				'f': []
			};
		}
		if (line.startsWith('s ')) {
			if (line.split(' ')[1] != 'off') objects[name]['s'] = parseInt(line.split(' ')[1]);
		}
		if (line.startsWith('usemtl ')) {
			if(objects[name]['material']!=undefined && objects[name]['material'] != line.split(' ')[1]){
				name=name+'_new';
				objects[name] = {'s':0,'f':[]};
			}
			objects[name]['material'] = line.split(' ')[1];
		}
		if (line.startsWith('f ')) {
			temp = [];
			for (num of line.split(' ').slice(1))temp.push([Number(num.split('/')[0]),Number(num.split('/')[1]),Number(num.split('/')[2])]);
			objects[name]['f'].push(temp);
		}
	}
	maxPos = [-Math.tan(Math.PI / 2), -Math.tan(Math.PI / 2), -Math.tan(Math.PI / 2)];
	minPos = [Math.tan(Math.PI / 2), Math.tan(Math.PI / 2), Math.tan(Math.PI / 2)];
	for (x of vertexs) {
		for (var i = 0; i < 3; i++) {
			if (x[i] < minPos[i]) minPos[i] = x[i];
			if (x[i] > maxPos[i]) maxPos[i] = x[i];
		}
	}
	maxBound = [(maxPos[0] - minPos[0]) / 2, (maxPos[1] - minPos[1]) / 2, (maxPos[2] - minPos[2]) / 2];
	maxSize = Math.max(maxBound[0], maxBound[1], maxBound[2]);
	midPos = [(maxPos[0] + minPos[0]) / 2, (maxPos[1] + minPos[1]) / 2, (maxPos[2] + minPos[2]) / 2];
	for (i in vertexs) {
		vertexs[i] = vec4((vertexs[i][0] - midPos[0]) / maxSize, (vertexs[i][1] - midPos[1]) / maxSize, (vertexs[i][2] - midPos[2]) / maxSize);
	}
	model.Bound = [maxBound[0] / maxSize, maxBound[1] / maxSize, maxBound[2] / maxSize];
	console.log('渲染模型' + model);
	points = [];
	normals = [];
	texcoords = [];
	model.pointsNumber=0;
	for (name in model.objects) {
		console.log('渲染' + name);
		part = objects[name];
		if(part.material==undefined||!(part.material in model.materials))part.material='default';
		part.Ka = model.materials[part.material]['Ka']?model.materials[part.material]['Ka']:vec4(0, 0, 0);
		part.Kd = model.materials[part.material]['Kd']?model.materials[part.material]['Kd']:vec4(0, 0, 0);
		part.Ks = model.materials[part.material]['Ks']?model.materials[part.material]['Ks']:vec4(0, 0, 0);
		part.Ns = model.materials[part.material]['Ns']?model.materials[part.material]['Ns']:30;
		//else color=[Math.random(),Math.random(),Math.random()],console.log(name);
		for (indexs of part['f']) {
			for (var i = 0; i < indexs.length; i++) {
				for(var j=0;j<3;j++){
					if (indexs[i][j] < 0) indexs[i][j] += vertexs.length;
					else indexs[i][j] -= 1;
				}
			}
			for (var i = 2; i < indexs.length; i++) {
				points = points.concat([vertexs[indexs[0][0]], vertexs[indexs[i - 1][0]], vertexs[indexs[i][0]]]);
				if(model.hasTexture)texcoords = texcoords.concat([coordinates[indexs[0][1]], coordinates[indexs[i - 1][1]], coordinates[indexs[i][1]]]);
				if(model.hasMaterial)normals = normals.concat([vectors[indexs[0][2]], vectors[indexs[i - 1][2]], vectors[indexs[i][2]]]);
			}
			if(!model.hasMaterial)normals = normals.concat(Array((indexs.length - 2) * 3).fill(part.Kd));
		}
		part.offset=model.pointsNumber;
		part.pointsNumber=points.length-model.pointsNumber;
		model.pointsNumber=points.length;
	}
	model.pointBuffer = gl.createBuffer();
	model.normalBuffer = gl.createBuffer();
	model.pointsNumber = points.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
	if(model.hasTexture){
		model.texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, model.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(texcoords), gl.STATIC_DRAW);
	}
	model.isParsed = true;
}

function isEmptyObject(obj){
    for (var n in obj) {
        return false
    }
    return true;
} 

function drawObj(model) {
	var drawType=1;
	if(model.hasMaterial)drawType|=(1<<1);
	if(model.hasTexture)drawType|=(1<<2);
	gl.uniform1i(gl.getUniformLocation(program, "drawType1"),drawType);
	gl.uniform1i(gl.getUniformLocation(program, "drawType2"),drawType);
	gl.uniformMatrix4fv(ModelStateMatrix, false, flatten(model.getModelStateMatrix()));
	if(model.hasTexture)gl.enableVertexAttribArray(vTexCoord);
	gl.enableVertexAttribArray(vNormal);
	if(!isEmptyObject(model.objects)){
		for(name in model.objects)
		{
			var part=model.objects[name];
			if(model.hasMaterial){
				gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"),flatten(part.Ka));
				gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"),flatten(part.Kd));
				gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"),flatten(part.Ks));
				gl.uniform1f(gl.getUniformLocation(program, "shininess"),part.Ns);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
			gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, part.offset*4*4);
			gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
			gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, part.offset*4*4);
			if(model.hasTexture){
				gl.bindTexture(gl.TEXTURE_2D, model.textures[part.material]);
				gl.bindBuffer(gl.ARRAY_BUFFER, model.texCoordBuffer);
				gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0,  part.offset*4*2);
			}
			gl.drawArrays(gl.TRIANGLES, 0, part.pointsNumber);
		}
	}
	else{
		gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
		gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, model.pointsNumber);
	}
	gl.disableVertexAttribArray(vNormal);
	gl.disableVertexAttribArray(vTexCoord);
	if(model.hasShadow){
		gl.uniform1i(gl.getUniformLocation(program, "drawType1"),0);
		gl.uniform1i(gl.getUniformLocation(program, "drawType2"),0);
		gl.uniformMatrix4fv(ModelStateMatrix, false, flatten(mult(world.getShadowMatrix(),model.getModelStateMatrix())));
		gl.uniform4fv(gl.getUniformLocation(program, "uColor"),vec4());
		gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, model.pointsNumber);
	}
}

function initGround() {
	var model = new Model({
		Size: 0.1,
		Position: [0, -0.5, 0],
		onGround: false,
		isParsed: true,
		Selectable: false,
		hasTexture: true,
		hasShadow: false
	});
	var R = 200; //Math.tan(Math.PI/2);
	var N = 20;
	//var points = [];
	var points = [vec4(-R,0,-R),vec4(-R,0,R),vec4(R,0,R),vec4(-R,0,-R),vec4(R,0,-R),vec4(R,0,R)];
	/*for (var i = 0; i < N; i++) {
		points.push(vec4(0, 0, 0));
		points.push(vec4(R * Math.cos(2 * i * Math.PI / N), 0, R * Math.sin(2 * i * Math.PI / N)));
		points.push(vec4(R * Math.cos(2 * (i + 1) * Math.PI / N), 0, R * Math.sin(2 * (i + 1) * Math.PI / N)));
	}*/
	var texcoords = [];
	for (var i = 0; i < points.length; i++) {
		texcoords.push(vec2(points[i][0]/10,points[i][2]/10));
	}
	color = vec4(0x66 / 0xff, 0xcc / 0xff, 0xff / 0xff);
	//color=[0,0,0];
	var colors = Array(points.length).fill(color);
	model.pointBuffer = gl.createBuffer();
	model.normalBuffer = gl.createBuffer();
	model.pointsNumber = points.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	model.objects['ground']={material:'default',offset:0,pointsNumber:model.pointsNumber};
	model.materials['default'].texture='default';
	createTexture(model,'default','../1024草.jpg');
	model.texCoordBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, model.texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texcoords), gl.STATIC_DRAW);
	return model;
}

function initSphere() {
	var N = 10;
	var points = [];
	var colors = [];
	var model = new Model({
		Size: 0.075,
		Position: [0, -0.2, 5],
		onGround: false,
		isParsed: true
	});
	for (var j = -N; j <= N; j++) {
		var phi = j * Math.PI / 2 / N;
		var M = Math.ceil(Math.cos(phi) * 10) + 10;
		for (var i = -M; i <= M; i++) {
			var theta = i * Math.PI / M;
			A = vec4(Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi));
			B = vec4(Math.cos(theta) * Math.cos(phi + Math.PI / 2 / N), Math.sin(theta) * Math.cos(phi + Math.PI / 2 / N), Math.sin(phi + Math.PI / 2 / N));
			C = vec4(Math.cos(theta + Math.PI / M) * Math.cos(phi), Math.sin(theta + Math.PI / M) * Math.cos(phi), Math.sin(phi));
			D = vec4(Math.cos(theta + Math.PI / M) * Math.cos(phi + Math.PI / 2 / N), Math.sin(theta + Math.PI / M) * Math.cos(phi + Math.PI / 2 / N), Math.sin(phi + Math.PI / 2 / N));
			points = points.concat([A, B, C, B, C, D]);
			if (j > 25 / 30 * N) color = vec4(1, 1, 1);
			else if (j > 23 / 30 * N) color = vec4(0.2, 0, 0);
			else if (i >= 0) color = vec4(0.8, 0, 0);
			else color = vec4(0.9, 1, 0.9);
			colors = colors.concat(Array(6).fill(color));
		}
	}
	model.pointBuffer = gl.createBuffer();
	model.normalBuffer = gl.createBuffer();
	model.pointsNumber = points.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	/*gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	model.objects['default']=model;
	model.offset=0;
	for(name in model.materials['default'])model[name]=model.materials['default'][name];
	model.hasMaterial=true;*/
	return model;
}

function initSun() {
	var N = 10;
	var points = [];
	var colors = [];
	var model = new Model({
		Size: 0.1,
		Position: vec3(world.lightPosition),
		Rotation: [90,0,0],
		onGround: false,
		isParsed: true,
		hasShadow: false
	});
	for (var j = -N; j <= N; j++) {
		var phi = j * Math.PI / 2 / N;
		var M = Math.ceil(Math.cos(phi) * 10) + 10;
		for (var i = -M; i <= M; i++) {
			var theta = i * Math.PI / M;
			A = vec4(Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi));
			B = vec4(Math.cos(theta) * Math.cos(phi + Math.PI / 2 / N), Math.sin(theta) * Math.cos(phi + Math.PI / 2 / N), Math.sin(phi + Math.PI / 2 / N));
			C = vec4(Math.cos(theta + Math.PI / M) * Math.cos(phi), Math.sin(theta + Math.PI / M) * Math.cos(phi), Math.sin(phi));
			D = vec4(Math.cos(theta + Math.PI / M) * Math.cos(phi + Math.PI / 2 / N), Math.sin(theta + Math.PI / M) * Math.cos(phi + Math.PI / 2 / N), Math.sin(phi + Math.PI / 2 / N));
			points = points.concat([A, B, C, B, C, D]);
		}
	}
	model.pointBuffer = gl.createBuffer();
	model.normalBuffer1 = gl.createBuffer();
	model.normalBuffer2 = gl.createBuffer();
	model.normalBuffer3 = gl.createBuffer();
	model.normalBuffer=model.normalBuffer1;
	model.pointsNumber = points.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer1);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Array(model.pointsNumber).fill(vec4(1,0,0))), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer2);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Array(model.pointsNumber).fill(vec4(0,0,1))), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer3);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Array(model.pointsNumber).fill(vec4(1,1,0))), gl.STATIC_DRAW);
	model.getRotateMatrix=function() {
		return mult(rotateX(this.Rotation[0]), mult(rotateY(this.Rotation[1]), rotateZ(this.Rotation[2])));
	}
	model.update=function () {
		model.Rotation[1] += (Date.now()-world.time)/12;
		if(world.ShadeType)world.lightPosition=vec4(model.Position,world.ShadeType=='point'?1:0);
		else world.lightPosition=vec4(model.Position,world.ShadowType=='point'?1:0);
		var pos1=vec3(world.lightPosition);
		var pos2=add(pos1,scale(4,matmul(model.getModelStateMatrix(),model.Direction)));
		var theta2=mult(model.Rotation,vec3(1,0.5,1));
		model.Size=0.05;
		model.Position=pos2;
		model.normalBuffer=model.normalBuffer2;
		drawObj(model);
		var pos3=add(pos2,scale(0.1,matmul(mult(rotateX(model.Rotation[0]), mult(rotateY(model.Rotation[1]*2), rotateZ(model.Rotation[2]))),model.Direction)));
		model.Size=0.03;
		model.Position=pos3;
		model.normalBuffer=model.normalBuffer3;
		drawObj(model);
		model.Size=0.1;
		model.Position=pos1;
		model.normalBuffer=model.normalBuffer1;
	}
	return model;
}

//Sinki
function initTetrahedron() {
	var model = new Model({
		Size: 0.1,
		onGround: false,
		isParsed: true,
		Selectable: false,
		Printable: false,
		hasShadow: false
	});
	points = [];
	colors = [];
	var basevertices = [
		vec4(0.0000, -1.0000, 0.0000),
		vec4(0.9428, 0.3333, 0.0000),
		vec4(-0.4714, 0.3333, -0.8165),
		vec4(-0.4714, 0.3333, 0.8165)
	];

	var basecolors_tetrahedron = [
		vec4(1.0, 0.0, 0.0, 1.0),
		vec4(0.0, 1.0, 0.0, 1.0),
		vec4(0.0, 0.0, 1.0, 1.0),
		vec4(0.5, 0.5, 0.5, 1.0)
	];

	function triangle(a, b, c, color) {
		colors.push(basecolors_tetrahedron[color]);
		points.push(a);
		colors.push(basecolors_tetrahedron[color]);
		points.push(b);
		colors.push(basecolors_tetrahedron[color]);
		points.push(c);
	}

	function tetra(a, b, c, d) {
		triangle(a, c, b, 0);
		triangle(a, c, d, 1);
		triangle(a, b, d, 2);
		triangle(b, c, d, 3);
	}
	tetra(basevertices[0], basevertices[1], basevertices[2], basevertices[3]);
	model.pointBuffer = gl.createBuffer();
	model.normalBuffer = gl.createBuffer();
	model.pointsNumber = points.length;
	gl.bindBuffer(gl.ARRAY_BUFFER, model.pointBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	model.update = function() {
		model.Position = add(selectedModel.Position, [0, 0.2 +  Math.abs(matmul(mult(selectedModel.getScalingMatrix(),selectedModel.getRotateMatrix()),selectedModel.Bound)[1]), 0]);
		model.Rotation[1] += (Date.now()-world.time)/6;
		//console.log(model.rotateMatrix);
	}
	return model;
}

//数据来源
//映射关系
//建议
//flatten函数有问题，矩阵只有列数相同才能正常解析。

//turnDirection(){this.Direction=this+}
//there is no texture bound to the unit 0:这个是贴图没加载完毕的警告，不用管