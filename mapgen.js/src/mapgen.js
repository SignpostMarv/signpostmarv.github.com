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
			tesselateBuffer = document.createElement('canvas'),
			tesselateBufferScale = Math['min'](opts['polyWidth'], opts['polyHeight']) / 16|0,
			tesselateCtx
		;
		tesselateBuffer.width = render.width / tesselateBufferScale;
		tesselateBuffer.height = render.height / tesselateBufferScale
		var
			ctx = render.getContext('2d'),
			tesselateCtx = tesselateBuffer.getContext('2d'),
			draw,
			found,
			i = 0
		;
		tesselateCtx.scale(+1/tesselateBufferScale,+1/tesselateBufferScale);
		function findAvailable(dim){
			var
				allAlpha = true
			;
			for(var x=0;x<tesselateBuffer.width;x+=(opts['roadWidth'] / tesselateBufferScale)){
				for(var y=0;y<tesselateBuffer.height;y+=(opts['roadWidth'] / tesselateBufferScale)){
					allAlpha = true;
					var
						imageData = tesselateCtx.getImageData(x, y, dim.width / tesselateBufferScale, dim.height / tesselateBufferScale).data
					;
					for(var i=0;i<imageData.length;i+=(4|0)){
						if(imageData[i + 3] != 0){
							allAlpha = false;
							break;
						}
					}
					if(allAlpha){
						return [x * tesselateBufferScale,y * tesselateBufferScale];
					}
				}
			}
			return allAlpha ? [0,0] : false;
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
			tesselateCtx.fillRect(x, y, draw.width, draw.height);
			draw = randomDraw();
		}

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
