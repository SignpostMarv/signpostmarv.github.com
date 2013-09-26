(function(window, undefined){
	'use strict';
	var
		document = window['document'],
		Object   = window['Object'],
		Math     = window['Math'],
		PI       = Math['PI'],
		TAU      = PI + PI,
		isNaN = window['isNaN'],
		isFinite = window['isFinite'],
		hasOwn = function(a,b){
			return a ? a['hasOwnProperty'](b) : false;
		},
		eitherHas = function(a,b,c){
			return (a && b)
				? (hasOwn(a,c)
					? a[c]
					: hasOwn(b,c)
						? b[c]
						: false)
				: false;
		},
		extend = function(a,b){
			a.prototype = new b;
			a.prototype['constructor'] = a;
		},
		range    = function(min, max, val){
			return Math['max'](min,
				Math['min'](max,
					((isNaN(val) || !isFinite(val)) ? min : val)
				)
			);
		},
		rangeHasOwn = function(objA, objB, prop, min, max, defaultVal){
			defaultVal = defaultVal != undefined ? defaultVal : min;
			return range(
				min,
				max,
				hasOwn(objA, prop)
					? parseFloat(objA[prop])
					: (
						hasOwn(objB, prop)
							? parseFloat(objB[prop])
							: defaultVal
					)
			);
		}
	;

	function mapgen(options){
		this.opts = {};
		this.cache = {};
		this['options'](options);
	}
	mapgen.prototype['options'] = function(newOpts){
		var
			opts = this.opts
		;
		opts['renderWidth']  = rangeHasOwn(newOpts, opts,
			'renderWidth'  , 100|0 , 65536|0 , 400|0 )|0;
		opts['renderHeight'] = rangeHasOwn(newOpts, opts,
			'renderHeight' , 100|0 , 65536|0 , 300|0 )|0;
		opts['roadWidth']    = rangeHasOwn(newOpts, opts,
			'roadWidth'    , 4|0   , 128|0   , 16|0  )|0;
		opts['polyWidth']    = rangeHasOwn(newOpts, opts,
			'polyWidth'    , 0x10|0, 0x1000|0, 0x40|0)|0;
		opts['polyWidthMul'] = rangeHasOwn(newOpts, opts,
			'polyWidthMul' , 1|0   , 32|0    , 4|0   )|0;
		opts['polyHeight']    = rangeHasOwn(newOpts, opts,
			'polyWidth'    , 0x10|0, 0x1000|0, 0x80|0)|0;
		opts['polyHeightMul'] = rangeHasOwn(newOpts, opts,
			'polyHeightMul', 1|0   , 32|0    , 4|0   )|0;
		[
			'radius',
			'lineWidth',
		].forEach(function(e){
			if(hasOwn(newOpts, e)){
				opts[e] = newOpts[e]
			}
		});
	}
	mapgen.prototype['draw'] = mapgen.prototype.draw = function(force){
		var
			opts   = this.opts,
			render = document.createElement('canvas'),
			randomCache = {}
		;
		render.width = opts['renderWidth'];
		render.height = opts['renderHeight'];
		function randomDraw(){
			var
				width = opts['polyWidth' ] * (Math.floor(Math.random() * opts['polyWidthMul' ]) + 1|0),
				height = opts['polyHeight'] * (Math.floor(Math.random() * opts['polyHeightMul']) + 1|0)
			;
			if(!hasOwn(randomCache, width)){
				randomCache[width] = {};
			}
			if(!hasOwn(randomCache[width][height])){
				randomCache[width][height] = new mapgen.roundedCornerPoly({
					radius    : opts['radius'],
					lineWidth : opts['lineWidth'],
					width     : width,
					height    : height
				});
			}
			return randomCache[width][height].draw();
		}
		var
			binFitLength = (render.width ) * render.height,
			binFit = (function(){
				var
					a = []
				;
				for(var i=0;i<binFitLength;++i){
					a.push(0);
				}
				return a;
			})(),
			binFitCheck = function(x,y,val){
				x = x || 0;
				y = y || 0;
				if(x >= render.width || y >= render.width){
					return false;
				}
				var
					pos = (y * render.width) + x,
					bit = 1 << (x % 8)
				;
				if(val != undefined){
					binFit[pos] = !!val;
					/*
					if(val){
						binFit[pos] |= bit;
					}else{
						binFit[pos] &= ~bit;
					}
					*/
				}
				return !!(binFit[pos]);
			},
			binFitRect = function(x1, y1, x2, y2, val){
				val = !!val;
				for(var x=x1;x<=x2;++x){
					for(var y=y1;y<=y2;++y){
						binFitCheck(x, y, val);
					}
				}
			},
			binFitRectCheck = function(x1, y1, x2, y2){
				for(var x=x1;x<=x2;++x){
					for(var y=y1;y<=y2;++y){
						if(binFitCheck(x, y)){
							return true;
						}
					}
				}
				return false;
			},
			ctx = render.getContext('2d'),
			draw,
			found,
			i = 0
		;
		function findAvailable(dim){
			for(var x=0;x<render.width;x+=opts['roadWidth']){
				for(var y=0;y<render.height;y+=opts['roadWidth']){
					if(!binFitRectCheck(x, y, x + dim.width, y + dim.width)){
						return [x,y];
					}
				}
			}
			return false;
		}
		draw = randomDraw();
		while((found = findAvailable(draw))){
			var
				x = found[0],
				y = found[1]
			;
			if(x == 0){
				x = draw.width / -2;
			}
			if(y == 0){
				y = draw.height / -2;
			}
			ctx.drawImage(draw, x, y);
			binFitRect(x, y, x + draw.width, y + draw.height, true);
			draw = randomDraw();
		}

		var
			debug = document.querySelector('canvas#debug'),
			debug = debug ? debug : document.createElement('canvas'),
			debugctx
		;
		debug.id = 'debug';
		debug.width = render.width;
		debug.height = render.height;
		debugctx = debug.getContext('2d');
		for(var x=0;x<debug.width;++x){
			for(var y=0;y<debug.height;++y){
				debugctx.fillStyle = binFitCheck(x,y) ? '#000' : '#fff';
				debugctx.fillRect(x,y,1,1);
			}
		}
		document.body.appendChild(debug);

		return render;
	}

	function roundedCornerPoly(opts){
		this.opts = {};
		this.cache = {};
		this['options'](opts);
	}

	roundedCornerPoly.prototype['options'] = function(newOpts){
		var
			opts      = this.opts,
			width     = rangeHasOwn(newOpts, opts,
				'width'    , 0x10|0   , 0x10000|0, 0x80|0)|0,
			height    = rangeHasOwn(newOpts, opts,
				'height'   , 0x10|0   , 0x10000|0, 0x80|0)|0,
			radius    = rangeHasOwn(newOpts, opts,
				'radius'   , 0|0   , 0x100|0  , 0|0   )|0,
			lineWidth = rangeHasOwn(newOpts, opts,
				'lineWidth', 2|0   , 0x100|0, 2|0     )|0,
			lineR     = rangeHasOwn(newOpts, opts,
				'lineR'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineG     = rangeHasOwn(newOpts, opts,
				'lineG'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineB     = rangeHasOwn(newOpts, opts,
				'lineB'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineA     = +rangeHasOwn(newOpts, opts,
				'lineA'    , +0    , +1    , +1),
			fillR     = rangeHasOwn(newOpts, opts,
				'fillR'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillG     = rangeHasOwn(newOpts, opts,
				'fillG'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillB     = rangeHasOwn(newOpts, opts,
				'fillB'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillA     = +rangeHasOwn(newOpts, opts,
				'fillA'    , +0    , +1    , +1),
			lineColor = 'rgba('
				+ lineR.toString(10|0) + ','
				+ lineG.toString(10|0) + ','
				+ lineB.toString(10|0) + ','
				+ lineA.toString(10|0) + ')',
			fillColor = 'rgba('
				+ fillR.toString(10|0) + ','
				+ fillG.toString(10|0) + ','
				+ fillB.toString(10|0) + ','
				+ fillA.toString(10|0) + ')'
		;
		opts['width']     = width    ;
		opts['height']    = height   ;
		opts['radius']    = radius   ;
		opts['lineWidth'] = lineWidth;
		opts['lineR']     = lineR    ;
		opts['lineG']     = lineG    ;
		opts['lineB']     = lineB    ;
		opts['lineA']     = lineA    ;
		this.cache.lineColor = lineColor;
		this.cache.fillColor = fillColor;
		this.cache.drawWidth = lineWidth + width;
		this.cache.drawHeight = lineWidth + height;
	}

	roundedCornerPoly.prototype['draw'] =
	roundedCornerPoly.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts      = this.opts,
				cache     = this.cache,
				width     = opts['width'],
				height    = opts['height'],
				radius    = Math['min'](Math['min'](width / (2|0), height / (2|0)), opts['radius']),
				lineWidth = Math['min'](radius, opts['lineWidth']),
				newDraw   = (cache.draw
					&& cache.draw.width != cache.drawWidth
					&& cache.draw.height != cache.drawHeight
				),
				render    = (newDraw
					? cache.draw
					: document.createElement('canvas')
				),
				ctx
			;
			render.width = cache.drawWidth;
			render.height = cache.drawHeight;
			ctx = render.getContext('2d');
			ctx.clearRect(0|0, 0|0, cache.drawWidth, cache.drawHeight);
			ctx.save();
			ctx.beginPath();
			ctx.arc(
				radius + (lineWidth / +2),
				radius + (lineWidth / +2),
				radius,
				PI,
				PI / -2
			);
			ctx.arc(
				(lineWidth / 2) + width - radius,
				radius + (lineWidth / +2),
				radius,
				PI / -2,
				0
			);
			ctx.arc(
				(lineWidth / 2) + width - radius,
				(lineWidth / 2) + height - radius,
				radius,
				0,
				PI / +2
			);
			ctx.arc(
				radius + (lineWidth / +2),
				(lineWidth / 2) + height - radius,
				radius,
				PI / +2,
				PI
			);
			ctx.closePath();
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = cache.lineColor;
			ctx.fillStyle = cache.fillColor;
			ctx.lineJoin = 'round';
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			cache.draw = render;
		}
		return this.cache.draw;
	}

	mapgen['roundedCornerPoly'] = roundedCornerPoly;

	window['mapgen'] = mapgen;
})(window);
