/**
* License and Terms of Use
*
* Copyright (c) 2011 SignpostMarv
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
(function(window, undefined){
	var
		Array       = window['Array'],
		EventTarget = window['EventTarget'],
		mapapi      = window['mapapi'],
		gridPoint   = mapapi['gridPoint'],
		bounds      = mapapi['bounds']
	;
	if(mapapi == undefined){
		throw 'mapapi.js is not loaded.';
	}else if(EventTarget == undefined){
		throw 'EventTarget is not loaded';
	}

	function extend(a,b){
		a.prototype = new b;
		a.prototype['constructor'] = a;
	}

	function shape(options){
		EventTarget['call'](this);
		this['opts'] = {};
		for(var i in this['defaultOpts']){
			this['opts'][i] = this['defaultOpts'][i];
		}
		if(options != undefined){
			this['options'](options);
		}
	}

	extend(shape, EventTarget);

	shape.prototype['defaultOpts'] = {'fillStyle':'rgba(255,255,255,0.5)', 'strokeStyle':'rgb(255,255,255)', 'lineWidth':0};

	shape.prototype['options'] = function(options){
		options = options || {};
		for(var i in options){
			this['opts'] = options[i];
		}
	}

	shape.prototype['withinShape'] = function(pos){
		if(pos instanceof gridPoint){
			return true;
		}
		return false;
	}

	shape.prototype['coords'] = function(value){
		if(value != undefined){
			this['options']({'coords':value});
		}
		var
			coords = this['opts']['coords']
		;
		return coords != undefined ? coords : [];
	}

	shape.prototype['clickable'] = function(value){
		if(value != undefined){
			this['options']({'clickable':!!value});
		}
		var
			clickable = this['opts']['clickable'];
		;
		return clickable != undefined ? clickable : false;
	}

	shape.prototype['strokeStyle'] = function(value){
		if(typeof value == 'string'){
			this['options']({'strokeStyle':value});
		}
		return this['opts']['strokeStyle'];
	}

	shape.prototype['lineWidth'] = function(value){
		if(typeof value == 'number'){
			this['options']({'lineWidth':Math.max(0,value)});
		}
		return Math.max(0, this['opts']['lineWidth']);
	}

	shape.prototype['intersects'] = function(value){
		if(value instanceof bounds && this['bounds'] instanceof bounds){
			return this['bounds']['intersects'](value);
		}
		return false;
	}

	mapapi['shape'] = shape;

	function poly(options){
		shape['call'](this, options);
	}

	extend(poly, shape);

	poly.prototype['options'] = function(options){
		var
			options     = options || {},
			coords      = options['coords'],
			fillStyle   = options['fillStyle'],
			strokeStyle = options['strokeStyle'],
			lineWidth   = options['lineWidth']
		;
		if(options['coords'] != undefined){
			if(coords instanceof Array){
				for(var i=0;i<coords['length'];++i){
					coords[i] = gridPoint['fuzzy'](coords[i]);
				}
				var
					swx = coords[0]['x'],
					swy = coords[0]['y'],
					nex = coords[0]['x'],
					ney = coords[0]['y']
				;
				for(var i=1;i<coords['length'];++i){
					swx = (coords[i]['x'] < swx)  ? coords[i]['x'] : swx;
					swy = (coords[i]['y'] < swy)  ? coords[i]['y'] : swy;
					nex = (coords[i]['x'] > nex)  ? coords[i]['x'] : nex;
					ney = (coords[i]['y'] > ney)  ? coords[i]['y'] : ney;
				}
				this['bounds'] = new bounds(new gridPoint(swx, swy), new gridPoint(nex, ney));
				this['opts']['coords'] = coords;
				this['fire']('changedcoords');
			}else{
				throw 'coords must be array';
			}
		}
		if(typeof fillStyle == 'string'){
			var diff = this['opts']['fillStyle'] != fillStyle;
			this['opts']['fillStyle'] = fillStyle;
			if(diff){
				this['fire']('changedfillstyle');
			}
		}
		if(typeof strokeStyle == 'string'){
			var diff = this['opts']['strokeStyle'] != strokeStyle;
			this['opts']['strokeStyle'] = strokeStyle;
			if(diff){
				this['fire']('changedstrokestyle');
			}
		}
		if(typeof lineWidth == 'number'){
			var diff = this['opts']['lineWidth'] != Math.max(0,lineWidth);
			this['opts']['lineWidth'] = Math.max(0,lineWidth);
			if(diff){
				this['fire']('changedlinewidth');
			}
		}
	}

	poly.prototype['fillStyle'] = function(value){
		if(value != undefined){
			this['options']({'fillStyle':value});
		}
		return this['opts']['fillStyle'];
	}

	shape['polygon'] = poly;

	function rectangle(options){
		poly['call'](this, options);
	}

	extend(rectangle, poly);

	rectangle.prototype['options'] = function(options){
		var
			options = options || {},
			coords = options['coords']
		;
		if(coords != undefined){
			if(coords instanceof Array){
				if(coords['length'] == 2){
					for(var i=0;i<coords['length'];++i){
						coords[i] = gridPoint['fuzzy'](coords[i]);
					}
					var
						sw = coords[0],
						ne = coords[1],
						foo,bar
					;
					if(ne['y'] > sw['y']){
						foo = new gridPoint(ne['x'], sw['y']);
						bar = new gridPoint(sw['x'], ne['y']);
						ne = foo;
						sw = bar;
					}
					if(sw['x'] > ne['x']){
						foo = new gridPoint(ne['x'], sw['y']);
						bar = new gridPoint(sw['x'], ne['y']);
						sw = foo;
						ne = bar;
					}
					options['coords'] = [sw, ne];
				}else{
					throw 'When supplying mapapi.shape.rectangle::options with an Array for the coordinates, there should only be two entries';
				}
			}else{
				throw 'something other than array was given to mapapi.shape.rectangle::options';
			}
		}
		poly.prototype['options']['call'](this, options);
	}

	rectangle.prototype['withinShape'] = function(value){
		if(value == undefined){
			throw 'Must specify an instance of mapapi.gridPoint';
		}else if(!(this['bounds'] instanceof bounds)){
			throw 'Coordinates not set';
		}
		value = gridPoint['fuzzy'](value);
		return this['bounds']['isWithin'](value);
	}

	shape['rectangle'] = rectangle;

	function square(options){
		rectangle['call'](this, options);
	}

	extend(square, rectangle);

	square.prototype['options'] = function(options){
		options = options || {};
		var
			coords = options['coords']
		;
		if(coords instanceof Array && coords['length'] <= 2){
			var
				sw = coords[0],
				ne = coords[1]
			;
			if(Math.abs(ne['x'] - sw['x']) != Math.abs(ne['y'] - sw['y'])){
				throw 'coordinates should form a square';
			}
		}
		rectangle.prototype['options']['call'](this, options);
	}

	shape['square'] = square;

	function line(options){
		shape['call'](this, options);
	}

	extend(line, shape);

	line.prototype['defaultOpts'] = {'strokeStyle':'rgb(255,255,255)', 'lineWidth':1};

	line.prototype['options'] = function(options){
		var
			options     = options || {},
			coords      = options['coords'],
			strokeStyle = options['strokeStyle'],
			lineWidth   = options['lineWidth']
		;
		if(options['coords'] != undefined){
			if(coords instanceof Array){
				if(coords['length'] >= 2){
					for(var i=0;i<coords['length'];++i){
						coords[i] = gridPoint['fuzzy'](coords[i]);
					}
					this['opts']['coords'] = coords;
					this['fire']('changedcoords');
				}else{
					throw 'mapapi.shape.line requires two or more coordinates';
				}
			}else{
				throw 'mapapi.shape.line requires coordinates be passed as an array';
			}
		}
		if(typeof strokeStyle == 'string'){
			var diff = this['opts']['strokeStyle'] != strokeStyle;
			this['opts']['strokeStyle'] = strokeStyle;
			if(diff){
				this['fire']('changedstrokestyle');
			}
		}
		if(typeof lineWidth == 'number'){
			lineWidth = Math.max(0,lineWidth);
			var diff = this['opts']['lineWidth'] != lineWidth;
			this['opts']['lineWidth'] = lineWidth;
			if(diff){
				this['fire']('changedlinewidth');
			}
		}
	}

	line.prototype['intersects'] = function(value){
		if(value instanceof bounds){
			var
				coords = this['coords']()
			;
			for(var i=0;i<coords['length'];++i){
				if(value['isWithin'](coords[i])){
					return true;
				}
			}
		}
		return false;
	}

	shape['line'] = line;

	function circle(options){
		shape['call'](this, options);
	}

	extend(circle, shape);

	circle.prototype['options'] = function(options){
		var
			opts        = this['opts'],
			options     = options || {},
			pos         = options['pos'],
			radius      = options['radius'],
			strokeStyle = options['strokeStyle'],
			lineWidth   = options['lineWidth'],
			diffPos=false,diffRadius=false,diff
		;
		if(pos != undefined){
			pos = gridPoint['fuzzy'](pos);
			diffPos = !pos['equals'](opts['pos']);
			opts['pos'] = pos;
		}
		if(radius != undefined){
			if(typeof radius != 'number'){
				throw 'radius should be specified as a number';
			}else if(radius <= 0){
				throw 'radius should be greater than zero';
			}
			diffRadius = radius != opts['radius'];
			opts['radius'] = radius;
		}
		if(diffPos || diffRadius){
			this['fire']('changedcoords');
		}
		if(typeof fillStyle == 'string'){
			var diff = this['opts']['fillStyle'] != fillStyle;
			this['opts']['fillStyle'] = fillStyle;
			if(diff){
				this['fire']('changedfillstyle');
			}
		}
		if(typeof strokeStyle == 'string'){
			var diff = this['opts']['strokeStyle'] != strokeStyle;
			this['opts']['strokeStyle'] = strokeStyle;
			if(diff){
				this['fire']('changedstrokestyle');
			}
		}
		if(typeof lineWidth == 'number'){
			var diff = this['opts']['lineWidth'] != Math.max(0,lineWidth);
			this['opts']['lineWidth'] = Math.max(0,lineWidth);
			if(diff){
				this['fire']('changedlinewidth');
			}
		}
	}

	circle.prototype['pos'] = function(value){
		if(value != undefined){
			this['options']({'pos':value});
		}
		return this['opts']['pos'];
	}

	circle.prototype['radius'] = function(value){
		if(value != undefined){
			this['options']({'radius':value});
		}
		return this['opts']['radius'];
	}

	circle.prototype['fillStyle'] = function(value){
		if(value != undefined){
			this['options']({'fillStyle':value});
		}
		return this['opts']['fillStyle'];
	}

	circle.prototype['withinShape'] = function(pos){
		pos = gridPoint['fuzzy'](pos);
		return (this['pos']() instanceof gridPoint && typeof this['radius']() == 'number') && (this['pos']()['distance'](pos) <= this['radius']());
	}

	circle.prototype['intersects'] = function(value){
		if(value instanceof bounds && this['pos']() instanceof gridPoint){
			if((value instanceof bounds && this['pos']() instanceof gridPoint) && value['isWithin'](this['pos']())){
				return true;
			}else if(typeof this['radius']() == 'number'){
				var
					sw = value['sw'],
					ne = value['ne'],
					distanceTests = [sw,ne,{'x':sw['x'], 'y':ne['y']}, {'x':ne['x'], 'y':sw['y']}]
				;
				for(var i=0;i<distanceTests.length;++i){
					if(this['withinShape'](distanceTests[i])){
						return true;
					}
				}
			}
		}
		return false;
	}

	shape['circle'] = circle;
})(window);