/**
* @license License and Terms of Use
*
* Copyright (c) 2013 SignpostMarv
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
    'use strict';
    var
        lineOpt         = window['lineOpt'] || {},
        Error           = window['Error'],
        sqrt            = window['Math']['sqrt'],
        isNumeric       = function(input){
            return typeof(input) == 'number'
        },
        isNaN           = window['isNaN'],
        isFinite        = window['isFinite'],
        Array           = window['Array'],
        Float32Array    = window['Float32Array'],
        supportedArrays = [
            Array,
            Float32Array
        ],
        numericOnlyArrays = supportedArrays.slice(1)
    ;


    function isSupportedArray(input){
        for(var i=0;i<supportedArrays.length;++i){
            if(supportedArrays[i] && (
                input instanceof supportedArrays[i] ||
                input.prototype instanceof supportedArrays[i]
            )){
                return true;
            }
        }
        return false;
    }


    function isArray(input){
        return (input && (
            input instanceof Array ||
            input.prototype instanceof Array
        ));
    }


    function isNumericOnlyArray(input){
        for(var i=0;i<numericOnlyArrays.length;++i){
            if(numericOnlyArrays[i] && (
                input instanceof numericOnlyArrays[i] ||
                input.prototype instanceof numericOnlyArrays[i]
            )){
                return true;
            }
        }
        return false;
    }


    function hasUniques(input){
        var
            prevX = input[0],
            prevY = input[1]
        ;
        for(var i=2;i<input['length'];i+=2){
            if(input[i] != prevX || input[i + 1] != prevY){
                return true;
            }
        }
        return false;
    }

    function sanitiseLineSegmentArray(input, skipUniquesTest){
        skipUniquesTest = !!skipUniquesTest;
        if(!isSupportedArray(input)){
            throw new Error('value not a supported array type');
        }else if(isNumericOnlyArray(input)){
            if((input['length'] % 2) != 0){
                throw new Error(
                    'Typed array inputs must have a length that is ' +
                    'multiples of 2'
                );
            }else{
                for(var i=0;i<input['length'];++i){
                    if(!(
                        !isNaN(input[i]) &&
                        isFinite(input[i])
                    )){
                        throw new Error(
                            'Typed array contains NaN or Infinity'
                        );
                    }
                }
                if(!skipUniquesTest && !hasUniques(input)){
                    throw new Error(
                        'line segment array requires at least two ' +
                        'unique entries.'
                    );
                }
                return input;
            }
        }else if(isArray(input)){
            var
                numeric  = true,
                isObject = true
            ;
            if(Float32Array){
                var lazyInputCheck = new Float32Array(input);
                if(lazyInputCheck.length % 2 == 0){
                    for(var i=0;i<lazyInputCheck.length;++i){
                        if(!(
                            isNumeric(lazyInputCheck[i]) &&
                            !isNaN(lazyInputCheck[i]) &&
                            isFinite(lazyInputCheck[i])
                        )){
                            numeric  = false;
                            break;
                        }
                    }
                    if(numeric){
                        if(input['length'] < 4){
                            throw new Error(
                                'Numeric array inputs must have length ' +
                                'greater than or equal to 4'
                            );
                        }else if(!skipUniquesTest && !hasUniques(input)){
                            throw new Error(
                                'line segment array requires at least two ' +
                                'unique entries.'
                            );
                        }
                        return lazyInputCheck;
                    }
                }
            }
            if(input[0]['x'] != undefined && input[0]['y'] != undefined){
                isObject = true;
                numeric  = false;
            }else{
                numeric  = true;
                isObject = false;
            }
            if(isObject){
                if(input['length'] < 2){
                    throw new Error('Minimum array length is 2');
                }
                input['forEach'](function(e){
                    if(e['x'] == undefined || e['y'] == undefined){
                        throw new Error(
                            'Object arrays must have x & y properties'
                        );
                    }else if(!isNumeric(e['x']) || !isNumeric(e['y'])){
                        throw new Error(
                            'x & y properties must be numeric'
                        );
                    }else if(!isFinite(e['x']) || !isFinite(e['y'])){
                        throw new Error(
                            'Infinite coordinates not supported'
                        );
                    }else if(isNaN(e['x']) || isNaN(e['y'])){
                        throw new Error(
                            'NaN coordinates found'
                        );
                    }
                });
                var
                    numericArray = Float32Array ?
                        new Float32Array(input['length'] * 2) :
                        new Array(input['length'] * 2)
                    ;
                ;
                input['forEach'](function(e, i){
                    numericArray[(i * 2) + 0] = e['x'];
                    numericArray[(i * 2) + 1] = e['y'];
                });
                if(!skipUniquesTest && !hasUniques(numericArray)){
                    throw new Error(
                        'line segment array requires at least two unique ' +
                        'entries.'
                    );
                }
                return numericArray;
            }else if(input['length'] % 2 == 0){
                if(input['length'] < 4){
                    throw new Error(
                        'Numeric array inputs must have length greater ' +
                        'than or equal to 4'
                    );
                }
                for(var i=0;i<input['length'];++i){
                    if(
                        isNaN(input[i]) ||
                        !isFinite(input[i]) ||
                        !isNumeric(input[i])
                    ){
                        numeric  = false;
                        break;
                    }
                }
                if(numeric){
                    if(!skipUniquesTest && !hasUniques(input)){
                        throw new Error(
                            'line segment array requires at least two ' +
                            'unique entries.'
                        );
                    }else if(input['length'] % 2 != 0){
                        throw new Error(
                            'Numeric array inputs must have a length that ' +
                            'is multiples of 2'
                        );
                    }else if(Float32Array){
                        return new Float32Array(input);
                    }else{
                        return input.slice(0);
                    }
                }
            }

            throw new Error('Input array is unsupported');
        }
    }

    function optimiseLineSegmentArray(input, options){
        options   = options || {};
        [
            'ignoreConsecutiveDuplicates',
            'reduceByVector',
            'reduceByDistance'
        ].forEach(function(e){
            if(options[e] == undefined){
                options[e] = true;
            }
        });
        var
            output = sanitiseLineSegmentArray(input,
                options['skipUniquesTest'])
        ;

        if(options['ignoreConsecutiveDuplicates']){
            output = ignoreConsecutiveDuplicates(output);
        }
        if(options['reduceByVector']){
            output = reduceByVector(output);
        }
        if(options['reduceByDistance']){
            output = reduceByDistance(output, options['minDistance']);
        }
        if(options['ignoreConsecutiveDuplicates']){
            output = ignoreConsecutiveDuplicates(output);
        }

        return output;
    }

    function normaliseVectors(sanitised){
        var
            copy = Float32Array ?
                new Float32Array(sanitised.length) :
                sanitised.slice()
        ;
        if(Float32Array){
            for(var i=0;i<copy.length;i+=2){
                var
                    x = sanitised[i + 0],
                    y = sanitised[i + 1]
                ;
                if(x == 0 && y == 0){
                    copy[i + 0] = copy[i + 0] = 0;
                    continue;
                }
                var
                    magnitude = sqrt((x * x) + (y * y))
                ;
                copy[i + 0] = x / magnitude;
                copy[i + 1] = y / magnitude;
            }
        }else{
            for(var i=0;i<copy.length;i+=2){
                var
                    x = copy[i + 0],
                    y = copy[i + 1]
                ;
                if(x == 0 && y == 0){
                    copy[i + 0] = copy[i + 0] = 0;
                    continue;
                }
                var
                    magnitude = sqrt((x * x) + (y * y))
                ;
                copy[i + 0] /= magnitude;
                copy[i + 1] /= magnitude;
            }
        }

        return copy;
    }

    function ignoreConsecutiveDuplicates(sanitised){
        var
            output = [sanitised[0], sanitised[1]],
            prevX  = sanitised[0],
            prevY  = sanitised[1]
        ;
        for(var i=2;i<(sanitised.length - 2);i+=2){
            if(
                prevX != sanitised[i + 0] ||
                prevY != sanitised[i + 1]
            ){
                prevX = sanitised[i + 0];
                prevY = sanitised[i + 1];
                output.push(prevX);
                output.push(prevY);
            }
        }
        output.push(sanitised[sanitised.length - 2]);
        output.push(sanitised[sanitised.length - 1]);

        return Float32Array ? new Float32Array(output) : output;
    }

    function reduceByVector(sanitised){
        var
            output     = [sanitised[0], sanitised[1]],
            distances  = Float32Array ?
                new Float32Array(sanitised.length - 2) :
                new Array(sanitised.length - 2)
        ;
        for(var i=0;i<(sanitised.length - 2);i+=2){
            distances[i + 0] = sanitised[i + 2] - sanitised[i + 0];
            distances[i + 1] = sanitised[i + 3] - sanitised[i + 1];
        }
        var
            normalised = normaliseVectors(distances),
            nPrevX     = normalised[0],
            nPrevY     = normalised[1],
            prevX      = sanitised[0],
            prevY      = sanitised[1]
        ;
        for(var i=2;i<(sanitised.length - 2);i+=2){
            if(
                nPrevX != normalised[i + 0] ||
                nPrevY != normalised[i + 1]
            ){
                nPrevX = normalised[i + 0];
                nPrevY = normalised[i + 1];
                prevX  = sanitised[i + 0];
                prevY  = sanitised[i + 1];
                output.push(prevX);
                output.push(prevY);
            }
        }
        output.push(sanitised[sanitised.length - 2]);
        output.push(sanitised[sanitised.length - 1]);

        return Float32Array ? new Float32Array(output) : output;
    }

    function reduceByDistance(sanitised, minDistance){
        var
            minDistance = Math.abs(Math.pow(
                Math.max(.0001, parseFloat(minDistance || 0)
            ), 2)),
            output     = [sanitised[0], sanitised[1]]
        ;
        for(var i=2;i<(sanitised.length - 2);i+=2){
            var
                x = sanitised[i + 2] - sanitised[i + 0],
                y = sanitised[i + 3] - sanitised[i + 1],
                currentMag = Math.abs((x * x) + (y * y))
            ;
            if(currentMag >= minDistance){
                output.push(sanitised[i + 0]);
                output.push(sanitised[i + 1]);
            }
        }
        output.push(sanitised[sanitised.length - 2]);
        output.push(sanitised[sanitised.length - 1]);

        return Float32Array ? new Float32Array(output) : output;
    }

    lineOpt['twoD'] = {
        'sanitise' : sanitiseLineSegmentArray,
        'sanitize' : sanitiseLineSegmentArray,
        'optimise' : optimiseLineSegmentArray,
        'optimize' : optimiseLineSegmentArray
    }

    lineOpt['sanitise'] = lineOpt['sanitize'] = function(){
        var
            args       = arguments,
            dimensions = args.length >= 3 ?
                parseInt(args[2]) : (
                    (args.length >= 2 && typeof(args[1]) == 'number') ?
                        args[1] :
                        2
                )
        ;
        switch(dimensions){
            case 2:
                return sanitiseLineSegmentArray.apply(window, arguments);
            case 3:
                throw new Error('3D not yet supported.');
            default:
                throw new Error('Unsupported dimensions specified.');
        }
    }

    lineOpt['optimise'] = lineOpt['optimize'] = function(){
        var
            args       = arguments,
            dimensions = args.length >= 3 ?
                parseInt(args[2]) : (
                    (args.length >= 2 && typeof(args[1]) == 'number') ?
                        args[1] :
                        2
                )
        ;
        switch(dimensions){
            case 2:
                return optimiseLineSegmentArray.apply(window, arguments);
            case 3:
                throw new Error('3D not yet supported.');
            default:
                throw new Error('Unsupported dimensions specified.');
        }
    }

    if(!window['lineOpt']){
        window['lineOpt'] = lineOpt;
    }
})(window);
