var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
    throw toThrow;
};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
}


var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var nodePath = require("path");
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
    } else {
        scriptDirectory = __dirname + "/";
    }
    read_ = (filename, binary) => {
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        return fs.readFileSync(filename, binary ? undefined : "utf8");
    };
    readBinary = (filename) => {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        return ret;
    };
    readAsync = (filename, onload, onerror, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
            if (err) onerror(err);
            else onload(binary ? data.buffer : data);
        });
    };
    if (!Module["thisProgram"] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, "/");
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != "undefined") {
        module["exports"] = Module;
    }
    process.on("uncaughtException", (ex) => {
        if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
            throw ex;
        }
    });
    quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow;
    };
    Module["inspect"] = () => "[Emscripten Module object]";
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
    } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
    } else {
        scriptDirectory = "";
    }
    {
        read_ = (url) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = (url) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response);
            };
        }
        readAsync = (url, onload, onerror) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                    onload(xhr.response);
                    return;
                }
                onerror();
            };
            xhr.onerror = onerror;
            xhr.send(null);
        };
    }
    setWindowTitle = (title) => (document.title = title);
} else {
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;
if (typeof WebAssembly != "object") {
    abort("no native wasm support detected");
}
var wasmMemory;
var wasmExports;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort(text);
    }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeKeepaliveCounter = 0;
function keepRuntimeAlive() {
    return noExitRuntime || runtimeKeepaliveCounter > 0;
}
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    FS.ignorePermissions = false;
    TTY.init();
    SOCKFS.root = FS.mount(SOCKFS, {}, null);
    callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
    callRuntimeCallbacks(__ATMAIN__);
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id;
}
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
}
function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what);
    }
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
    return filename.startsWith(dataURIPrefix);
}
function isFileURI(filename) {
    return filename.startsWith("file://");
}
var wasmBinaryFile;
wasmBinaryFile = "Previous.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
        return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
}
function getBinaryPromise(binaryFile) {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch == "function" && !isFileURI(binaryFile)) {
            return fetch(binaryFile, { credentials: "same-origin" })
                .then((response) => {
                    if (!response["ok"]) {
                        throw "failed to load wasm binary file at '" + binaryFile + "'";
                    }
                    return response["arrayBuffer"]();
                })
                .catch(() => getBinarySync(binaryFile));
        } else if (readAsync) {
            return new Promise((resolve, reject) => {
                readAsync(binaryFile, (response) => resolve(new Uint8Array(response)), reject);
            });
        }
    }
    return Promise.resolve().then(() => getBinarySync(binaryFile));
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
    return getBinaryPromise(binaryFile)
        .then((binary) => WebAssembly.instantiate(binary, imports))
        .then((instance) => instance)
        .then(receiver, (reason) => {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason);
        });
}
function instantiateAsync(binary, binaryFile, imports, callback) {
    if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
        return fetch(binaryFile, { credentials: "same-origin" }).then((response) => {
            var result = WebAssembly.instantiateStreaming(response, imports);
            return result.then(callback, function (reason) {
                err("wasm streaming compile failed: " + reason);
                err("falling back to ArrayBuffer instantiation");
                return instantiateArrayBuffer(binaryFile, imports, callback);
            });
        });
    }
    return instantiateArrayBuffer(binaryFile, imports, callback);
}
function createWasm() {
    var info = { a: wasmImports };
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        wasmExports = exports;
        wasmMemory = wasmExports["ne"];
        updateMemoryViews();
        wasmTable = wasmExports["pe"];
        addOnInit(wasmExports["oe"]);
        removeRunDependency("wasm-instantiate");
        return exports;
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiationResult(result) {
        receiveInstance(result["instance"]);
    }
    if (Module["instantiateWasm"]) {
        try {
            return Module["instantiateWasm"](info, receiveInstance);
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false;
        }
    }
    instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
    return {};
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    330224: ($0) => {
        var str = UTF8ToString($0) + "\n\n" + "Abort/Retry/Ignore/AlwaysIgnore? [ariA] :";
        var reply = window.prompt(str, "i");
        if (reply === null) {
            reply = "i";
        }
        return allocate(intArrayFromString(reply), "i8", ALLOC_NORMAL);
    },
    330449: () => {
        if (typeof AudioContext !== "undefined") {
            return true;
        } else if (typeof webkitAudioContext !== "undefined") {
            return true;
        }
        return false;
    },
    330596: () => {
        if (typeof navigator.mediaDevices !== "undefined" && typeof navigator.mediaDevices.getUserMedia !== "undefined") {
            return true;
        } else if (typeof navigator.webkitGetUserMedia !== "undefined") {
            return true;
        }
        return false;
    },
    330830: ($0) => {
        if (typeof Module["SDL2"] === "undefined") {
            Module["SDL2"] = {};
        }
        var SDL2 = Module["SDL2"];
        if (!$0) {
            SDL2.audio = {};
        } else {
            SDL2.capture = {};
        }
        if (!SDL2.audioContext) {
            if (typeof AudioContext !== "undefined") {
                SDL2.audioContext = new AudioContext();
            } else if (typeof webkitAudioContext !== "undefined") {
                SDL2.audioContext = new webkitAudioContext();
            }
            if (SDL2.audioContext) {
                autoResumeAudioContext(SDL2.audioContext);
            }
        }
        return SDL2.audioContext === undefined ? -1 : 0;
    },
    331323: () => {
        var SDL2 = Module["SDL2"];
        return SDL2.audioContext.sampleRate;
    },
    331391: ($0, $1, $2, $3) => {
        var SDL2 = Module["SDL2"];
        var have_microphone = function (stream) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearTimeout(SDL2.capture.silenceTimer);
                SDL2.capture.silenceTimer = undefined;
            }
            SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream);
            SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1);
            SDL2.capture.scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {
                if (SDL2 === undefined || SDL2.capture === undefined) {
                    return;
                }
                audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
                SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
                dynCall("vi", $2, [$3]);
            };
            SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode);
            SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination);
            SDL2.capture.stream = stream;
        };
        var no_microphone = function (error) {};
        SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate);
        SDL2.capture.silenceBuffer.getChannelData(0).fill(0);
        var silence_callback = function () {
            SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer;
            dynCall("vi", $2, [$3]);
        };
        SDL2.capture.silenceTimer = setTimeout(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1e3);
        if (navigator.mediaDevices !== undefined && navigator.mediaDevices.getUserMedia !== undefined) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(have_microphone).catch(no_microphone);
        } else if (navigator.webkitGetUserMedia !== undefined) {
            navigator.webkitGetUserMedia({ audio: true, video: false }, have_microphone, no_microphone);
        }
    },
    333043: ($0, $1, $2, $3) => {
        var SDL2 = Module["SDL2"];
        SDL2.audio.scriptProcessorNode = SDL2.audioContext["createScriptProcessor"]($1, 0, $0);
        SDL2.audio.scriptProcessorNode["onaudioprocess"] = function (e) {
            if (SDL2 === undefined || SDL2.audio === undefined) {
                return;
            }
            SDL2.audio.currentOutputBuffer = e["outputBuffer"];
            dynCall("vi", $2, [$3]);
        };
        SDL2.audio.scriptProcessorNode["connect"](SDL2.audioContext["destination"]);
    },
    333453: ($0, $1) => {
        var SDL2 = Module["SDL2"];
        var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels;
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c);
            if (channelData.length != $1) {
                throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
            }
            if (numChannels == 1) {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + j * 4, channelData[j], "float");
                }
            } else {
                for (var j = 0; j < $1; ++j) {
                    setValue($0 + (j * numChannels + c) * 4, channelData[j], "float");
                }
            }
        }
    },
    334058: ($0, $1) => {
        var SDL2 = Module["SDL2"];
        var numChannels = SDL2.audio.currentOutputBuffer["numberOfChannels"];
        for (var c = 0; c < numChannels; ++c) {
            var channelData = SDL2.audio.currentOutputBuffer["getChannelData"](c);
            if (channelData.length != $1) {
                throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
            }
            for (var j = 0; j < $1; ++j) {
                channelData[j] = HEAPF32[($0 + ((j * numChannels + c) << 2)) >> 2];
            }
        }
    },
    334538: ($0) => {
        var SDL2 = Module["SDL2"];
        if ($0) {
            if (SDL2.capture.silenceTimer !== undefined) {
                clearTimeout(SDL2.capture.silenceTimer);
            }
            if (SDL2.capture.stream !== undefined) {
                var tracks = SDL2.capture.stream.getAudioTracks();
                for (var i = 0; i < tracks.length; i++) {
                    SDL2.capture.stream.removeTrack(tracks[i]);
                }
                SDL2.capture.stream = undefined;
            }
            if (SDL2.capture.scriptProcessorNode !== undefined) {
                SDL2.capture.scriptProcessorNode.onaudioprocess = function (audioProcessingEvent) {};
                SDL2.capture.scriptProcessorNode.disconnect();
                SDL2.capture.scriptProcessorNode = undefined;
            }
            if (SDL2.capture.mediaStreamNode !== undefined) {
                SDL2.capture.mediaStreamNode.disconnect();
                SDL2.capture.mediaStreamNode = undefined;
            }
            if (SDL2.capture.silenceBuffer !== undefined) {
                SDL2.capture.silenceBuffer = undefined;
            }
            SDL2.capture = undefined;
        } else {
            if (SDL2.audio.scriptProcessorNode != undefined) {
                SDL2.audio.scriptProcessorNode.disconnect();
                SDL2.audio.scriptProcessorNode = undefined;
            }
            SDL2.audio = undefined;
        }
        if (SDL2.audioContext !== undefined && SDL2.audio === undefined && SDL2.capture === undefined) {
            SDL2.audioContext.close();
            SDL2.audioContext = undefined;
        }
    },
    335710: ($0, $1, $2) => {
        var w = $0;
        var h = $1;
        var pixels = $2;
        if (!Module["SDL2"]) Module["SDL2"] = {};
        var SDL2 = Module["SDL2"];
        if (SDL2.ctxCanvas !== Module["canvas"]) {
            SDL2.ctx = Module["createContext"](Module["canvas"], false, true);
            SDL2.ctxCanvas = Module["canvas"];
        }
        if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) {
            SDL2.image = SDL2.ctx.createImageData(w, h);
            SDL2.w = w;
            SDL2.h = h;
            SDL2.imageCtx = SDL2.ctx;
        }
        var data = SDL2.image.data;
        var src = pixels >> 2;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = (val >> 8) & 255;
                data[dst + 2] = (val >> 16) & 255;
                data[dst + 3] = 255;
                src++;
                dst += 4;
            }
        } else {
            if (SDL2.data32Data !== data) {
                SDL2.data32 = new Int32Array(data.buffer);
                SDL2.data8 = new Uint8Array(data.buffer);
                SDL2.data32Data = data;
            }
            var data32 = SDL2.data32;
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num));
            var data8 = SDL2.data8;
            var i = 3;
            var j = i + 4 * num;
            if (num % 8 == 0) {
                while (i < j) {
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                    data8[i] = 255;
                    i = (i + 4) | 0;
                }
            } else {
                while (i < j) {
                    data8[i] = 255;
                    i = (i + 4) | 0;
                }
            }
        }
        SDL2.ctx.putImageData(SDL2.image, 0, 0);
    },
    337179: ($0, $1, $2, $3, $4) => {
        var w = $0;
        var h = $1;
        var hot_x = $2;
        var hot_y = $3;
        var pixels = $4;
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        var image = ctx.createImageData(w, h);
        var data = image.data;
        var src = pixels >> 2;
        var dst = 0;
        var num;
        if (typeof CanvasPixelArray !== "undefined" && data instanceof CanvasPixelArray) {
            num = data.length;
            while (dst < num) {
                var val = HEAP32[src];
                data[dst] = val & 255;
                data[dst + 1] = (val >> 8) & 255;
                data[dst + 2] = (val >> 16) & 255;
                data[dst + 3] = (val >> 24) & 255;
                src++;
                dst += 4;
            }
        } else {
            var data32 = new Int32Array(data.buffer);
            num = data32.length;
            data32.set(HEAP32.subarray(src, src + num));
        }
        ctx.putImageData(image, 0, 0);
        var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
        var urlBuf = _malloc(url.length + 1);
        stringToUTF8(url, urlBuf, url.length + 1);
        return urlBuf;
    },
    338168: ($0) => {
        if (Module["canvas"]) {
            Module["canvas"].style["cursor"] = UTF8ToString($0);
        }
    },
    338251: () => {
        if (Module["canvas"]) {
            Module["canvas"].style["cursor"] = "none";
        }
    },
    338320: () => window.innerWidth,
    338350: () => window.innerHeight,
};
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
}
var listenOnce = (object, event, func) => {
    object.addEventListener(event, func, { once: true });
};
var autoResumeAudioContext = (ctx, elements) => {
    if (!elements) {
        elements = [document, document.getElementById("canvas")];
    }
    ["keydown", "mousedown", "touchstart"].forEach((event) => {
        elements.forEach((element) => {
            if (element) {
                listenOnce(element, event, () => {
                    if (ctx.state === "suspended") ctx.resume();
                });
            }
        });
    });
};
var callRuntimeCallbacks = (callbacks) => {
    while (callbacks.length > 0) {
        callbacks.shift()(Module);
    }
};
var dynCallLegacy = (sig, ptr, args) => {
    var f = Module["dynCall_" + sig];
    return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
};
var wasmTableMirror = [];
var getWasmTableEntry = (funcPtr) => {
    var func = wasmTableMirror[funcPtr];
    if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
    }
    return func;
};
var dynCall = (sig, ptr, args) => {
    if (sig.includes("j")) {
        return dynCallLegacy(sig, ptr, args);
    }
    var rtn = getWasmTableEntry(ptr).apply(null, args);
    return rtn;
};
function setValue(ptr, value, type = "i8") {
    if (type.endsWith("*")) type = "*";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            abort("to do setValue(i64) use WASM_BIGINT");
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        case "*":
            HEAPU32[ptr >> 2] = value;
            break;
        default:
            abort(`invalid type for setValue: ${type}`);
    }
}
function ExceptionInfo(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
    this.set_type = function (type) {
        HEAPU32[(this.ptr + 4) >> 2] = type;
    };
    this.get_type = function () {
        return HEAPU32[(this.ptr + 4) >> 2];
    };
    this.set_destructor = function (destructor) {
        HEAPU32[(this.ptr + 8) >> 2] = destructor;
    };
    this.get_destructor = function () {
        return HEAPU32[(this.ptr + 8) >> 2];
    };
    this.set_caught = function (caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr + 12) >> 0] = caught;
    };
    this.get_caught = function () {
        return HEAP8[(this.ptr + 12) >> 0] != 0;
    };
    this.set_rethrown = function (rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr + 13) >> 0] = rethrown;
    };
    this.get_rethrown = function () {
        return HEAP8[(this.ptr + 13) >> 0] != 0;
    };
    this.init = function (type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
    };
    this.set_adjusted_ptr = function (adjustedPtr) {
        HEAPU32[(this.ptr + 16) >> 2] = adjustedPtr;
    };
    this.get_adjusted_ptr = function () {
        return HEAPU32[(this.ptr + 16) >> 2];
    };
    this.get_exception_ptr = function () {
        var isPointer = ___cxa_is_pointer_type(this.get_type());
        if (isPointer) {
            return HEAPU32[this.excPtr >> 2];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.excPtr;
    };
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
function ___cxa_throw(ptr, type, destructor) {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    throw exceptionLast;
}
var PATH = {
    isAbs: (path) => path.charAt(0) === "/",
    splitPath: (filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    },
    normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1);
            } else if (last === "..") {
                parts.splice(i, 1);
                up++;
            } else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..");
            }
        }
        return parts;
    },
    normalize: (path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(
            path.split("/").filter((p) => !!p),
            !isAbsolute
        ).join("/");
        if (!path && !isAbsolute) {
            path = ".";
        }
        if (path && trailingSlash) {
            path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
    },
    dirname: (path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return ".";
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    },
    basename: (path) => {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
    },
    join: function () {
        var paths = Array.prototype.slice.call(arguments);
        return PATH.normalize(paths.join("/"));
    },
    join2: (l, r) => PATH.normalize(l + "/" + r),
};
var initRandomFill = () => {
    if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
        return (view) => crypto.getRandomValues(view);
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            var randomFillSync = crypto_module["randomFillSync"];
            if (randomFillSync) {
                return (view) => crypto_module["randomFillSync"](view);
            }
            var randomBytes = crypto_module["randomBytes"];
            return (view) => (view.set(randomBytes(view.byteLength)), view);
        } catch (e) {}
    }
    abort("initRandomDevice");
};
var randomFill = (view) => (randomFill = initRandomFill())(view);
var PATH_FS = {
    resolve: function () {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path != "string") {
                throw new TypeError("Arguments to path.resolve must be strings");
            } else if (!path) {
                return "";
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path);
        }
        resolvedPath = PATH.normalizeArray(
            resolvedPath.split("/").filter((p) => !!p),
            !resolvedAbsolute
        ).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    },
    relative: (from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break;
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
    },
};
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode(((u0 & 31) << 6) | u1);
            continue;
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
            u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0);
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
    }
    return str;
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++;
        } else if (c <= 2047) {
            len += 2;
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i;
        } else {
            len += 3;
        }
    }
    return len;
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u;
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | (u >> 6);
            heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | (u >> 12);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | (u >> 18);
            heap[outIdx++] = 128 | ((u >> 12) & 63);
            heap[outIdx++] = 128 | ((u >> 6) & 63);
            heap[outIdx++] = 128 | (u & 63);
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
};
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}
var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, -1);
            } catch (e) {
                if (e.toString().includes("EOF")) bytesRead = 0;
                else throw e;
            }
            if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString("utf-8");
            } else {
                result = null;
            }
        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
            result = window.prompt("Input: ");
            if (result !== null) {
                result += "\n";
            }
        } else if (typeof readline == "function") {
            result = readline();
            if (result !== null) {
                result += "\n";
            }
        }
        if (!result) {
            return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
};
var TTY = {
    ttys: [],
    init: function () {},
    shutdown: function () {},
    register: function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
    },
    stream_ops: {
        open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43);
            }
            stream.tty = tty;
            stream.seekable = false;
        },
        close: function (stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        fsync: function (stream) {
            stream.tty.ops.fsync(stream.tty);
        },
        read: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                } catch (e) {
                    throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now();
            }
            return bytesRead;
        },
        write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                }
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
            if (length) {
                stream.node.timestamp = Date.now();
            }
            return i;
        },
    },
    default_tty_ops: {
        get_char: function (tty) {
            return FS_stdin_getChar();
        },
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync: function (tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        },
        ioctl_tcgets: function (tty) {
            return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
        },
        ioctl_tcsets: function (tty, optional_actions, data) {
            return 0;
        },
        ioctl_tiocgwinsz: function (tty) {
            return [24, 80];
        },
    },
    default_tty1_ops: {
        put_char: function (tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            } else {
                if (val != 0) tty.output.push(val);
            }
        },
        fsync: function (tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        },
    },
};
var zeroMemory = (address, size) => {
    HEAPU8.fill(0, address, address + size);
    return address;
};
var mmapAlloc = (size) => {
    abort();
};
var MEMFS = {
    ops_table: null,
    mount(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
    },
    createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink,
                    },
                    stream: { llseek: MEMFS.stream_ops.llseek },
                },
                file: {
                    node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr },
                    stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync },
                },
                link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} },
                chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops },
            };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null;
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp;
        }
        return node;
    },
    getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
    },
    expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
    },
    resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
            }
            node.usedBytes = newSize;
        }
    },
    node_ops: {
        getattr(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            } else {
                attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        },
        setattr(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        },
        lookup(parent, name) {
            throw FS.genericErrors[44];
        },
        mknod(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        },
        rename(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
            old_node.parent = new_dir;
        },
        unlink(parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now();
        },
        rmdir(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55);
            }
            delete parent.contents[name];
            parent.timestamp = Date.now();
        },
        readdir(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue;
                }
                entries.push(key);
            }
            return entries;
        },
        symlink(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node;
        },
        readlink(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
            }
            return node.link;
        },
    },
    stream_ops: {
        read(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset);
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
            }
            return size;
        },
        write(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false;
            }
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position);
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i];
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        },
        llseek(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28);
            }
            return position;
        },
        allocate(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
        mmap(stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
                allocated = false;
                ptr = contents.byteOffset;
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length);
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length);
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48);
                }
                HEAP8.set(contents, ptr);
            }
            return { ptr: ptr, allocated: allocated };
        },
        msync(stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0;
        },
    },
};
var asyncLoad = (url, onload, onerror, noRunDep) => {
    var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
    readAsync(
        url,
        (arrayBuffer) => {
            assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep);
        },
        (event) => {
            if (onerror) {
                onerror();
            } else {
                throw `Loading data file "${url}" failed.`;
            }
        }
    );
    if (dep) addRunDependency(dep);
};
var preloadPlugins = Module["preloadPlugins"] || [];
function FS_handledByPreloadPlugin(byteArray, fullname, finish, onerror) {
    if (typeof Browser != "undefined") Browser.init();
    var handled = false;
    preloadPlugins.forEach(function (plugin) {
        if (handled) return;
        if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, onerror);
            handled = true;
        }
    });
    return handled;
}
function FS_createPreloadedFile(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    function processData(byteArray) {
        function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
                FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
        }
        if (
            FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
                if (onerror) onerror();
                removeRunDependency(dep);
            })
        ) {
            return;
        }
        finish(byteArray);
    }
    addRunDependency(dep);
    if (typeof url == "string") {
        asyncLoad(url, (byteArray) => processData(byteArray), onerror);
    } else {
        processData(url);
    }
}
function FS_modeStringToFlags(str) {
    var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
        throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
}
function FS_getMode(canRead, canWrite) {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
}
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath: (path, opts = {}) => {
        path = PATH_FS.resolve(path);
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        opts = Object.assign(defaults, opts);
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32);
        }
        var parts = path.split("/").filter((p) => !!p);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                    current = current.mounted.root;
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32);
                    }
                }
            }
        }
        return { path: current_path, node: current };
    },
    getPath: (node) => {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent;
        }
    },
    hashName: (parentid, name) => {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
    },
    hashAddNode: (node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    },
    hashRemoveNode: (node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    },
    lookupNode: (parent, name) => {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        return FS.lookup(parent, name);
    },
    createNode: (parent, name, mode, rdev) => {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    },
    destroyNode: (node) => {
        FS.hashRemoveNode(node);
    },
    isRoot: (node) => node === node.parent,
    isMountpoint: (node) => !!node.mounted,
    isFile: (mode) => (mode & 61440) === 32768,
    isDir: (mode) => (mode & 61440) === 16384,
    isLink: (mode) => (mode & 61440) === 40960,
    isChrdev: (mode) => (mode & 61440) === 8192,
    isBlkdev: (mode) => (mode & 61440) === 24576,
    isFIFO: (mode) => (mode & 61440) === 4096,
    isSocket: (mode) => (mode & 49152) === 49152,
    flagsToPermissionString: (flag) => {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w";
        }
        return perms;
    },
    nodePermissions: (node, perms) => {
        if (FS.ignorePermissions) {
            return 0;
        }
        if (perms.includes("r") && !(node.mode & 292)) {
            return 2;
        } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2;
        } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2;
        }
        return 0;
    },
    mayLookup: (dir) => {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
    },
    mayCreate: (dir, name) => {
        try {
            var node = FS.lookupNode(dir, name);
            return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, "wx");
    },
    mayDelete: (dir, name, isdir) => {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        } catch (e) {
            return e.errno;
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31;
            }
        }
        return 0;
    },
    mayOpen: (node, flags) => {
        if (!node) {
            return 44;
        }
        if (FS.isLink(node.mode)) {
            return 32;
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    },
    MAX_OPEN_FDS: 4096,
    nextfd: () => {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(33);
    },
    getStreamChecked: (fd) => {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        return stream;
    },
    getStream: (fd) => FS.streams[fd],
    createStream: (stream, fd = -1) => {
        if (!FS.FSStream) {
            FS.FSStream = function () {
                this.shared = {};
            };
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get() {
                        return this.node;
                    },
                    set(val) {
                        this.node = val;
                    },
                },
                isRead: {
                    get() {
                        return (this.flags & 2097155) !== 1;
                    },
                },
                isWrite: {
                    get() {
                        return (this.flags & 2097155) !== 0;
                    },
                },
                isAppend: {
                    get() {
                        return this.flags & 1024;
                    },
                },
                flags: {
                    get() {
                        return this.shared.flags;
                    },
                    set(val) {
                        this.shared.flags = val;
                    },
                },
                position: {
                    get() {
                        return this.shared.position;
                    },
                    set(val) {
                        this.shared.position = val;
                    },
                },
            });
        }
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
            fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    },
    closeStream: (fd) => {
        FS.streams[fd] = null;
    },
    chrdev_stream_ops: {
        open: (stream) => {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
            }
        },
        llseek: () => {
            throw new FS.ErrnoError(70);
        },
    },
    major: (dev) => dev >> 8,
    minor: (dev) => dev & 255,
    makedev: (ma, mi) => (ma << 8) | mi,
    registerDevice: (dev, ops) => {
        FS.devices[dev] = { stream_ops: ops };
    },
    getDevice: (dev) => FS.devices[dev],
    getMounts: (mount) => {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts);
        }
        return mounts;
    },
    syncfs: (populate, callback) => {
        if (typeof populate == "function") {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode);
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        mounts.forEach((mount) => {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    },
    mount: (type, opts, mountpoint) => {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
            }
        }
        var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    },
    unmount: (mountpoint) => {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((hash) => {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
    },
    lookup: (parent, name) => parent.node_ops.lookup(parent, name),
    mknod: (path, mode, dev) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    },
    create: (path, mode) => {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    },
    mkdir: (path, mode) => {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    },
    mkdirTree: (path, mode) => {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode);
            } catch (e) {
                if (e.errno != 20) throw e;
            }
        }
    },
    mkdev: (path, mode, dev) => {
        if (typeof dev == "undefined") {
            dev = mode;
            mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    },
    symlink: (oldpath, newpath) => {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    },
    rename: (old_path, new_path) => {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
            return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
            throw e;
        } finally {
            FS.hashAddNode(old_node);
        }
    },
    rmdir: (path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
    },
    readdir: (path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
    },
    unlink: (path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
    },
    readlink: (path) => {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    },
    stat: (path, dontFollow) => {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
    },
    lstat: (path) => FS.stat(path, true),
    chmod: (path, mode, dontFollow) => {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { mode: (mode & 4095) | (node.mode & ~4095), timestamp: Date.now() });
    },
    lchmod: (path, mode) => {
        FS.chmod(path, mode, true);
    },
    fchmod: (fd, mode) => {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
    },
    chown: (path, uid, gid, dontFollow) => {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
    },
    lchown: (path, uid, gid) => {
        FS.chown(path, uid, gid, true);
    },
    fchown: (fd, uid, gid) => {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
    },
    truncate: (path, len) => {
        if (len < 0) {
            throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        } else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
    },
    ftruncate: (fd, len) => {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
    },
    utime: (path, atime, mtime) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
    },
    open: (path, flags, mode) => {
        if (path === "") {
            throw new FS.ErrnoError(44);
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        mode = typeof mode == "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = (mode & 4095) | 32768;
        } else {
            mode = 0;
        }
        var node;
        if (typeof path == "object") {
            node = path;
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
                node = lookup.node;
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20);
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        if (flags & 512 && !created) {
            FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({ node: node, path: FS.getPath(node), flags: flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
            }
        }
        return stream;
    },
    close: (stream) => {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        } catch (e) {
            throw e;
        } finally {
            FS.closeStream(stream.fd);
        }
        stream.fd = null;
    },
    isClosed: (stream) => stream.fd === null,
    llseek: (stream, offset, whence) => {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
    },
    read: (stream, buffer, offset, length, position) => {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
    },
    write: (stream, buffer, offset, length, position, canOwn) => {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position;
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
    },
    allocate: (stream, offset, length) => {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
    },
    mmap: (stream, length, position, prot, flags) => {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
    },
    msync: (stream, buffer, offset, length, mmapFlags) => {
        if (!stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    },
    munmap: (stream) => 0,
    ioctl: (stream, cmd, arg) => {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    },
    readFile: (path, opts = {}) => {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    },
    writeFile: (path, data, opts = {}) => {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
            throw new Error("Unsupported data type");
        }
        FS.close(stream);
    },
    cwd: () => FS.currentPath,
    chdir: (path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
    },
    createDefaultDirectories: () => {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
    },
    createDefaultDevices: () => {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024),
            randomLeft = 0;
        var randomByte = () => {
            if (randomLeft === 0) {
                randomLeft = randomFill(randomBuffer).byteLength;
            }
            return randomBuffer[--randomLeft];
        };
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
    },
    createSpecialDirectories: () => {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount(
            {
                mount: () => {
                    var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                    node.node_ops = {
                        lookup: (parent, name) => {
                            var fd = +name;
                            var stream = FS.getStreamChecked(fd);
                            var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path } };
                            ret.parent = ret;
                            return ret;
                        },
                    };
                    return node;
                },
            },
            {},
            "/proc/self/fd"
        );
    },
    createStandardStreams: () => {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"]);
        } else {
            FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"]);
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1);
    },
    ensureErrnoError: () => {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.name = "ErrnoError";
            this.node = node;
            this.setErrno = function (errno) {
                this.errno = errno;
            };
            this.setErrno(errno);
            this.message = "FS error";
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach((code) => {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>";
        });
    },
    staticInit: () => {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { MEMFS: MEMFS };
    },
    init: (input, output, error) => {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams();
    },
    quit: () => {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    },
    findObject: (path, dontResolveLastLink) => {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
            return null;
        }
        return ret.object;
    },
    analyzePath: (path, dontResolveLastLink) => {
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        } catch (e) {}
        var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
        try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/";
        } catch (e) {
            ret.error = e.errno;
        }
        return ret;
    },
    createPath: (parent, path, canRead, canWrite) => {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            } catch (e) {}
            parent = current;
        }
        return current;
    },
    createFile: (parent, name, properties, canRead, canWrite) => {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
    },
    createDataFile: (parent, name, data, canRead, canWrite, canOwn) => {
        var path = name;
        if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data == "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr;
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
        return node;
    },
    createDevice: (parent, name, input, output) => {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: (stream) => {
                stream.seekable = false;
            },
            close: (stream) => {
                if (output && output.buffer && output.buffer.length) {
                    output(10);
                }
            },
            read: (stream, buffer, offset, length, pos) => {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6);
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now();
                }
                return bytesRead;
            },
            write: (stream, buffer, offset, length, pos) => {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    } catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now();
                }
                return i;
            },
        });
        return FS.mkdev(path, mode, dev);
    },
    forceLoadFile: (obj) => {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length;
            } catch (e) {
                throw new FS.ErrnoError(29);
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.");
        }
    },
    createLazyFile: (parent, name, url, canRead, canWrite) => {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = [];
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize) | 0;
            return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (from, to) => {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined");
                }
                xhr.send(null);
                if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || []);
                }
                return intArrayFromString(xhr.responseText || "", true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest != "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array();
            Object.defineProperties(lazyArray, {
                length: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._length;
                    },
                },
                chunkSize: {
                    get: function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._chunkSize;
                    },
                },
            });
            var properties = { isDevice: false, contents: lazyArray };
        } else {
            var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents;
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function () {
                    return this.contents.length;
                },
            },
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments);
            };
        });
        function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position);
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
                throw new FS.ErrnoError(48);
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return { ptr: ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
    },
};
var UTF8ToString = (ptr, maxBytesToRead) => (ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "");
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    calculateAt: function (dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
            return path;
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd();
        } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path;
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44);
            }
            return dir;
        }
        return PATH.join2(dir, path);
    },
    doStat: function (func, path, buf) {
        try {
            var stat = func(path);
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54;
            }
            throw e;
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = stat.mode;
        HEAPU32[(buf + 8) >> 2] = stat.nlink;
        HEAP32[(buf + 12) >> 2] = stat.uid;
        HEAP32[(buf + 16) >> 2] = stat.gid;
        HEAP32[(buf + 20) >> 2] = stat.rdev;
        (tempI64 = [stat.size >>> 0, ((tempDouble = stat.size), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0)]),
            (HEAP32[(buf + 24) >> 2] = tempI64[0]),
            (HEAP32[(buf + 28) >> 2] = tempI64[1]);
        HEAP32[(buf + 32) >> 2] = 4096;
        HEAP32[(buf + 36) >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [
            Math.floor(atime / 1e3) >>> 0,
            ((tempDouble = Math.floor(atime / 1e3)), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 40) >> 2] = tempI64[0]),
            (HEAP32[(buf + 44) >> 2] = tempI64[1]);
        HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3;
        (tempI64 = [
            Math.floor(mtime / 1e3) >>> 0,
            ((tempDouble = Math.floor(mtime / 1e3)), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 56) >> 2] = tempI64[0]),
            (HEAP32[(buf + 60) >> 2] = tempI64[1]);
        HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3;
        (tempI64 = [
            Math.floor(ctime / 1e3) >>> 0,
            ((tempDouble = Math.floor(ctime / 1e3)), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(buf + 72) >> 2] = tempI64[0]),
            (HEAP32[(buf + 76) >> 2] = tempI64[1]);
        HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3;
        (tempI64 = [stat.ino >>> 0, ((tempDouble = stat.ino), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0)]),
            (HEAP32[(buf + 88) >> 2] = tempI64[0]),
            (HEAP32[(buf + 92) >> 2] = tempI64[1]);
        return 0;
    },
    doMsync: function (addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
            return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
    },
    varargs: undefined,
    get() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
        return ret;
    },
    getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
    },
    getStreamFromFD: function (fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
    },
};
function ___syscall__newselect(nfds, readfds, writefds, exceptfds, timeout) {
    try {
        var total = 0;
        var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
            srcReadHigh = readfds ? HEAP32[(readfds + 4) >> 2] : 0;
        var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
            srcWriteHigh = writefds ? HEAP32[(writefds + 4) >> 2] : 0;
        var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
            srcExceptHigh = exceptfds ? HEAP32[(exceptfds + 4) >> 2] : 0;
        var dstReadLow = 0,
            dstReadHigh = 0;
        var dstWriteLow = 0,
            dstWriteHigh = 0;
        var dstExceptLow = 0,
            dstExceptHigh = 0;
        var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
        var allHigh = (readfds ? HEAP32[(readfds + 4) >> 2] : 0) | (writefds ? HEAP32[(writefds + 4) >> 2] : 0) | (exceptfds ? HEAP32[(exceptfds + 4) >> 2] : 0);
        var check = function (fd, low, high, val) {
            return fd < 32 ? low & val : high & val;
        };
        for (var fd = 0; fd < nfds; fd++) {
            var mask = 1 << fd % 32;
            if (!check(fd, allLow, allHigh, mask)) {
                continue;
            }
            var stream = SYSCALLS.getStreamFromFD(fd);
            var flags = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
                var timeoutInMillis = -1;
                if (timeout) {
                    var tv_sec = readfds ? HEAP32[timeout >> 2] : 0,
                        tv_usec = readfds ? HEAP32[(timeout + 8) >> 2] : 0;
                    timeoutInMillis = (tv_sec + tv_usec / 1e6) * 1e3;
                }
                flags = stream.stream_ops.poll(stream, timeoutInMillis);
            }
            if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
                total++;
            }
            if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
                total++;
            }
            if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
                total++;
            }
        }
        if (readfds) {
            HEAP32[readfds >> 2] = dstReadLow;
            HEAP32[(readfds + 4) >> 2] = dstReadHigh;
        }
        if (writefds) {
            HEAP32[writefds >> 2] = dstWriteLow;
            HEAP32[(writefds + 4) >> 2] = dstWriteHigh;
        }
        if (exceptfds) {
            HEAP32[exceptfds >> 2] = dstExceptLow;
            HEAP32[(exceptfds + 4) >> 2] = dstExceptHigh;
        }
        return total;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
var SOCKFS = {
    mount(mount) {
        Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function (event, callback) {
            if ("function" === typeof callback) {
                this._callbacks[event] = callback;
            }
            return this;
        };
        Module["websocket"].emit = function (event, param) {
            if ("function" === typeof this._callbacks[event]) {
                this._callbacks[event].call(this, param);
            }
        };
        return FS.createNode(null, "/", 16384 | 511, 0);
    },
    createSocket(family, type, protocol) {
        type &= ~526336;
        var streaming = type == 1;
        if (streaming && protocol && protocol != 6) {
            throw new FS.ErrnoError(66);
        }
        var sock = { family: family, type: type, protocol: protocol, server: null, error: null, peers: {}, pending: [], recv_queue: [], sock_ops: SOCKFS.websocket_sock_ops };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({ path: name, node: node, flags: 2, seekable: false, stream_ops: SOCKFS.stream_ops });
        sock.stream = stream;
        return sock;
    },
    getSocket(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
            return null;
        }
        return stream.node.sock;
    },
    stream_ops: {
        poll(stream) {
            var sock = stream.node.sock;
            return sock.sock_ops.poll(sock);
        },
        ioctl(stream, request, varargs) {
            var sock = stream.node.sock;
            return sock.sock_ops.ioctl(sock, request, varargs);
        },
        read(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            var msg = sock.sock_ops.recvmsg(sock, length);
            if (!msg) {
                return 0;
            }
            buffer.set(msg.buffer, offset);
            return msg.buffer.length;
        },
        write(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
        close(stream) {
            var sock = stream.node.sock;
            sock.sock_ops.close(sock);
        },
    },
    nextname() {
        if (!SOCKFS.nextname.current) {
            SOCKFS.nextname.current = 0;
        }
        return "socket[" + SOCKFS.nextname.current++ + "]";
    },
    websocket_sock_ops: {
        createPeer(sock, addr, port) {
            var ws;
            if (typeof addr == "object") {
                ws = addr;
                addr = null;
                port = null;
            }
            if (ws) {
                if (ws._socket) {
                    addr = ws._socket.remoteAddress;
                    port = ws._socket.remotePort;
                } else {
                    var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
                    if (!result) {
                        throw new Error("WebSocket URL must be in the format ws(s)://address:port");
                    }
                    addr = result[1];
                    port = parseInt(result[2], 10);
                }
            } else {
                try {
                    var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
                    var url = "ws:#".replace("#", "//");
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["url"]) {
                            url = Module["websocket"]["url"];
                        }
                    }
                    if (url === "ws://" || url === "wss://") {
                        var parts = addr.split("/");
                        url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
                    }
                    var subProtocols = "binary";
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["subprotocol"]) {
                            subProtocols = Module["websocket"]["subprotocol"];
                        }
                    }
                    var opts = undefined;
                    if (subProtocols !== "null") {
                        subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
                        opts = subProtocols;
                    }
                    if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
                        subProtocols = "null";
                        opts = undefined;
                    }
                    var WebSocketConstructor;
                    if (ENVIRONMENT_IS_NODE) {
                        WebSocketConstructor = require("ws");
                    } else {
                        WebSocketConstructor = WebSocket;
                    }
                    ws = new WebSocketConstructor(url, opts);
                    ws.binaryType = "arraybuffer";
                } catch (e) {
                    throw new FS.ErrnoError(23);
                }
            }
            var peer = { addr: addr, port: port, socket: ws, dgram_send_queue: [] };
            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
            SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
            if (sock.type === 2 && typeof sock.sport != "undefined") {
                peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]));
            }
            return peer;
        },
        getPeer(sock, addr, port) {
            return sock.peers[addr + ":" + port];
        },
        addPeer(sock, peer) {
            sock.peers[peer.addr + ":" + peer.port] = peer;
        },
        removePeer(sock, peer) {
            delete sock.peers[peer.addr + ":" + peer.port];
        },
        handlePeerEvents(sock, peer) {
            var first = true;
            var handleOpen = function () {
                Module["websocket"].emit("open", sock.stream.fd);
                try {
                    var queued = peer.dgram_send_queue.shift();
                    while (queued) {
                        peer.socket.send(queued);
                        queued = peer.dgram_send_queue.shift();
                    }
                } catch (e) {
                    peer.socket.close();
                }
            };
            function handleMessage(data) {
                if (typeof data == "string") {
                    var encoder = new TextEncoder();
                    data = encoder.encode(data);
                } else {
                    assert(data.byteLength !== undefined);
                    if (data.byteLength == 0) {
                        return;
                    }
                    data = new Uint8Array(data);
                }
                var wasfirst = first;
                first = false;
                if (
                    wasfirst &&
                    data.length === 10 &&
                    data[0] === 255 &&
                    data[1] === 255 &&
                    data[2] === 255 &&
                    data[3] === 255 &&
                    data[4] === "p".charCodeAt(0) &&
                    data[5] === "o".charCodeAt(0) &&
                    data[6] === "r".charCodeAt(0) &&
                    data[7] === "t".charCodeAt(0)
                ) {
                    var newport = (data[8] << 8) | data[9];
                    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
                    peer.port = newport;
                    SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                    return;
                }
                sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
                Module["websocket"].emit("message", sock.stream.fd);
            }
            if (ENVIRONMENT_IS_NODE) {
                peer.socket.on("open", handleOpen);
                peer.socket.on("message", function (data, isBinary) {
                    if (!isBinary) {
                        return;
                    }
                    handleMessage(new Uint8Array(data).buffer);
                });
                peer.socket.on("close", function () {
                    Module["websocket"].emit("close", sock.stream.fd);
                });
                peer.socket.on("error", function (error) {
                    sock.error = 14;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
                });
            } else {
                peer.socket.onopen = handleOpen;
                peer.socket.onclose = function () {
                    Module["websocket"].emit("close", sock.stream.fd);
                };
                peer.socket.onmessage = function peer_socket_onmessage(event) {
                    handleMessage(event.data);
                };
                peer.socket.onerror = function (error) {
                    sock.error = 14;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
                };
            }
        },
        poll(sock) {
            if (sock.type === 1 && sock.server) {
                return sock.pending.length ? 64 | 1 : 0;
            }
            var mask = 0;
            var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
            if (sock.recv_queue.length || !dest || (dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
                mask |= 64 | 1;
            }
            if (!dest || (dest && dest.socket.readyState === dest.socket.OPEN)) {
                mask |= 4;
            }
            if ((dest && dest.socket.readyState === dest.socket.CLOSING) || (dest && dest.socket.readyState === dest.socket.CLOSED)) {
                mask |= 16;
            }
            return mask;
        },
        ioctl(sock, request, arg) {
            switch (request) {
                case 21531:
                    var bytes = 0;
                    if (sock.recv_queue.length) {
                        bytes = sock.recv_queue[0].data.length;
                    }
                    HEAP32[arg >> 2] = bytes;
                    return 0;
                default:
                    return 28;
            }
        },
        close(sock) {
            if (sock.server) {
                try {
                    sock.server.close();
                } catch (e) {}
                sock.server = null;
            }
            var peers = Object.keys(sock.peers);
            for (var i = 0; i < peers.length; i++) {
                var peer = sock.peers[peers[i]];
                try {
                    peer.socket.close();
                } catch (e) {}
                SOCKFS.websocket_sock_ops.removePeer(sock, peer);
            }
            return 0;
        },
        bind(sock, addr, port) {
            if (typeof sock.saddr != "undefined" || typeof sock.sport != "undefined") {
                throw new FS.ErrnoError(28);
            }
            sock.saddr = addr;
            sock.sport = port;
            if (sock.type === 2) {
                if (sock.server) {
                    sock.server.close();
                    sock.server = null;
                }
                try {
                    sock.sock_ops.listen(sock, 0);
                } catch (e) {
                    if (!(e.name === "ErrnoError")) throw e;
                    if (e.errno !== 138) throw e;
                }
            }
        },
        connect(sock, addr, port) {
            if (sock.server) {
                throw new FS.ErrnoError(138);
            }
            if (typeof sock.daddr != "undefined" && typeof sock.dport != "undefined") {
                var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                if (dest) {
                    if (dest.socket.readyState === dest.socket.CONNECTING) {
                        throw new FS.ErrnoError(7);
                    } else {
                        throw new FS.ErrnoError(30);
                    }
                }
            }
            var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
            sock.daddr = peer.addr;
            sock.dport = peer.port;
            throw new FS.ErrnoError(26);
        },
        listen(sock, backlog) {
            if (!ENVIRONMENT_IS_NODE) {
                throw new FS.ErrnoError(138);
            }
            if (sock.server) {
                throw new FS.ErrnoError(28);
            }
            var WebSocketServer = require("ws").Server;
            var host = sock.saddr;
            sock.server = new WebSocketServer({ host: host, port: sock.sport });
            Module["websocket"].emit("listen", sock.stream.fd);
            sock.server.on("connection", function (ws) {
                if (sock.type === 1) {
                    var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
                    var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
                    newsock.daddr = peer.addr;
                    newsock.dport = peer.port;
                    sock.pending.push(newsock);
                    Module["websocket"].emit("connection", newsock.stream.fd);
                } else {
                    SOCKFS.websocket_sock_ops.createPeer(sock, ws);
                    Module["websocket"].emit("connection", sock.stream.fd);
                }
            });
            sock.server.on("close", function () {
                Module["websocket"].emit("close", sock.stream.fd);
                sock.server = null;
            });
            sock.server.on("error", function (error) {
                sock.error = 23;
                Module["websocket"].emit("error", [sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable"]);
            });
        },
        accept(listensock) {
            if (!listensock.server || !listensock.pending.length) {
                throw new FS.ErrnoError(28);
            }
            var newsock = listensock.pending.shift();
            newsock.stream.flags = listensock.stream.flags;
            return newsock;
        },
        getname(sock, peer) {
            var addr, port;
            if (peer) {
                if (sock.daddr === undefined || sock.dport === undefined) {
                    throw new FS.ErrnoError(53);
                }
                addr = sock.daddr;
                port = sock.dport;
            } else {
                addr = sock.saddr || 0;
                port = sock.sport || 0;
            }
            return { addr: addr, port: port };
        },
        sendmsg(sock, buffer, offset, length, addr, port) {
            if (sock.type === 2) {
                if (addr === undefined || port === undefined) {
                    addr = sock.daddr;
                    port = sock.dport;
                }
                if (addr === undefined || port === undefined) {
                    throw new FS.ErrnoError(17);
                }
            } else {
                addr = sock.daddr;
                port = sock.dport;
            }
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
            if (sock.type === 1) {
                if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                    throw new FS.ErrnoError(53);
                } else if (dest.socket.readyState === dest.socket.CONNECTING) {
                    throw new FS.ErrnoError(6);
                }
            }
            if (ArrayBuffer.isView(buffer)) {
                offset += buffer.byteOffset;
                buffer = buffer.buffer;
            }
            var data;
            data = buffer.slice(offset, offset + length);
            if (sock.type === 2) {
                if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
                    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
                    }
                    dest.dgram_send_queue.push(data);
                    return length;
                }
            }
            try {
                dest.socket.send(data);
                return length;
            } catch (e) {
                throw new FS.ErrnoError(28);
            }
        },
        recvmsg(sock, length) {
            if (sock.type === 1 && sock.server) {
                throw new FS.ErrnoError(53);
            }
            var queued = sock.recv_queue.shift();
            if (!queued) {
                if (sock.type === 1) {
                    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                    if (!dest) {
                        throw new FS.ErrnoError(53);
                    }
                    if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        return null;
                    }
                    throw new FS.ErrnoError(6);
                }
                throw new FS.ErrnoError(6);
            }
            var queuedLength = queued.data.byteLength || queued.data.length;
            var queuedOffset = queued.data.byteOffset || 0;
            var queuedBuffer = queued.data.buffer || queued.data;
            var bytesRead = Math.min(length, queuedLength);
            var res = { buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead), addr: queued.addr, port: queued.port };
            if (sock.type === 1 && bytesRead < queuedLength) {
                var bytesRemaining = queuedLength - bytesRead;
                queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
                sock.recv_queue.unshift(queued);
            }
            return res;
        },
    },
};
function getSocketFromFD(fd) {
    var socket = SOCKFS.getSocket(fd);
    if (!socket) throw new FS.ErrnoError(8);
    return socket;
}
var setErrNo = (value) => {
    HEAP32[___errno_location() >> 2] = value;
    return value;
};
var inetPton4 = (str) => {
    var b = str.split(".");
    for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
    }
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};
var jstoi_q = (str) => parseInt(str);
var inetPton6 = (str) => {
    var words;
    var w, offset, z;
    var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
    var parts = [];
    if (!valid6regx.test(str)) {
        return null;
    }
    if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (str.startsWith("::")) {
        str = str.replace("::", "Z:");
    } else {
        str = str.replace("::", ":Z:");
    }
    if (str.indexOf(".") > 0) {
        str = str.replace(new RegExp("[.]", "g"), ":");
        words = str.split(":");
        words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
        words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
        words = words.slice(0, words.length - 2);
    } else {
        words = str.split(":");
    }
    offset = 0;
    z = 0;
    for (w = 0; w < words.length; w++) {
        if (typeof words[w] == "string") {
            if (words[w] === "Z") {
                for (z = 0; z < 8 - words.length + 1; z++) {
                    parts[w + z] = 0;
                }
                offset = z - 1;
            } else {
                parts[w + offset] = _htons(parseInt(words[w], 16));
            }
        } else {
            parts[w + offset] = words[w];
        }
    }
    return [(parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6]];
};
var writeSockaddr = (sa, family, addr, port, addrlen) => {
    switch (family) {
        case 2:
            addr = inetPton4(addr);
            zeroMemory(sa, 16);
            if (addrlen) {
                HEAP32[addrlen >> 2] = 16;
            }
            HEAP16[sa >> 1] = family;
            HEAP32[(sa + 4) >> 2] = addr;
            HEAP16[(sa + 2) >> 1] = _htons(port);
            break;
        case 10:
            addr = inetPton6(addr);
            zeroMemory(sa, 28);
            if (addrlen) {
                HEAP32[addrlen >> 2] = 28;
            }
            HEAP32[sa >> 2] = family;
            HEAP32[(sa + 8) >> 2] = addr[0];
            HEAP32[(sa + 12) >> 2] = addr[1];
            HEAP32[(sa + 16) >> 2] = addr[2];
            HEAP32[(sa + 20) >> 2] = addr[3];
            HEAP16[(sa + 2) >> 1] = _htons(port);
            break;
        default:
            return 5;
    }
    return 0;
};
var DNS = {
    address_map: { id: 1, addrs: {}, names: {} },
    lookup_name: (name) => {
        var res = inetPton4(name);
        if (res !== null) {
            return name;
        }
        res = inetPton6(name);
        if (res !== null) {
            return name;
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
            addr = DNS.address_map.addrs[name];
        } else {
            var id = DNS.address_map.id++;
            assert(id < 65535, "exceeded max address mappings of 65535");
            addr = "172.29." + (id & 255) + "." + (id & 65280);
            DNS.address_map.names[addr] = name;
            DNS.address_map.addrs[name] = addr;
        }
        return addr;
    },
    lookup_addr: (addr) => {
        if (DNS.address_map.names[addr]) {
            return DNS.address_map.names[addr];
        }
        return null;
    },
};
function ___syscall_accept4(fd, addr, addrlen, flags, d1, d2) {
    try {
        var sock = getSocketFromFD(fd);
        var newsock = sock.sock_ops.accept(sock);
        if (addr) {
            var errno = writeSockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport, addrlen);
        }
        return newsock.stream.fd;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
var inetNtop4 = (addr) => (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);
var inetNtop6 = (ints) => {
    var str = "";
    var word = 0;
    var longest = 0;
    var lastzero = 0;
    var zstart = 0;
    var len = 0;
    var i = 0;
    var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
    var hasipv4 = true;
    var v4part = "";
    for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) {
            hasipv4 = false;
            break;
        }
    }
    if (hasipv4) {
        v4part = inetNtop4(parts[6] | (parts[7] << 16));
        if (parts[5] === -1) {
            str = "::ffff:";
            str += v4part;
            return str;
        }
        if (parts[5] === 0) {
            str = "::";
            if (v4part === "0.0.0.0") v4part = "";
            if (v4part === "0.0.0.1") v4part = "1";
            str += v4part;
            return str;
        }
    }
    for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
            if (word - lastzero > 1) {
                len = 0;
            }
            lastzero = word;
            len++;
        }
        if (len > longest) {
            longest = len;
            zstart = word - longest + 1;
        }
    }
    for (word = 0; word < 8; word++) {
        if (longest > 1) {
            if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                if (word === zstart) {
                    str += ":";
                    if (zstart === 0) str += ":";
                }
                continue;
            }
        }
        str += Number(_ntohs(parts[word] & 65535)).toString(16);
        str += word < 7 ? ":" : "";
    }
    return str;
};
var readSockaddr = (sa, salen) => {
    var family = HEAP16[sa >> 1];
    var port = _ntohs(HEAPU16[(sa + 2) >> 1]);
    var addr;
    switch (family) {
        case 2:
            if (salen !== 16) {
                return { errno: 28 };
            }
            addr = HEAP32[(sa + 4) >> 2];
            addr = inetNtop4(addr);
            break;
        case 10:
            if (salen !== 28) {
                return { errno: 28 };
            }
            addr = [HEAP32[(sa + 8) >> 2], HEAP32[(sa + 12) >> 2], HEAP32[(sa + 16) >> 2], HEAP32[(sa + 20) >> 2]];
            addr = inetNtop6(addr);
            break;
        default:
            return { errno: 5 };
    }
    return { family: family, addr: addr, port: port };
};
function getSocketAddress(addrp, addrlen, allowNull) {
    if (allowNull && addrp === 0) return null;
    var info = readSockaddr(addrp, addrlen);
    if (info.errno) throw new FS.ErrnoError(info.errno);
    info.addr = DNS.lookup_addr(info.addr) || info.addr;
    return info;
}
function ___syscall_bind(fd, addr, addrlen, d1, d2, d3) {
    try {
        var sock = getSocketFromFD(fd);
        var info = getSocketAddress(addr, addrlen);
        sock.sock_ops.bind(sock, info.addr, info.port);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_chdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chdir(path);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_chmod(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        FS.chmod(path, mode);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_connect(fd, addr, addrlen, d1, d2, d3) {
    try {
        var sock = getSocketFromFD(fd);
        var info = getSocketAddress(addr, addrlen);
        sock.sock_ops.connect(sock, info.addr, info.port);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_faccessat(dirfd, path, amode, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (amode & ~7) {
            return -28;
        }
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node) {
            return -44;
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2;
        }
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_fchmodat(dirfd, path, mode, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        FS.chmod(path, mode);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_fchownat(dirfd, path, owner, group, flags) {
    try {
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        flags = flags & ~256;
        path = SYSCALLS.calculateAt(dirfd, path);
        (nofollow ? FS.lchown : FS.chown)(path, owner, group);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28;
                }
                var newStream;
                newStream = FS.createStream(stream, arg);
                return newStream.fd;
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0;
            }
            case 5: {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[(arg + offset) >> 1] = 2;
                return 0;
            }
            case 6:
            case 7:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                setErrNo(28);
                return -1;
            default: {
                return -28;
            }
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_fstat64(fd, buf) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        return SYSCALLS.doStat(FS.stat, stream.path, buf);
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
function ___syscall_getcwd(buf, size) {
    try {
        if (size === 0) return -28;
        var cwd = FS.cwd();
        var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
        if (size < cwdLengthInBytes) return -68;
        stringToUTF8(cwd, buf, size);
        return cwdLengthInBytes;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
            stream.getdents = FS.readdir(stream.path);
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name === ".") {
                id = stream.node.id;
                type = 4;
            } else if (name === "..") {
                var lookup = FS.lookupPath(stream.path, { parent: true });
                id = lookup.node.id;
                type = 4;
            } else {
                var child = FS.lookupNode(stream.node, name);
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
            }
            (tempI64 = [id >>> 0, ((tempDouble = id), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0)]),
                (HEAP32[(dirp + pos) >> 2] = tempI64[0]),
                (HEAP32[(dirp + pos + 4) >> 2] = tempI64[1]);
            (tempI64 = [
                ((idx + 1) * struct_size) >>> 0,
                ((tempDouble = (idx + 1) * struct_size), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
            ]),
                (HEAP32[(dirp + pos + 8) >> 2] = tempI64[0]),
                (HEAP32[(dirp + pos + 12) >> 2] = tempI64[1]);
            HEAP16[(dirp + pos + 16) >> 1] = 280;
            HEAP8[(dirp + pos + 18) >> 0] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_getsockname(fd, addr, addrlen, d1, d2, d3) {
    try {
        var sock = getSocketFromFD(fd);
        var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport, addrlen);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21505: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                    var termios = stream.tty.ops.ioctl_tcgets(stream);
                    var argp = SYSCALLS.get();
                    HEAP32[argp >> 2] = termios.c_iflag || 0;
                    HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
                    HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
                    HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
                    for (var i = 0; i < 32; i++) {
                        HEAP8[(argp + i + 17) >> 0] = termios.c_cc[i] || 0;
                    }
                    return 0;
                }
                return 0;
            }
            case 21510:
            case 21511:
            case 21512: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                    var argp = SYSCALLS.get();
                    var c_iflag = HEAP32[argp >> 2];
                    var c_oflag = HEAP32[(argp + 4) >> 2];
                    var c_cflag = HEAP32[(argp + 8) >> 2];
                    var c_lflag = HEAP32[(argp + 12) >> 2];
                    var c_cc = [];
                    for (var i = 0; i < 32; i++) {
                        c_cc.push(HEAP8[(argp + i + 17) >> 0]);
                    }
                    return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag: c_iflag, c_oflag: c_oflag, c_cflag: c_cflag, c_lflag: c_lflag, c_cc: c_cc });
                }
                return 0;
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0;
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28;
            }
            case 21531: {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp);
            }
            case 21523: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                    var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                    var argp = SYSCALLS.get();
                    HEAP16[argp >> 1] = winsize[0];
                    HEAP16[(argp + 2) >> 1] = winsize[1];
                }
                return 0;
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0;
            }
            case 21515: {
                if (!stream.tty) return -59;
                return 0;
            }
            default:
                return -28;
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_listen(fd, backlog) {
    try {
        var sock = getSocketFromFD(fd);
        sock.sock_ops.listen(sock, backlog);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf);
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_mkdirat(dirfd, path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_newfstatat(dirfd, path, buf, flags) {
    try {
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        var allowEmpty = flags & 4096;
        flags = flags & ~6400;
        path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
        return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? SYSCALLS.get() : 0;
        return FS.open(path, flags, mode).fd;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
    try {
        var sock = getSocketFromFD(fd);
        var msg = sock.sock_ops.recvmsg(sock, len);
        if (!msg) return 0;
        if (addr) {
            var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
        }
        HEAPU8.set(msg.buffer, buf);
        return msg.buffer.byteLength;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
    try {
        oldpath = SYSCALLS.getStr(oldpath);
        newpath = SYSCALLS.getStr(newpath);
        oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
        newpath = SYSCALLS.calculateAt(newdirfd, newpath);
        FS.rename(oldpath, newpath);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
    try {
        var sock = getSocketFromFD(fd);
        var dest = getSocketAddress(addr, addr_len, true);
        if (!dest) {
            return FS.write(sock.stream, HEAP8, message, length);
        }
        return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port);
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_socket(domain, type, protocol) {
    try {
        var sock = SOCKFS.createSocket(domain, type, protocol);
        return sock.stream.fd;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf);
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_statfs64(path, size, buf) {
    try {
        path = SYSCALLS.getStr(path);
        HEAP32[(buf + 4) >> 2] = 4096;
        HEAP32[(buf + 40) >> 2] = 4096;
        HEAP32[(buf + 8) >> 2] = 1e6;
        HEAP32[(buf + 12) >> 2] = 5e5;
        HEAP32[(buf + 16) >> 2] = 5e5;
        HEAP32[(buf + 20) >> 2] = FS.nextInode;
        HEAP32[(buf + 24) >> 2] = 1e6;
        HEAP32[(buf + 28) >> 2] = 42;
        HEAP32[(buf + 44) >> 2] = 2;
        HEAP32[(buf + 36) >> 2] = 255;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_symlink(target, linkpath) {
    try {
        target = SYSCALLS.getStr(target);
        linkpath = SYSCALLS.getStr(linkpath);
        FS.symlink(target, linkpath);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
function ___syscall_unlinkat(dirfd, path, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (flags === 0) {
            FS.unlink(path);
        } else if (flags === 512) {
            FS.rmdir(path);
        } else {
            abort("Invalid flags passed to unlinkat");
        }
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno;
    }
}
var nowIsMonotonic = true;
var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
var __emscripten_throw_longjmp = () => {
    throw Infinity;
};
function convertI32PairToI53Checked(lo, hi) {
    return (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
}
function __gmtime_js(time_low, time_high, tmPtr) {
    var time = convertI32PairToI53Checked(time_low, time_high);
    var date = new Date(time * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
    HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
    HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
    HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
    HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
    HEAP32[(tmPtr + 28) >> 2] = yday;
}
var __timegm_js = function (tmPtr) {
    var ret = (() => {
        var time = Date.UTC(HEAP32[(tmPtr + 20) >> 2] + 1900, HEAP32[(tmPtr + 16) >> 2], HEAP32[(tmPtr + 12) >> 2], HEAP32[(tmPtr + 8) >> 2], HEAP32[(tmPtr + 4) >> 2], HEAP32[tmPtr >> 2], 0);
        var date = new Date(time);
        HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
        var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
        var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
        HEAP32[(tmPtr + 28) >> 2] = yday;
        return date.getTime() / 1e3;
    })();
    return setTempRet0(((tempDouble = ret), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0)), ret >>> 0;
};
var stringToNewUTF8 = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8(str, ret, size);
    return ret;
};
var __tzset_js = (timezone, daylight, tzname) => {
    var currentYear = new Date().getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = stringToNewUTF8(winterName);
    var summerNamePtr = stringToNewUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAPU32[tzname >> 2] = winterNamePtr;
        HEAPU32[(tzname + 4) >> 2] = summerNamePtr;
    } else {
        HEAPU32[tzname >> 2] = summerNamePtr;
        HEAPU32[(tzname + 4) >> 2] = winterNamePtr;
    }
};
var _abort = () => {
    abort("");
};
function _emscripten_set_main_loop_timing(mode, value) {
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1;
    }
    if (!Browser.mainLoop.running) {
        Browser.mainLoop.running = true;
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
        };
        Browser.mainLoop.method = "timeout";
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "rAF";
    } else if (mode == 2) {
        if (typeof setImmediate == "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = (event) => {
                if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                    event.stopPropagation();
                    setImmediates.shift()();
                }
            };
            addEventListener("message", Browser_setImmediate_messageHandler, true);
            setImmediate = function Browser_emulated_setImmediate(func) {
                setImmediates.push(func);
                if (ENVIRONMENT_IS_WORKER) {
                    if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
                    Module["setImmediates"].push(func);
                    postMessage({ target: emscriptenMainLoopMessageId });
                } else postMessage(emscriptenMainLoopMessageId, "*");
            };
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "immediate";
    }
    return 0;
}
var _emscripten_get_now;
_emscripten_get_now = () => performance.now();
function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = browserIterationFunc;
    Browser.mainLoop.arg = arg;
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    function checkIsRunning() {
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
            return false;
        }
        return true;
    }
    Browser.mainLoop.running = false;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next;
                } else {
                    next = next + 0.5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
                }
            }
            out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
            Browser.mainLoop.updateStatus();
            if (!checkIsRunning()) return;
            setTimeout(Browser.mainLoop.runner, 0);
            return;
        }
        if (!checkIsRunning()) return;
        Browser.mainLoop.currentFrameNumber = (Browser.mainLoop.currentFrameNumber + 1) | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return;
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (!checkIsRunning()) return;
        if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler();
    };
    if (!noSetTiming) {
        if (fps && fps > 0) {
            _emscripten_set_main_loop_timing(0, 1e3 / fps);
        } else {
            _emscripten_set_main_loop_timing(1, 1);
        }
        Browser.mainLoop.scheduler();
    }
    if (simulateInfiniteLoop) {
        throw "unwind";
    }
}
var handleException = (e) => {
    if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS;
    }
    quit_(1, e);
};
var _proc_exit = (code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        if (Module["onExit"]) Module["onExit"](code);
        ABORT = true;
    }
    quit_(code, new ExitStatus(code));
};
var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
};
var _exit = exitJS;
var maybeExit = () => {
    if (!keepRuntimeAlive()) {
        try {
            _exit(EXITSTATUS);
        } catch (e) {
            handleException(e);
        }
    }
};
var callUserCallback = (func) => {
    if (ABORT) {
        return;
    }
    try {
        func();
        maybeExit();
    } catch (e) {
        handleException(e);
    }
};
var safeSetTimeout = (func, timeout) =>
    setTimeout(() => {
        callUserCallback(func);
    }, timeout);
var warnOnce = (text) => {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
        err(text);
    }
};
var Browser = {
    mainLoop: {
        running: false,
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function () {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++;
        },
        resume: function () {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler();
        },
        updateStatus: function () {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
                    } else {
                        Module["setStatus"](message);
                    }
                } else {
                    Module["setStatus"]("");
                }
            }
        },
        runIter: function (func) {
            if (ABORT) return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return;
                }
            }
            callUserCallback(func);
            if (Module["postMainLoop"]) Module["postMainLoop"]();
        },
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init: function () {
        if (Browser.initted) return;
        Browser.initted = true;
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            if (b.size !== byteArray.length) {
                b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
            }
            var url = URL.createObjectURL(b);
            var img = new Image();
            img.onload = () => {
                assert(img.complete, "Image " + name + " could not be decoded");
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                preloadedImages[name] = canvas;
                URL.revokeObjectURL(url);
                if (onload) onload(byteArray);
            };
            img.onerror = (event) => {
                out("Image " + url + " could not be decoded");
                if (onerror) onerror();
            };
            img.src = url;
        };
        preloadPlugins.push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return !Module.noAudioDecoding && name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 };
        };
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done) return;
                done = true;
                preloadedAudios[name] = audio;
                if (onload) onload(byteArray);
            }
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            var url = URL.createObjectURL(b);
            var audio = new Audio();
            audio.addEventListener("canplaythrough", () => finish(audio), false);
            audio.onerror = function audio_onerror(event) {
                if (done) return;
                err("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
                function encode64(data) {
                    var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                    var PAD = "=";
                    var ret = "";
                    var leftchar = 0;
                    var leftbits = 0;
                    for (var i = 0; i < data.length; i++) {
                        leftchar = (leftchar << 8) | data[i];
                        leftbits += 8;
                        while (leftbits >= 6) {
                            var curr = (leftchar >> (leftbits - 6)) & 63;
                            leftbits -= 6;
                            ret += BASE[curr];
                        }
                    }
                    if (leftbits == 2) {
                        ret += BASE[(leftchar & 3) << 4];
                        ret += PAD + PAD;
                    } else if (leftbits == 4) {
                        ret += BASE[(leftchar & 15) << 2];
                        ret += PAD;
                    }
                    return ret;
                }
                audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                finish(audio);
            };
            audio.src = url;
            safeSetTimeout(() => {
                finish(audio);
            }, 1e4);
        };
        preloadPlugins.push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock =
                document["pointerLockElement"] === Module["canvas"] ||
                document["mozPointerLockElement"] === Module["canvas"] ||
                document["webkitPointerLockElement"] === Module["canvas"] ||
                document["msPointerLockElement"] === Module["canvas"];
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener(
                    "click",
                    (ev) => {
                        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                            Module["canvas"].requestPointerLock();
                            ev.preventDefault();
                        }
                    },
                    false
                );
            }
        }
    },
    createContext: function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = { antialias: false, alpha: false, majorVersion: 1 };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute];
                }
            }
            if (typeof GL != "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx;
                }
            }
        } else {
            ctx = canvas.getContext("2d");
        }
        if (!ctx) return null;
        if (setInModule) {
            if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL) GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
            Browser.init();
        }
        return ctx;
    },
    destroyContext: function (canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen: function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer) canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize();
                } else {
                    Browser.updateCanvasDimensions(canvas);
                }
            }
            if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false);
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen =
            canvasContainer["requestFullscreen"] ||
            canvasContainer["mozRequestFullScreen"] ||
            canvasContainer["msRequestFullscreen"] ||
            (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) ||
            (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
        canvasContainer.requestFullscreen();
    },
    exitFullscreen: function () {
        if (!Browser.isFullscreen) {
            return false;
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
        CFS.apply(document, []);
        return true;
    },
    nextRAF: 0,
    fakeRequestAnimationFrame: function (func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60;
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60;
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
    },
    requestAnimationFrame: function (func) {
        if (typeof requestAnimationFrame == "function") {
            requestAnimationFrame(func);
            return;
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func);
    },
    safeSetTimeout: function (func, timeout) {
        return safeSetTimeout(func, timeout);
    },
    safeRequestAnimationFrame: function (func) {
        return Browser.requestAnimationFrame(() => {
            callUserCallback(func);
        });
    },
    getMimetype: function (name) {
        return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", bmp: "image/bmp", ogg: "audio/ogg", wav: "audio/wav", mp3: "audio/mpeg" }[name.substr(name.lastIndexOf(".") + 1)];
    },
    getUserMedia: function (func) {
        if (!window.getUserMedia) {
            window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        }
        window.getUserMedia(func);
    },
    getMovementX: function (event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
    },
    getMovementY: function (event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
    },
    getMouseWheelDelta: function (event) {
        var delta = 0;
        switch (event.type) {
            case "DOMMouseScroll":
                delta = event.detail / 3;
                break;
            case "mousewheel":
                delta = event.wheelDelta / 120;
                break;
            case "wheel":
                delta = event.deltaY;
                switch (event.deltaMode) {
                    case 0:
                        delta /= 100;
                        break;
                    case 1:
                        delta /= 3;
                        break;
                    case 2:
                        delta *= 80;
                        break;
                    default:
                        throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
                }
                break;
            default:
                throw "unrecognized mouse wheel event: " + event.type;
        }
        return delta;
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseEvent: function (event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX" in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0;
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event);
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY;
            }
        } else {
            var rect = Module["canvas"].getBoundingClientRect();
            var cw = Module["canvas"].width;
            var ch = Module["canvas"].height;
            var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
            var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return;
                }
                var adjustedX = touch.pageX - (scrollX + rect.left);
                var adjustedY = touch.pageY - (scrollY + rect.top);
                adjustedX = adjustedX * (cw / rect.width);
                adjustedY = adjustedY * (ch / rect.height);
                var coords = { x: adjustedX, y: adjustedY };
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords;
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    if (!last) last = coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords;
                }
                return;
            }
            var x = event.pageX - (scrollX + rect.left);
            var y = event.pageY - (scrollY + rect.top);
            x = x * (cw / rect.width);
            y = y * (ch / rect.height);
            Browser.mouseMovementX = x - Browser.mouseX;
            Browser.mouseMovementY = y - Browser.mouseY;
            Browser.mouseX = x;
            Browser.mouseY = y;
        }
    },
    resizeListeners: [],
    updateResizeListeners: function () {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach((listener) => listener(canvas.width, canvas.height));
    },
    setCanvasSize: function (width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize: function () {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
    },
    setWindowedCanvasSize: function () {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
    },
    updateCanvasDimensions: function (canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative;
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"]);
            } else {
                h = Math.round(w / Module["forcedAspectRatio"]);
            }
        }
        if (
            (document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode &&
            typeof screen != "undefined"
        ) {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w) canvas.width = w;
            if (canvas.height != h) canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height");
            }
        } else {
            if (canvas.width != wNative) canvas.width = wNative;
            if (canvas.height != hNative) canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important");
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height");
                }
            }
        }
    },
};
var EGL = {
    errorCode: 12288,
    defaultDisplayInitialized: false,
    currentContext: 0,
    currentReadSurface: 0,
    currentDrawSurface: 0,
    contextAttributes: { alpha: false, depth: false, stencil: false, antialias: false },
    stringCache: {},
    setErrorCode: function (code) {
        EGL.errorCode = code;
    },
    chooseConfig: function (display, attribList, config, config_size, numConfigs) {
        if (display != 62e3) {
            EGL.setErrorCode(12296);
            return 0;
        }
        if (attribList) {
            for (;;) {
                var param = HEAP32[attribList >> 2];
                if (param == 12321) {
                    var alphaSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.alpha = alphaSize > 0;
                } else if (param == 12325) {
                    var depthSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.depth = depthSize > 0;
                } else if (param == 12326) {
                    var stencilSize = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.stencil = stencilSize > 0;
                } else if (param == 12337) {
                    var samples = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.antialias = samples > 0;
                } else if (param == 12338) {
                    var samples = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.antialias = samples == 1;
                } else if (param == 12544) {
                    var requestedPriority = HEAP32[(attribList + 4) >> 2];
                    EGL.contextAttributes.lowLatency = requestedPriority != 12547;
                } else if (param == 12344) {
                    break;
                }
                attribList += 8;
            }
        }
        if ((!config || !config_size) && !numConfigs) {
            EGL.setErrorCode(12300);
            return 0;
        }
        if (numConfigs) {
            HEAP32[numConfigs >> 2] = 1;
        }
        if (config && config_size > 0) {
            HEAP32[config >> 2] = 62002;
        }
        EGL.setErrorCode(12288);
        return 1;
    },
};
function _eglBindAPI(api) {
    if (api == 12448) {
        EGL.setErrorCode(12288);
        return 1;
    }
    EGL.setErrorCode(12300);
    return 0;
}
function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
    return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs);
}
function webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function (index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor);
        };
        ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        };
        ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        };
        return 1;
    }
}
function webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function () {
            return ext["createVertexArrayOES"]();
        };
        ctx["deleteVertexArray"] = function (vao) {
            ext["deleteVertexArrayOES"](vao);
        };
        ctx["bindVertexArray"] = function (vao) {
            ext["bindVertexArrayOES"](vao);
        };
        ctx["isVertexArray"] = function (vao) {
            return ext["isVertexArrayOES"](vao);
        };
        return 1;
    }
}
function webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function (n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs);
        };
        return 1;
    }
}
function webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
}
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    stringCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode;
        }
    },
    getNewId: function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null;
        }
        return ret;
    },
    getSource: function (shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
            source += UTF8ToString(HEAP32[(string + i * 4) >> 2], len < 0 ? undefined : len);
        }
        return source;
    },
    createContext: function (canvas, webGLContextAttributes) {
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;
            function fixedGetContext(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return (ver == "webgl") == gl instanceof WebGLRenderingContext ? gl : null;
            }
            canvas.getContext = fixedGetContext;
        }
        var ctx = canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
    },
    registerContext: function (ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = { handle: handle, attributes: webGLContextAttributes, version: webGLContextAttributes.majorVersion, GLctx: ctx };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context);
        }
        return handle;
    },
    makeContextCurrent: function (contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx);
    },
    getContext: function (contextHandle) {
        return GL.contexts[contextHandle];
    },
    deleteContext: function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents == "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        GL.contexts[contextHandle] = null;
    },
    initExtensions: function (context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        {
            GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        }
        webgl_enable_WEBGL_multi_draw(GLctx);
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
            if (!ext.includes("lose_context") && !ext.includes("debug")) {
                GLctx.getExtension(ext);
            }
        });
    },
};
function _eglCreateContext(display, config, hmm, contextAttribs) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    var glesContextVersion = 1;
    for (;;) {
        var param = HEAP32[contextAttribs >> 2];
        if (param == 12440) {
            glesContextVersion = HEAP32[(contextAttribs + 4) >> 2];
        } else if (param == 12344) {
            break;
        } else {
            EGL.setErrorCode(12292);
            return 0;
        }
        contextAttribs += 8;
    }
    if (glesContextVersion != 2) {
        EGL.setErrorCode(12293);
        return 0;
    }
    EGL.contextAttributes.majorVersion = glesContextVersion - 1;
    EGL.contextAttributes.minorVersion = 0;
    EGL.context = GL.createContext(Module["canvas"], EGL.contextAttributes);
    if (EGL.context != 0) {
        EGL.setErrorCode(12288);
        GL.makeContextCurrent(EGL.context);
        Module.useWebGL = true;
        Browser.moduleContextCreatedCallbacks.forEach(function (callback) {
            callback();
        });
        GL.makeContextCurrent(null);
        return 62004;
    } else {
        EGL.setErrorCode(12297);
        return 0;
    }
}
function _eglCreateWindowSurface(display, config, win, attrib_list) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0;
    }
    EGL.setErrorCode(12288);
    return 62006;
}
function _eglDestroyContext(display, context) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (context != 62004) {
        EGL.setErrorCode(12294);
        return 0;
    }
    GL.deleteContext(EGL.context);
    EGL.setErrorCode(12288);
    if (EGL.currentContext == context) {
        EGL.currentContext = 0;
    }
    return 1;
}
function _eglDestroySurface(display, surface) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (surface != 62006) {
        EGL.setErrorCode(12301);
        return 1;
    }
    if (EGL.currentReadSurface == surface) {
        EGL.currentReadSurface = 0;
    }
    if (EGL.currentDrawSurface == surface) {
        EGL.currentDrawSurface = 0;
    }
    EGL.setErrorCode(12288);
    return 1;
}
function _eglGetConfigAttrib(display, config, attribute, value) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (config != 62002) {
        EGL.setErrorCode(12293);
        return 0;
    }
    if (!value) {
        EGL.setErrorCode(12300);
        return 0;
    }
    EGL.setErrorCode(12288);
    switch (attribute) {
        case 12320:
            HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 32 : 24;
            return 1;
        case 12321:
            HEAP32[value >> 2] = EGL.contextAttributes.alpha ? 8 : 0;
            return 1;
        case 12322:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12323:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12324:
            HEAP32[value >> 2] = 8;
            return 1;
        case 12325:
            HEAP32[value >> 2] = EGL.contextAttributes.depth ? 24 : 0;
            return 1;
        case 12326:
            HEAP32[value >> 2] = EGL.contextAttributes.stencil ? 8 : 0;
            return 1;
        case 12327:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12328:
            HEAP32[value >> 2] = 62002;
            return 1;
        case 12329:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12330:
            HEAP32[value >> 2] = 4096;
            return 1;
        case 12331:
            HEAP32[value >> 2] = 16777216;
            return 1;
        case 12332:
            HEAP32[value >> 2] = 4096;
            return 1;
        case 12333:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12334:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12335:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12337:
            HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 4 : 0;
            return 1;
        case 12338:
            HEAP32[value >> 2] = EGL.contextAttributes.antialias ? 1 : 0;
            return 1;
        case 12339:
            HEAP32[value >> 2] = 4;
            return 1;
        case 12340:
            HEAP32[value >> 2] = 12344;
            return 1;
        case 12341:
        case 12342:
        case 12343:
            HEAP32[value >> 2] = -1;
            return 1;
        case 12345:
        case 12346:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12347:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12348:
            HEAP32[value >> 2] = 1;
            return 1;
        case 12349:
        case 12350:
            HEAP32[value >> 2] = 0;
            return 1;
        case 12351:
            HEAP32[value >> 2] = 12430;
            return 1;
        case 12352:
            HEAP32[value >> 2] = 4;
            return 1;
        case 12354:
            HEAP32[value >> 2] = 0;
            return 1;
        default:
            EGL.setErrorCode(12292);
            return 0;
    }
}
function _eglGetDisplay(nativeDisplayType) {
    EGL.setErrorCode(12288);
    return 62e3;
}
function _eglGetError() {
    return EGL.errorCode;
}
function _eglInitialize(display, majorVersion, minorVersion) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (majorVersion) {
        HEAP32[majorVersion >> 2] = 1;
    }
    if (minorVersion) {
        HEAP32[minorVersion >> 2] = 4;
    }
    EGL.defaultDisplayInitialized = true;
    EGL.setErrorCode(12288);
    return 1;
}
function _eglMakeCurrent(display, draw, read, context) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (context != 0 && context != 62004) {
        EGL.setErrorCode(12294);
        return 0;
    }
    if ((read != 0 && read != 62006) || (draw != 0 && draw != 62006)) {
        EGL.setErrorCode(12301);
        return 0;
    }
    GL.makeContextCurrent(context ? EGL.context : null);
    EGL.currentContext = context;
    EGL.currentDrawSurface = draw;
    EGL.currentReadSurface = read;
    EGL.setErrorCode(12288);
    return 1;
}
function _eglQueryString(display, name) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    EGL.setErrorCode(12288);
    if (EGL.stringCache[name]) return EGL.stringCache[name];
    var ret;
    switch (name) {
        case 12371:
            ret = stringToNewUTF8("Emscripten");
            break;
        case 12372:
            ret = stringToNewUTF8("1.4 Emscripten EGL");
            break;
        case 12373:
            ret = stringToNewUTF8("");
            break;
        case 12429:
            ret = stringToNewUTF8("OpenGL_ES");
            break;
        default:
            EGL.setErrorCode(12300);
            return 0;
    }
    EGL.stringCache[name] = ret;
    return ret;
}
function _eglSwapBuffers(dpy, surface) {
    if (!EGL.defaultDisplayInitialized) {
        EGL.setErrorCode(12289);
    } else if (!Module.ctx) {
        EGL.setErrorCode(12290);
    } else if (Module.ctx.isContextLost()) {
        EGL.setErrorCode(12302);
    } else {
        EGL.setErrorCode(12288);
        return 1;
    }
    return 0;
}
function _eglSwapInterval(display, interval) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
    else _emscripten_set_main_loop_timing(1, interval);
    EGL.setErrorCode(12288);
    return 1;
}
function _eglTerminate(display) {
    if (display != 62e3) {
        EGL.setErrorCode(12296);
        return 0;
    }
    EGL.currentContext = 0;
    EGL.currentReadSurface = 0;
    EGL.currentDrawSurface = 0;
    EGL.defaultDisplayInitialized = false;
    EGL.setErrorCode(12288);
    return 1;
}
function _eglWaitClient() {
    EGL.setErrorCode(12288);
    return 1;
}
var _eglWaitGL = _eglWaitClient;
function _eglWaitNative(nativeEngineId) {
    EGL.setErrorCode(12288);
    return 1;
}
var readEmAsmArgsArray = [];
var readEmAsmArgs = (sigPtr, buf) => {
    readEmAsmArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while ((ch = HEAPU8[sigPtr++])) {
        buf += (ch != 105) & buf;
        readEmAsmArgsArray.push(ch == 105 ? HEAP32[buf] : HEAPF64[buf++ >> 1]);
        ++buf;
    }
    return readEmAsmArgsArray;
};
var runEmAsmFunction = (code, sigPtr, argbuf) => {
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args);
};
var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
var runMainThreadEmAsm = (code, sigPtr, argbuf, sync) => {
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args);
};
var _emscripten_asm_const_int_sync_on_main_thread = (code, sigPtr, argbuf) => runMainThreadEmAsm(code, sigPtr, argbuf, 1);
function _emscripten_date_now() {
    return Date.now();
}
var withStackSave = (f) => {
    var stack = stackSave();
    var ret = f();
    stackRestore(stack);
    return ret;
};
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners: function () {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
    },
    registerRemoveEventListeners: function () {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true;
        }
    },
    deferredCalls: [],
    deferCall: function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false;
            }
            return true;
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return;
            }
        }
        JSEvents.deferredCalls.push({ targetFunction: targetFunction, precedence: precedence, argsList: argsList });
        JSEvents.deferredCalls.sort(function (x, y) {
            return x.precedence < y.precedence;
        });
    },
    removeDeferredCalls: function (targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i;
            }
        }
    },
    canPerformEventHandlerRequests: function () {
        if (navigator.userActivation) {
            return navigator.userActivation.isActive;
        }
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
    },
    runDeferredCalls: function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return;
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList);
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: function (target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--);
            }
        }
    },
    _removeHandler: function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
    },
    registerOrRemoveHandler: function (eventHandler) {
        if (!eventHandler.target) {
            return -4;
        }
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler;
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners();
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--);
                }
            }
        }
        return 0;
    },
    getNodeNameForTarget: function (target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : "";
    },
    fullscreenEnabled: function () {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled;
    },
};
var currentFullscreenStrategy = {};
function maybeCStringToJsString(cString) {
    return cString > 2 ? UTF8ToString(cString) : cString;
}
var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
function findEventTarget(target) {
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
    return domElement;
}
function findCanvasEventTarget(target) {
    return findEventTarget(target);
}
function _emscripten_get_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    HEAP32[width >> 2] = canvas.width;
    HEAP32[height >> 2] = canvas.height;
}
var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
};
var getCanvasElementSize = (target) =>
    withStackSave(() => {
        var w = stackAlloc(8);
        var h = w + 4;
        var targetInt = stringToUTF8OnStack(target.id);
        var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
        var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
        return size;
    });
function _emscripten_set_canvas_element_size(target, width, height) {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    canvas.width = width;
    canvas.height = height;
    return 0;
}
function setCanvasElementSize(target, width, height) {
    if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
    } else {
        withStackSave(function () {
            var targetInt = stringToUTF8OnStack(target.id);
            _emscripten_set_canvas_element_size(targetInt, width, height);
        });
    }
}
function registerRestoreOldStyle(canvas) {
    var canvasSize = getCanvasElementSize(canvas);
    var oldWidth = canvasSize[0];
    var oldHeight = canvasSize[1];
    var oldCssWidth = canvas.style.width;
    var oldCssHeight = canvas.style.height;
    var oldBackgroundColor = canvas.style.backgroundColor;
    var oldDocumentBackgroundColor = document.body.style.backgroundColor;
    var oldPaddingLeft = canvas.style.paddingLeft;
    var oldPaddingRight = canvas.style.paddingRight;
    var oldPaddingTop = canvas.style.paddingTop;
    var oldPaddingBottom = canvas.style.paddingBottom;
    var oldMarginLeft = canvas.style.marginLeft;
    var oldMarginRight = canvas.style.marginRight;
    var oldMarginTop = canvas.style.marginTop;
    var oldMarginBottom = canvas.style.marginBottom;
    var oldDocumentBodyMargin = document.body.style.margin;
    var oldDocumentOverflow = document.documentElement.style.overflow;
    var oldDocumentScroll = document.body.scroll;
    var oldImageRendering = canvas.style.imageRendering;
    function restoreOldStyle() {
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fullscreenElement) {
            document.removeEventListener("fullscreenchange", restoreOldStyle);
            document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
            setCanvasElementSize(canvas, oldWidth, oldHeight);
            canvas.style.width = oldCssWidth;
            canvas.style.height = oldCssHeight;
            canvas.style.backgroundColor = oldBackgroundColor;
            if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
            document.body.style.backgroundColor = oldDocumentBackgroundColor;
            canvas.style.paddingLeft = oldPaddingLeft;
            canvas.style.paddingRight = oldPaddingRight;
            canvas.style.paddingTop = oldPaddingTop;
            canvas.style.paddingBottom = oldPaddingBottom;
            canvas.style.marginLeft = oldMarginLeft;
            canvas.style.marginRight = oldMarginRight;
            canvas.style.marginTop = oldMarginTop;
            canvas.style.marginBottom = oldMarginBottom;
            document.body.style.margin = oldDocumentBodyMargin;
            document.documentElement.style.overflow = oldDocumentOverflow;
            document.body.scroll = oldDocumentScroll;
            canvas.style.imageRendering = oldImageRendering;
            if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
            if (currentFullscreenStrategy.canvasResizedCallback) {
                getWasmTableEntry(currentFullscreenStrategy.canvasResizedCallback)(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
            }
        }
    }
    document.addEventListener("fullscreenchange", restoreOldStyle);
    document.addEventListener("webkitfullscreenchange", restoreOldStyle);
    return restoreOldStyle;
}
function setLetterbox(element, topBottom, leftRight) {
    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
    element.style.paddingTop = element.style.paddingBottom = topBottom + "px";
}
function getBoundingClientRect(e) {
    return specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : { left: 0, top: 0 };
}
function JSEvents_resizeCanvasForFullscreen(target, strategy) {
    var restoreOldStyle = registerRestoreOldStyle(target);
    var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
    var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
    var rect = getBoundingClientRect(target);
    var windowedCssWidth = rect.width;
    var windowedCssHeight = rect.height;
    var canvasSize = getCanvasElementSize(target);
    var windowedRttWidth = canvasSize[0];
    var windowedRttHeight = canvasSize[1];
    if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
    } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
            var desiredCssHeight = (windowedRttHeight * cssWidth) / windowedRttWidth;
            setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight;
        } else {
            var desiredCssWidth = (windowedRttWidth * cssHeight) / windowedRttHeight;
            setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth;
        }
    }
    if (!target.style.backgroundColor) target.style.backgroundColor = "black";
    if (!document.body.style.backgroundColor) document.body.style.backgroundColor = "black";
    target.style.width = cssWidth + "px";
    target.style.height = cssHeight + "px";
    if (strategy.filteringMode == 1) {
        target.style.imageRendering = "optimizeSpeed";
        target.style.imageRendering = "-moz-crisp-edges";
        target.style.imageRendering = "-o-crisp-edges";
        target.style.imageRendering = "-webkit-optimize-contrast";
        target.style.imageRendering = "optimize-contrast";
        target.style.imageRendering = "crisp-edges";
        target.style.imageRendering = "pixelated";
    }
    var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
    if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale) | 0;
        var newHeight = (cssHeight * dpiScale) | 0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
    }
    return restoreOldStyle;
}
function JSEvents_requestFullscreen(target, strategy) {
    if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy);
    }
    if (target.requestFullscreen) {
        target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
    }
    currentFullscreenStrategy = strategy;
    if (strategy.canvasResizedCallback) {
        getWasmTableEntry(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData);
    }
    return 0;
}
function _emscripten_exit_fullscreen() {
    if (!JSEvents.fullscreenEnabled()) return -1;
    JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
    var d = specialHTMLTargets[1];
    if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
    } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen();
    } else {
        return -1;
    }
    return 0;
}
function requestPointerLock(target) {
    if (target.requestPointerLock) {
        target.requestPointerLock();
    } else {
        if (document.body.requestPointerLock) {
            return -3;
        }
        return -1;
    }
    return 0;
}
function _emscripten_exit_pointerlock() {
    JSEvents.removeDeferredCalls(requestPointerLock);
    if (document.exitPointerLock) {
        document.exitPointerLock();
    } else {
        return -1;
    }
    return 0;
}
function _emscripten_get_device_pixel_ratio() {
    return (typeof devicePixelRatio == "number" && devicePixelRatio) || 1;
}
function _emscripten_get_element_css_size(target, width, height) {
    target = findEventTarget(target);
    if (!target) return -4;
    var rect = getBoundingClientRect(target);
    HEAPF64[width >> 3] = rect.width;
    HEAPF64[height >> 3] = rect.height;
    return 0;
}
function fillGamepadEventData(eventStruct, e) {
    HEAPF64[eventStruct >> 3] = e.timestamp;
    for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(eventStruct + i * 8 + 16) >> 3] = e.axes[i];
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == "object") {
            HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i].value;
        } else {
            HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i];
        }
    }
    for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == "object") {
            HEAP32[(eventStruct + i * 4 + 1040) >> 2] = e.buttons[i].pressed;
        } else {
            HEAP32[(eventStruct + i * 4 + 1040) >> 2] = e.buttons[i] == 1;
        }
    }
    HEAP32[(eventStruct + 1296) >> 2] = e.connected;
    HEAP32[(eventStruct + 1300) >> 2] = e.index;
    HEAP32[(eventStruct + 8) >> 2] = e.axes.length;
    HEAP32[(eventStruct + 12) >> 2] = e.buttons.length;
    stringToUTF8(e.id, eventStruct + 1304, 64);
    stringToUTF8(e.mapping, eventStruct + 1368, 64);
}
function _emscripten_get_gamepad_status(index, gamepadState) {
    if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
    if (!JSEvents.lastGamepadState[index]) return -7;
    fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
    return 0;
}
function _emscripten_get_num_gamepads() {
    return JSEvents.lastGamepadState.length;
}
function _emscripten_get_screen_size(width, height) {
    HEAP32[width >> 2] = screen.width;
    HEAP32[height >> 2] = screen.height;
}
function _glActiveTexture(x0) {
    GLctx.activeTexture(x0);
}
var _emscripten_glActiveTexture = _glActiveTexture;
function _glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}
var _emscripten_glAttachShader = _glAttachShader;
function _glBeginQueryEXT(target, id) {
    GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id]);
}
var _emscripten_glBeginQueryEXT = _glBeginQueryEXT;
function _glBindAttribLocation(program, index, name) {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
}
var _emscripten_glBindAttribLocation = _glBindAttribLocation;
function _glBindBuffer(target, buffer) {
    GLctx.bindBuffer(target, GL.buffers[buffer]);
}
var _emscripten_glBindBuffer = _glBindBuffer;
function _glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
}
var _emscripten_glBindFramebuffer = _glBindFramebuffer;
function _glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
}
var _emscripten_glBindRenderbuffer = _glBindRenderbuffer;
function _glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture]);
}
var _emscripten_glBindTexture = _glBindTexture;
function _glBindVertexArray(vao) {
    GLctx.bindVertexArray(GL.vaos[vao]);
}
var _glBindVertexArrayOES = _glBindVertexArray;
var _emscripten_glBindVertexArrayOES = _glBindVertexArrayOES;
function _glBlendColor(x0, x1, x2, x3) {
    GLctx.blendColor(x0, x1, x2, x3);
}
var _emscripten_glBlendColor = _glBlendColor;
function _glBlendEquation(x0) {
    GLctx.blendEquation(x0);
}
var _emscripten_glBlendEquation = _glBlendEquation;
function _glBlendEquationSeparate(x0, x1) {
    GLctx.blendEquationSeparate(x0, x1);
}
var _emscripten_glBlendEquationSeparate = _glBlendEquationSeparate;
function _glBlendFunc(x0, x1) {
    GLctx.blendFunc(x0, x1);
}
var _emscripten_glBlendFunc = _glBlendFunc;
function _glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx.blendFuncSeparate(x0, x1, x2, x3);
}
var _emscripten_glBlendFuncSeparate = _glBlendFuncSeparate;
function _glBufferData(target, size, data, usage) {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
}
var _emscripten_glBufferData = _glBufferData;
function _glBufferSubData(target, offset, size, data) {
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
}
var _emscripten_glBufferSubData = _glBufferSubData;
function _glCheckFramebufferStatus(x0) {
    return GLctx.checkFramebufferStatus(x0);
}
var _emscripten_glCheckFramebufferStatus = _glCheckFramebufferStatus;
function _glClear(x0) {
    GLctx.clear(x0);
}
var _emscripten_glClear = _glClear;
function _glClearColor(x0, x1, x2, x3) {
    GLctx.clearColor(x0, x1, x2, x3);
}
var _emscripten_glClearColor = _glClearColor;
function _glClearDepthf(x0) {
    GLctx.clearDepth(x0);
}
var _emscripten_glClearDepthf = _glClearDepthf;
function _glClearStencil(x0) {
    GLctx.clearStencil(x0);
}
var _emscripten_glClearStencil = _glClearStencil;
function _glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
}
var _emscripten_glColorMask = _glColorMask;
function _glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader]);
}
var _emscripten_glCompileShader = _glCompileShader;
function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null);
}
var _emscripten_glCompressedTexImage2D = _glCompressedTexImage2D;
function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null);
}
var _emscripten_glCompressedTexSubImage2D = _glCompressedTexSubImage2D;
function _glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
}
var _emscripten_glCopyTexImage2D = _glCopyTexImage2D;
function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
}
var _emscripten_glCopyTexSubImage2D = _glCopyTexSubImage2D;
function _glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id;
}
var _emscripten_glCreateProgram = _glCreateProgram;
function _glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id;
}
var _emscripten_glCreateShader = _glCreateShader;
function _glCullFace(x0) {
    GLctx.cullFace(x0);
}
var _emscripten_glCullFace = _glCullFace;
function _glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(buffers + i * 4) >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
    }
}
var _emscripten_glDeleteBuffers = _glDeleteBuffers;
function _glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[(framebuffers + i * 4) >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
    }
}
var _emscripten_glDeleteFramebuffers = _glDeleteFramebuffers;
function _glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
}
var _emscripten_glDeleteProgram = _glDeleteProgram;
function _glDeleteQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(ids + i * 4) >> 2];
        var query = GL.queries[id];
        if (!query) continue;
        GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
        GL.queries[id] = null;
    }
}
var _emscripten_glDeleteQueriesEXT = _glDeleteQueriesEXT;
function _glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(renderbuffers + i * 4) >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
    }
}
var _emscripten_glDeleteRenderbuffers = _glDeleteRenderbuffers;
function _glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return;
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null;
}
var _emscripten_glDeleteShader = _glDeleteShader;
function _glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(textures + i * 4) >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
    }
}
var _emscripten_glDeleteTextures = _glDeleteTextures;
function _glDeleteVertexArrays(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >> 2];
        GLctx.deleteVertexArray(GL.vaos[id]);
        GL.vaos[id] = null;
    }
}
var _glDeleteVertexArraysOES = _glDeleteVertexArrays;
var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArraysOES;
function _glDepthFunc(x0) {
    GLctx.depthFunc(x0);
}
var _emscripten_glDepthFunc = _glDepthFunc;
function _glDepthMask(flag) {
    GLctx.depthMask(!!flag);
}
var _emscripten_glDepthMask = _glDepthMask;
function _glDepthRangef(x0, x1) {
    GLctx.depthRange(x0, x1);
}
var _emscripten_glDepthRangef = _glDepthRangef;
function _glDetachShader(program, shader) {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
}
var _emscripten_glDetachShader = _glDetachShader;
function _glDisable(x0) {
    GLctx.disable(x0);
}
var _emscripten_glDisable = _glDisable;
function _glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index);
}
var _emscripten_glDisableVertexAttribArray = _glDisableVertexAttribArray;
function _glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count);
}
var _emscripten_glDrawArrays = _glDrawArrays;
function _glDrawArraysInstanced(mode, first, count, primcount) {
    GLctx.drawArraysInstanced(mode, first, count, primcount);
}
var _glDrawArraysInstancedANGLE = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstancedANGLE;
var tempFixedLengthArray = [];
function _glDrawBuffers(n, bufs) {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
    }
    GLctx.drawBuffers(bufArray);
}
var _glDrawBuffersWEBGL = _glDrawBuffers;
var _emscripten_glDrawBuffersWEBGL = _glDrawBuffersWEBGL;
function _glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices);
}
var _emscripten_glDrawElements = _glDrawElements;
function _glDrawElementsInstanced(mode, count, type, indices, primcount) {
    GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
}
var _glDrawElementsInstancedANGLE = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstancedANGLE;
function _glEnable(x0) {
    GLctx.enable(x0);
}
var _emscripten_glEnable = _glEnable;
function _glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index);
}
var _emscripten_glEnableVertexAttribArray = _glEnableVertexAttribArray;
function _glEndQueryEXT(target) {
    GLctx.disjointTimerQueryExt["endQueryEXT"](target);
}
var _emscripten_glEndQueryEXT = _glEndQueryEXT;
function _glFinish() {
    GLctx.finish();
}
var _emscripten_glFinish = _glFinish;
function _glFlush() {
    GLctx.flush();
}
var _emscripten_glFlush = _glFlush;
function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
}
var _emscripten_glFramebufferRenderbuffer = _glFramebufferRenderbuffer;
function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
}
var _emscripten_glFramebufferTexture2D = _glFramebufferTexture2D;
function _glFrontFace(x0) {
    GLctx.frontFace(x0);
}
var _emscripten_glFrontFace = _glFrontFace;
function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
        } else {
            GL.recordError(1282);
        }
        HEAP32[(buffers + i * 4) >> 2] = id;
    }
}
function _glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers);
}
var _emscripten_glGenBuffers = _glGenBuffers;
function _glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
}
var _emscripten_glGenFramebuffers = _glGenFramebuffers;
function _glGenQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
        if (!query) {
            GL.recordError(1282);
            while (i < n) HEAP32[(ids + i++ * 4) >> 2] = 0;
            return;
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[(ids + i * 4) >> 2] = id;
    }
}
var _emscripten_glGenQueriesEXT = _glGenQueriesEXT;
function _glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
}
var _emscripten_glGenRenderbuffers = _glGenRenderbuffers;
function _glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures);
}
var _emscripten_glGenTextures = _glGenTextures;
function _glGenVertexArrays(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos);
}
var _glGenVertexArraysOES = _glGenVertexArrays;
var _emscripten_glGenVertexArraysOES = _glGenVertexArraysOES;
function _glGenerateMipmap(x0) {
    GLctx.generateMipmap(x0);
}
var _emscripten_glGenerateMipmap = _glGenerateMipmap;
function __glGetActiveAttribOrUniform(funcName, program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx[funcName](program, index);
    if (info) {
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        if (size) HEAP32[size >> 2] = info.size;
        if (type) HEAP32[type >> 2] = info.type;
    }
}
function _glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name);
}
var _emscripten_glGetActiveAttrib = _glGetActiveAttrib;
function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);
}
var _emscripten_glGetActiveUniform = _glGetActiveUniform;
function _glGetAttachedShaders(program, maxCount, count, shaders) {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount;
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(shaders + i * 4) >> 2] = id;
    }
}
var _emscripten_glGetAttachedShaders = _glGetAttachedShaders;
function _glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
}
var _emscripten_glGetAttribLocation = _glGetAttribLocation;
function writeI53ToI64(ptr, num) {
    HEAPU32[ptr >> 2] = num;
    HEAPU32[(ptr + 4) >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
}
function emscriptenWebGLGet(name_, p, type) {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280);
            }
            return;
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length : 0;
            break;
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case "number":
                ret = result;
                break;
            case "boolean":
                ret = result ? 1 : 0;
                break;
            case "string":
                GL.recordError(1280);
                return;
            case "object":
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 34068: {
                            ret = 0;
                            break;
                        }
                        default: {
                            GL.recordError(1280);
                            return;
                        }
                    }
                } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[(p + i * 4) >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[(p + i * 4) >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[(p + i) >> 0] = result[i] ? 1 : 0;
                                break;
                        }
                    }
                    return;
                } else {
                    try {
                        ret = result.name | 0;
                    } catch (e) {
                        GL.recordError(1280);
                        err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                        return;
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
                return;
        }
    }
    switch (type) {
        case 1:
            writeI53ToI64(p, ret);
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p >> 0] = ret ? 1 : 0;
            break;
    }
}
function _glGetBooleanv(name_, p) {
    emscriptenWebGLGet(name_, p, 4);
}
var _emscripten_glGetBooleanv = _glGetBooleanv;
function _glGetBufferParameteriv(target, value, data) {
    if (!data) {
        GL.recordError(1281);
        return;
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
}
var _emscripten_glGetBufferParameteriv = _glGetBufferParameteriv;
function _glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error;
}
var _emscripten_glGetError = _glGetError;
function _glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2);
}
var _emscripten_glGetFloatv = _glGetFloatv;
function _glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
        result = result.name | 0;
    }
    HEAP32[params >> 2] = result;
}
var _emscripten_glGetFramebufferAttachmentParameteriv = _glGetFramebufferAttachmentParameteriv;
function _glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0);
}
var _emscripten_glGetIntegerv = _glGetIntegerv;
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}
var _emscripten_glGetProgramInfoLog = _glGetProgramInfoLog;
function _glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return;
    }
    program = GL.programs[program];
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
    } else if (pname == 35719) {
        if (!program.maxUniformLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
                program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
            }
        }
        HEAP32[p >> 2] = program.maxUniformLength;
    } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
                program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
            }
        }
        HEAP32[p >> 2] = program.maxAttributeLength;
    } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
                program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
            }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength;
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname);
    }
}
var _emscripten_glGetProgramiv = _glGetProgramiv;
function _glGetQueryObjecti64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    var query = GL.queries[id];
    var param;
    {
        param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    }
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0;
    } else {
        ret = param;
    }
    writeI53ToI64(params, ret);
}
var _emscripten_glGetQueryObjecti64vEXT = _glGetQueryObjecti64vEXT;
function _glGetQueryObjectivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    var query = GL.queries[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0;
    } else {
        ret = param;
    }
    HEAP32[params >> 2] = ret;
}
var _emscripten_glGetQueryObjectivEXT = _glGetQueryObjectivEXT;
var _glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;
var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjectui64vEXT;
var _glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;
var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectuivEXT;
function _glGetQueryivEXT(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname);
}
var _emscripten_glGetQueryivEXT = _glGetQueryivEXT;
function _glGetRenderbufferParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
}
var _emscripten_glGetRenderbufferParameteriv = _glGetRenderbufferParameteriv;
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}
var _emscripten_glGetShaderInfoLog = _glGetShaderInfoLog;
function _glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[(range + 4) >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision;
}
var _emscripten_glGetShaderPrecisionFormat = _glGetShaderPrecisionFormat;
function _glGetShaderSource(shader, bufSize, length, source) {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result) return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
}
var _emscripten_glGetShaderSource = _glGetShaderSource;
function _glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return;
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength;
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength;
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
    }
}
var _emscripten_glGetShaderiv = _glGetShaderiv;
function _glGetString(name_) {
    var ret = GL.stringCache[name_];
    if (!ret) {
        switch (name_) {
            case 7939:
                var exts = GLctx.getSupportedExtensions() || [];
                exts = exts.concat(
                    exts.map(function (e) {
                        return "GL_" + e;
                    })
                );
                ret = stringToNewUTF8(exts.join(" "));
                break;
            case 7936:
            case 7937:
            case 37445:
            case 37446:
                var s = GLctx.getParameter(name_);
                if (!s) {
                    GL.recordError(1280);
                }
                ret = s && stringToNewUTF8(s);
                break;
            case 7938:
                var glVersion = GLctx.getParameter(7938);
                {
                    glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
                }
                ret = stringToNewUTF8(glVersion);
                break;
            case 35724:
                var glslVersion = GLctx.getParameter(35724);
                var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                var ver_num = glslVersion.match(ver_re);
                if (ver_num !== null) {
                    if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                    glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
                }
                ret = stringToNewUTF8(glslVersion);
                break;
            default:
                GL.recordError(1280);
        }
        GL.stringCache[name_] = ret;
    }
    return ret;
}
var _emscripten_glGetString = _glGetString;
function _glGetTexParameterfv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname);
}
var _emscripten_glGetTexParameterfv = _glGetTexParameterfv;
function _glGetTexParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname);
}
var _emscripten_glGetTexParameteriv = _glGetTexParameteriv;
function webglGetLeftBracePos(name) {
    return name.slice(-1) == "]" && name.lastIndexOf("[");
}
function webglPrepareUniformLocationsBeforeFirstUse(program) {
    var uniformLocsById = program.uniformLocsById,
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
        i,
        j;
    if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
            var u = GLctx.getActiveUniform(program, i);
            var nm = u.name;
            var sz = u.size;
            var lb = webglGetLeftBracePos(nm);
            var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
            var id = program.uniformIdCounter;
            program.uniformIdCounter += sz;
            uniformSizeAndIdsByName[arrayName] = [sz, id];
            for (j = 0; j < sz; ++j) {
                uniformLocsById[id] = j;
                program.uniformArrayNamesById[id++] = arrayName;
            }
        }
    }
}
function _glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    if ((program = GL.programs[program])) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById;
        var arrayIndex = 0;
        var uniformBaseName = name;
        var leftBrace = webglGetLeftBracePos(name);
        if (leftBrace > 0) {
            arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
            uniformBaseName = name.slice(0, leftBrace);
        }
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
            arrayIndex += sizeAndId[1];
            if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
                return arrayIndex;
            }
        }
    } else {
        GL.recordError(1281);
    }
    return -1;
}
var _emscripten_glGetUniformLocation = _glGetUniformLocation;
function webglGetUniformLocation(location) {
    var p = GLctx.currentProgram;
    if (p) {
        var webglLoc = p.uniformLocsById[location];
        if (typeof webglLoc == "number") {
            p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""));
        }
        return webglLoc;
    } else {
        GL.recordError(1282);
    }
}
function emscriptenWebGLGetUniform(program, location, params, type) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    program = GL.programs[program];
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var data = GLctx.getUniform(program, webglGetUniformLocation(location));
    if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[(params + i * 4) >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[(params + i * 4) >> 2] = data[i];
                    break;
            }
        }
    }
}
function _glGetUniformfv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 2);
}
var _emscripten_glGetUniformfv = _glGetUniformfv;
function _glGetUniformiv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 0);
}
var _emscripten_glGetUniformiv = _glGetUniformiv;
function _glGetVertexAttribPointerv(index, pname, pointer) {
    if (!pointer) {
        GL.recordError(1281);
        return;
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname);
}
var _emscripten_glGetVertexAttribPointerv = _glGetVertexAttribPointerv;
function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
    if (!params) {
        GL.recordError(1281);
        return;
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
        HEAP32[params >> 2] = data && data["name"];
    } else if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
            case 5:
                HEAP32[params >> 2] = Math.fround(data);
                break;
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[(params + i * 4) >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[(params + i * 4) >> 2] = data[i];
                    break;
                case 5:
                    HEAP32[(params + i * 4) >> 2] = Math.fround(data[i]);
                    break;
            }
        }
    }
}
function _glGetVertexAttribfv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
}
var _emscripten_glGetVertexAttribfv = _glGetVertexAttribfv;
function _glGetVertexAttribiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
}
var _emscripten_glGetVertexAttribiv = _glGetVertexAttribiv;
function _glHint(x0, x1) {
    GLctx.hint(x0, x1);
}
var _emscripten_glHint = _glHint;
function _glIsBuffer(buffer) {
    var b = GL.buffers[buffer];
    if (!b) return 0;
    return GLctx.isBuffer(b);
}
var _emscripten_glIsBuffer = _glIsBuffer;
function _glIsEnabled(x0) {
    return GLctx.isEnabled(x0);
}
var _emscripten_glIsEnabled = _glIsEnabled;
function _glIsFramebuffer(framebuffer) {
    var fb = GL.framebuffers[framebuffer];
    if (!fb) return 0;
    return GLctx.isFramebuffer(fb);
}
var _emscripten_glIsFramebuffer = _glIsFramebuffer;
function _glIsProgram(program) {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program);
}
var _emscripten_glIsProgram = _glIsProgram;
function _glIsQueryEXT(id) {
    var query = GL.queries[id];
    if (!query) return 0;
    return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
}
var _emscripten_glIsQueryEXT = _glIsQueryEXT;
function _glIsRenderbuffer(renderbuffer) {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb) return 0;
    return GLctx.isRenderbuffer(rb);
}
var _emscripten_glIsRenderbuffer = _glIsRenderbuffer;
function _glIsShader(shader) {
    var s = GL.shaders[shader];
    if (!s) return 0;
    return GLctx.isShader(s);
}
var _emscripten_glIsShader = _glIsShader;
function _glIsTexture(id) {
    var texture = GL.textures[id];
    if (!texture) return 0;
    return GLctx.isTexture(texture);
}
var _emscripten_glIsTexture = _glIsTexture;
function _glIsVertexArray(array) {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx.isVertexArray(vao);
}
var _glIsVertexArrayOES = _glIsVertexArray;
var _emscripten_glIsVertexArrayOES = _glIsVertexArrayOES;
function _glLineWidth(x0) {
    GLctx.lineWidth(x0);
}
var _emscripten_glLineWidth = _glLineWidth;
function _glLinkProgram(program) {
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {};
}
var _emscripten_glLinkProgram = _glLinkProgram;
function _glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param;
    }
    GLctx.pixelStorei(pname, param);
}
var _emscripten_glPixelStorei = _glPixelStorei;
function _glPolygonOffset(x0, x1) {
    GLctx.polygonOffset(x0, x1);
}
var _emscripten_glPolygonOffset = _glPolygonOffset;
function _glQueryCounterEXT(id, target) {
    GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target);
}
var _emscripten_glQueryCounterEXT = _glQueryCounterEXT;
function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize;
}
function colorChannelsInGlTextureFormat(format) {
    var colorChannels = { 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4 };
    return colorChannels[format - 6402] || 1;
}
function heapObjectForWebGLType(type) {
    type -= 5120;
    if (type == 1) return HEAPU8;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922) return HEAPU32;
    return HEAPU16;
}
function heapAccessShiftForWebGLHeap(heap) {
    return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
}
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, (pixels + bytes) >> shift);
}
function _glReadPixels(x, y, width, height, format, type, pixels) {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return;
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData);
}
var _emscripten_glReadPixels = _glReadPixels;
function _glReleaseShaderCompiler() {}
var _emscripten_glReleaseShaderCompiler = _glReleaseShaderCompiler;
function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx.renderbufferStorage(x0, x1, x2, x3);
}
var _emscripten_glRenderbufferStorage = _glRenderbufferStorage;
function _glSampleCoverage(value, invert) {
    GLctx.sampleCoverage(value, !!invert);
}
var _emscripten_glSampleCoverage = _glSampleCoverage;
function _glScissor(x0, x1, x2, x3) {
    GLctx.scissor(x0, x1, x2, x3);
}
var _emscripten_glScissor = _glScissor;
function _glShaderBinary(count, shaders, binaryformat, binary, length) {
    GL.recordError(1280);
}
var _emscripten_glShaderBinary = _glShaderBinary;
function _glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source);
}
var _emscripten_glShaderSource = _glShaderSource;
function _glStencilFunc(x0, x1, x2) {
    GLctx.stencilFunc(x0, x1, x2);
}
var _emscripten_glStencilFunc = _glStencilFunc;
function _glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx.stencilFuncSeparate(x0, x1, x2, x3);
}
var _emscripten_glStencilFuncSeparate = _glStencilFuncSeparate;
function _glStencilMask(x0) {
    GLctx.stencilMask(x0);
}
var _emscripten_glStencilMask = _glStencilMask;
function _glStencilMaskSeparate(x0, x1) {
    GLctx.stencilMaskSeparate(x0, x1);
}
var _emscripten_glStencilMaskSeparate = _glStencilMaskSeparate;
function _glStencilOp(x0, x1, x2) {
    GLctx.stencilOp(x0, x1, x2);
}
var _emscripten_glStencilOp = _glStencilOp;
function _glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx.stencilOpSeparate(x0, x1, x2, x3);
}
var _emscripten_glStencilOpSeparate = _glStencilOpSeparate;
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
}
var _emscripten_glTexImage2D = _glTexImage2D;
function _glTexParameterf(x0, x1, x2) {
    GLctx.texParameterf(x0, x1, x2);
}
var _emscripten_glTexParameterf = _glTexParameterf;
function _glTexParameterfv(target, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param);
}
var _emscripten_glTexParameterfv = _glTexParameterfv;
function _glTexParameteri(x0, x1, x2) {
    GLctx.texParameteri(x0, x1, x2);
}
var _emscripten_glTexParameteri = _glTexParameteri;
function _glTexParameteriv(target, pname, params) {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param);
}
var _emscripten_glTexParameteriv = _glTexParameteriv;
function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
}
var _emscripten_glTexSubImage2D = _glTexSubImage2D;
function _glUniform1f(location, v0) {
    GLctx.uniform1f(webglGetUniformLocation(location), v0);
}
var _emscripten_glUniform1f = _glUniform1f;
var miniTempWebGLFloatBuffers = [];
function _glUniform1fv(location, count, value) {
    if (count <= 288) {
        var view = miniTempWebGLFloatBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 4) >> 2);
    }
    GLctx.uniform1fv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform1fv = _glUniform1fv;
function _glUniform1i(location, v0) {
    GLctx.uniform1i(webglGetUniformLocation(location), v0);
}
var _emscripten_glUniform1i = _glUniform1i;
var miniTempWebGLIntBuffers = [];
function _glUniform1iv(location, count, value) {
    if (count <= 288) {
        var view = miniTempWebGLIntBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 4) >> 2);
    }
    GLctx.uniform1iv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform1iv = _glUniform1iv;
function _glUniform2f(location, v0, v1) {
    GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
}
var _emscripten_glUniform2f = _glUniform2f;
function _glUniform2fv(location, count, value) {
    if (count <= 144) {
        var view = miniTempWebGLFloatBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
    }
    GLctx.uniform2fv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform2fv = _glUniform2fv;
function _glUniform2i(location, v0, v1) {
    GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
}
var _emscripten_glUniform2i = _glUniform2i;
function _glUniform2iv(location, count, value) {
    if (count <= 144) {
        var view = miniTempWebGLIntBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 8) >> 2);
    }
    GLctx.uniform2iv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform2iv = _glUniform2iv;
function _glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
}
var _emscripten_glUniform3f = _glUniform3f;
function _glUniform3fv(location, count, value) {
    if (count <= 96) {
        var view = miniTempWebGLFloatBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 12) >> 2);
    }
    GLctx.uniform3fv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform3fv = _glUniform3fv;
function _glUniform3i(location, v0, v1, v2) {
    GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
}
var _emscripten_glUniform3i = _glUniform3i;
function _glUniform3iv(location, count, value) {
    if (count <= 96) {
        var view = miniTempWebGLIntBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAP32[(value + (4 * i + 8)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 12) >> 2);
    }
    GLctx.uniform3iv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform3iv = _glUniform3iv;
function _glUniform4f(location, v0, v1, v2, v3) {
    GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
}
var _emscripten_glUniform4f = _glUniform4f;
function _glUniform4fv(location, count, value) {
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 4 * count; i += 4) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniform4fv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform4fv = _glUniform4fv;
function _glUniform4i(location, v0, v1, v2, v3) {
    GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
}
var _emscripten_glUniform4i = _glUniform4i;
function _glUniform4iv(location, count, value) {
    if (count <= 72) {
        var view = miniTempWebGLIntBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAP32[(value + 4 * i) >> 2];
            view[i + 1] = HEAP32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAP32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAP32[(value + (4 * i + 12)) >> 2];
        }
    } else {
        var view = HEAP32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniform4iv(webglGetUniformLocation(location), view);
}
var _emscripten_glUniform4iv = _glUniform4iv;
function _glUniformMatrix2fv(location, count, transpose, value) {
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
    }
    GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view);
}
var _emscripten_glUniformMatrix2fv = _glUniformMatrix2fv;
function _glUniformMatrix3fv(location, count, transpose, value) {
    if (count <= 32) {
        var view = miniTempWebGLFloatBuffers[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
            view[i] = HEAPF32[(value + 4 * i) >> 2];
            view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
            view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
            view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
            view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
            view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
            view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
            view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
            view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 36) >> 2);
    }
    GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
}
var _emscripten_glUniformMatrix3fv = _glUniformMatrix3fv;
function _glUniformMatrix4fv(location, count, transpose, value) {
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 16 * count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15];
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
    }
    GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
}
var _emscripten_glUniformMatrix4fv = _glUniformMatrix4fv;
function _glUseProgram(program) {
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program;
}
var _emscripten_glUseProgram = _glUseProgram;
function _glValidateProgram(program) {
    GLctx.validateProgram(GL.programs[program]);
}
var _emscripten_glValidateProgram = _glValidateProgram;
function _glVertexAttrib1f(x0, x1) {
    GLctx.vertexAttrib1f(x0, x1);
}
var _emscripten_glVertexAttrib1f = _glVertexAttrib1f;
function _glVertexAttrib1fv(index, v) {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2]);
}
var _emscripten_glVertexAttrib1fv = _glVertexAttrib1fv;
function _glVertexAttrib2f(x0, x1, x2) {
    GLctx.vertexAttrib2f(x0, x1, x2);
}
var _emscripten_glVertexAttrib2f = _glVertexAttrib2f;
function _glVertexAttrib2fv(index, v) {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2]);
}
var _emscripten_glVertexAttrib2fv = _glVertexAttrib2fv;
function _glVertexAttrib3f(x0, x1, x2, x3) {
    GLctx.vertexAttrib3f(x0, x1, x2, x3);
}
var _emscripten_glVertexAttrib3f = _glVertexAttrib3f;
function _glVertexAttrib3fv(index, v) {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2]);
}
var _emscripten_glVertexAttrib3fv = _glVertexAttrib3fv;
function _glVertexAttrib4f(x0, x1, x2, x3, x4) {
    GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
}
var _emscripten_glVertexAttrib4f = _glVertexAttrib4f;
function _glVertexAttrib4fv(index, v) {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2], HEAPF32[(v + 8) >> 2], HEAPF32[(v + 12) >> 2]);
}
var _emscripten_glVertexAttrib4fv = _glVertexAttrib4fv;
function _glVertexAttribDivisor(index, divisor) {
    GLctx.vertexAttribDivisor(index, divisor);
}
var _glVertexAttribDivisorANGLE = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisorANGLE;
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
}
var _emscripten_glVertexAttribPointer = _glVertexAttribPointer;
function _glViewport(x0, x1, x2, x3) {
    GLctx.viewport(x0, x1, x2, x3);
}
var _emscripten_glViewport = _glViewport;
var _emscripten_has_asyncify = () => 0;
var _emscripten_memcpy_big = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
function doRequestFullscreen(target, strategy) {
    if (!JSEvents.fullscreenEnabled()) return -1;
    target = findEventTarget(target);
    if (!target) return -4;
    if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
        return -3;
    }
    var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
    if (!canPerformRequests) {
        if (strategy.deferUntilInEventHandler) {
            JSEvents.deferCall(JSEvents_requestFullscreen, 1, [target, strategy]);
            return 1;
        }
        return -2;
    }
    return JSEvents_requestFullscreen(target, strategy);
}
function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
    var strategy = {
        scaleMode: HEAP32[fullscreenStrategy >> 2],
        canvasResolutionScaleMode: HEAP32[(fullscreenStrategy + 4) >> 2],
        filteringMode: HEAP32[(fullscreenStrategy + 8) >> 2],
        deferUntilInEventHandler: deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[(fullscreenStrategy + 12) >> 2],
        canvasResizedCallbackUserData: HEAP32[(fullscreenStrategy + 16) >> 2],
    };
    return doRequestFullscreen(target, strategy);
}
function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
    target = findEventTarget(target);
    if (!target) return -4;
    if (!target.requestPointerLock) {
        return -1;
    }
    var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
    if (!canPerformRequests) {
        if (deferUntilInEventHandler) {
            JSEvents.deferCall(requestPointerLock, 2, [target]);
            return 1;
        }
        return -2;
    }
    return requestPointerLock(target);
}
var getHeapMax = () => 2147483648;
var growMemory = (size) => {
    var b = wasmMemory.buffer;
    var pages = (size - b.byteLength + 65535) >>> 16;
    try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1;
    } catch (e) {}
};
var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
        return false;
    }
    var alignUp = (x, multiple) => x + ((multiple - (x % multiple)) % multiple);
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = growMemory(newSize);
        if (replacement) {
            return true;
        }
    }
    return false;
};
function _emscripten_sample_gamepad_data() {
    return (JSEvents.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null) ? 0 : -1;
}
function registerBeforeUnloadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
    var beforeUnloadEventHandlerFunc = function (e = event) {
        var confirmationMessage = getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData);
        if (confirmationMessage) {
            confirmationMessage = UTF8ToString(confirmationMessage);
        }
        if (confirmationMessage) {
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    };
    var eventHandler = { target: findEventTarget(target), eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: beforeUnloadEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
    if (typeof onbeforeunload == "undefined") return -1;
    if (targetThread !== 1) return -5;
    return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
}
function registerFocusEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.focusEvent) JSEvents.focusEvent = _malloc(256);
    var focusEventHandlerFunc = function (e = event) {
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ? e.target.id : "";
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, focusEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: findEventTarget(target), eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: focusEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
}
function _emscripten_set_element_css_size(target, width, height) {
    target = findEventTarget(target);
    if (!target) return -4;
    target.style.width = width + "px";
    target.style.height = height + "px";
    return 0;
}
function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
}
function fillFullscreenChangeEventData(eventStruct) {
    var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    var isFullscreen = !!fullscreenElement;
    HEAP32[eventStruct >> 2] = isFullscreen;
    HEAP32[(eventStruct + 4) >> 2] = JSEvents.fullscreenEnabled();
    var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
    var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
    var id = reportedElement && reportedElement.id ? reportedElement.id : "";
    stringToUTF8(nodeName, eventStruct + 8, 128);
    stringToUTF8(id, eventStruct + 136, 128);
    HEAP32[(eventStruct + 264) >> 2] = reportedElement ? reportedElement.clientWidth : 0;
    HEAP32[(eventStruct + 268) >> 2] = reportedElement ? reportedElement.clientHeight : 0;
    HEAP32[(eventStruct + 272) >> 2] = screen.width;
    HEAP32[(eventStruct + 276) >> 2] = screen.height;
    if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
    }
}
function registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc(280);
    var fullscreenChangeEventhandlerFunc = function (e = event) {
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        fillFullscreenChangeEventData(fullscreenChangeEvent);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: fullscreenChangeEventhandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    if (!JSEvents.fullscreenEnabled()) return -1;
    target = findEventTarget(target);
    if (!target) return -4;
    registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
    return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
}
function registerGamepadEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc(1432);
    var gamepadEventHandlerFunc = function (e = event) {
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e["gamepad"]);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, gamepadEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: findEventTarget(target), allowsDeferredCalls: true, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: gamepadEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
    return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
}
function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
    return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
}
function registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(176);
    var keyEventHandlerFunc = function (e) {
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[keyEventData >> 3] = e.timeStamp;
        var idx = keyEventData >> 2;
        HEAP32[idx + 2] = e.location;
        HEAP32[idx + 3] = e.ctrlKey;
        HEAP32[idx + 4] = e.shiftKey;
        HEAP32[idx + 5] = e.altKey;
        HEAP32[idx + 6] = e.metaKey;
        HEAP32[idx + 7] = e.repeat;
        HEAP32[idx + 8] = e.charCode;
        HEAP32[idx + 9] = e.keyCode;
        HEAP32[idx + 10] = e.which;
        stringToUTF8(e.key || "", keyEventData + 44, 32);
        stringToUTF8(e.code || "", keyEventData + 76, 32);
        stringToUTF8(e.char || "", keyEventData + 108, 32);
        stringToUTF8(e.locale || "", keyEventData + 140, 32);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault();
    };
    var eventHandler = { target: findEventTarget(target), allowsDeferredCalls: true, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: keyEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
}
function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
}
function fillMouseEventData(eventStruct, e, target) {
    HEAPF64[eventStruct >> 3] = e.timeStamp;
    var idx = eventStruct >> 2;
    HEAP32[idx + 2] = e.screenX;
    HEAP32[idx + 3] = e.screenY;
    HEAP32[idx + 4] = e.clientX;
    HEAP32[idx + 5] = e.clientY;
    HEAP32[idx + 6] = e.ctrlKey;
    HEAP32[idx + 7] = e.shiftKey;
    HEAP32[idx + 8] = e.altKey;
    HEAP32[idx + 9] = e.metaKey;
    HEAP16[idx * 2 + 20] = e.button;
    HEAP16[idx * 2 + 21] = e.buttons;
    HEAP32[idx + 11] = e["movementX"];
    HEAP32[idx + 12] = e["movementY"];
    var rect = getBoundingClientRect(target);
    HEAP32[idx + 13] = e.clientX - rect.left;
    HEAP32[idx + 14] = e.clientY - rect.top;
}
function registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(72);
    target = findEventTarget(target);
    var mouseEventHandlerFunc = function (e = event) {
        fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture: useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
}
function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
}
function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
}
function fillPointerlockChangeEventData(eventStruct) {
    var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
    var isPointerlocked = !!pointerLockElement;
    HEAP32[eventStruct >> 2] = isPointerlocked;
    var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
    var id = pointerLockElement && pointerLockElement.id ? pointerLockElement.id : "";
    stringToUTF8(nodeName, eventStruct + 4, 128);
    stringToUTF8(id, eventStruct + 132, 128);
}
function registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.pointerlockChangeEvent) JSEvents.pointerlockChangeEvent = _malloc(260);
    var pointerlockChangeEventHandlerFunc = function (e = event) {
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: pointerlockChangeEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    if (!document || !document.body || (!document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock)) {
        return -1;
    }
    target = findEventTarget(target);
    if (!target) return -4;
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mozpointerlockchange", targetThread);
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "webkitpointerlockchange", targetThread);
    registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mspointerlockchange", targetThread);
    return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
}
function registerUiEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc(36);
    target = findEventTarget(target);
    var uiEventHandlerFunc = function (e = event) {
        if (e.target != target) {
            return;
        }
        var b = document.body;
        if (!b) {
            return;
        }
        var uiEvent = JSEvents.uiEvent;
        HEAP32[uiEvent >> 2] = e.detail;
        HEAP32[(uiEvent + 4) >> 2] = b.clientWidth;
        HEAP32[(uiEvent + 8) >> 2] = b.clientHeight;
        HEAP32[(uiEvent + 12) >> 2] = innerWidth;
        HEAP32[(uiEvent + 16) >> 2] = innerHeight;
        HEAP32[(uiEvent + 20) >> 2] = outerWidth;
        HEAP32[(uiEvent + 24) >> 2] = outerHeight;
        HEAP32[(uiEvent + 28) >> 2] = pageXOffset;
        HEAP32[(uiEvent + 32) >> 2] = pageYOffset;
        if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: uiEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
}
function registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1696);
    target = findEventTarget(target);
    var touchEventHandlerFunc = function (e) {
        var t,
            touches = {},
            et = e.touches;
        for (var i = 0; i < et.length; ++i) {
            t = et[i];
            t.isChanged = t.onTarget = 0;
            touches[t.identifier] = t;
        }
        for (var i = 0; i < e.changedTouches.length; ++i) {
            t = e.changedTouches[i];
            t.isChanged = 1;
            touches[t.identifier] = t;
        }
        for (var i = 0; i < e.targetTouches.length; ++i) {
            touches[e.targetTouches[i].identifier].onTarget = 1;
        }
        var touchEvent = JSEvents.touchEvent;
        HEAPF64[touchEvent >> 3] = e.timeStamp;
        var idx = touchEvent >> 2;
        HEAP32[idx + 3] = e.ctrlKey;
        HEAP32[idx + 4] = e.shiftKey;
        HEAP32[idx + 5] = e.altKey;
        HEAP32[idx + 6] = e.metaKey;
        idx += 7;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (var i in touches) {
            t = touches[i];
            HEAP32[idx + 0] = t.identifier;
            HEAP32[idx + 1] = t.screenX;
            HEAP32[idx + 2] = t.screenY;
            HEAP32[idx + 3] = t.clientX;
            HEAP32[idx + 4] = t.clientY;
            HEAP32[idx + 5] = t.pageX;
            HEAP32[idx + 6] = t.pageY;
            HEAP32[idx + 7] = t.isChanged;
            HEAP32[idx + 8] = t.onTarget;
            HEAP32[idx + 9] = t.clientX - targetRect.left;
            HEAP32[idx + 10] = t.clientY - targetRect.top;
            idx += 13;
            if (++numTouches > 31) {
                break;
            }
        }
        HEAP32[(touchEvent + 8) >> 2] = numTouches;
        if (getWasmTableEntry(callbackfunc)(eventTypeId, touchEvent, userData)) e.preventDefault();
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture: useCapture,
    };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
}
function fillVisibilityChangeEventData(eventStruct) {
    var visibilityStates = ["hidden", "visible", "prerender", "unloaded"];
    var visibilityState = visibilityStates.indexOf(document.visibilityState);
    HEAP32[eventStruct >> 2] = document.hidden;
    HEAP32[(eventStruct + 4) >> 2] = visibilityState;
}
function registerVisibilityChangeEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc(8);
    var visibilityChangeEventHandlerFunc = function (e = event) {
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        fillVisibilityChangeEventData(visibilityChangeEvent);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: visibilityChangeEventHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    if (!specialHTMLTargets[1]) {
        return -4;
    }
    return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
}
function registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
    var wheelHandlerFunc = function (e = event) {
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(wheelEvent + 72) >> 3] = e["deltaX"];
        HEAPF64[(wheelEvent + 80) >> 3] = e["deltaY"];
        HEAPF64[(wheelEvent + 88) >> 3] = e["deltaZ"];
        HEAP32[(wheelEvent + 96) >> 2] = e["deltaMode"];
        if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault();
    };
    var eventHandler = { target: target, allowsDeferredCalls: true, eventTypeString: eventTypeString, callbackfunc: callbackfunc, handlerFunc: wheelHandlerFunc, useCapture: useCapture };
    return JSEvents.registerOrRemoveHandler(eventHandler);
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = findEventTarget(target);
    if (!target) return -4;
    if (typeof target.onwheel != "undefined") {
        return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
    } else {
        return -1;
    }
}
function _emscripten_set_window_title(title) {
    setWindowTitle(UTF8ToString(title));
}
function _emscripten_sleep() {
    throw "Please compile your program with async support in order to use asynchronous operations like emscripten_sleep";
}
var ENV = {};
var getExecutableName = () => thisProgram || "./this.program";
var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
        var lang = ((typeof navigator == "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
        var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
        for (var x in ENV) {
            if (ENV[x] === undefined) delete env[x];
            else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
};
var stringToAscii = (str, buffer) => {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
    }
    HEAP8[buffer >> 0] = 0;
};
var _environ_get = (__environ, environ_buf) => {
    var bufSize = 0;
    getEnvStrings().forEach(function (string, i) {
        var ptr = environ_buf + bufSize;
        HEAPU32[(__environ + i * 4) >> 2] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
    });
    return 0;
};
var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    strings.forEach(function (string) {
        bufSize += string.length + 1;
    });
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0;
};
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
function _fd_fdstat_get(fd, pbuf) {
    try {
        var rightsBase = 0;
        var rightsInheriting = 0;
        var flags = 0;
        {
            var stream = SYSCALLS.getStreamFromFD(fd);
            var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
        }
        HEAP8[pbuf >> 0] = type;
        HEAP16[(pbuf + 2) >> 1] = flags;
        (tempI64 = [rightsBase >>> 0, ((tempDouble = rightsBase), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0)]),
            (HEAP32[(pbuf + 8) >> 2] = tempI64[0]),
            (HEAP32[(pbuf + 12) >> 2] = tempI64[1]);
        (tempI64 = [
            rightsInheriting >>> 0,
            ((tempDouble = rightsInheriting), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[(pbuf + 16) >> 2] = tempI64[0]),
            (HEAP32[(pbuf + 20) >> 2] = tempI64[1]);
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break;
        if (typeof offset !== "undefined") {
            offset += curr;
        }
    }
    return ret;
};
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
    try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        (tempI64 = [
            stream.position >>> 0,
            ((tempDouble = stream.position), +Math.abs(tempDouble) >= 1 ? (tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0) : 0),
        ]),
            (HEAP32[newOffset >> 2] = tempI64[0]),
            (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var doWritev = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[(iov + 4) >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (typeof offset !== "undefined") {
            offset += curr;
        }
    }
    return ret;
};
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0;
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno;
    }
}
var _getaddrinfo = (node, service, hint, out) => {
    var addr = 0;
    var port = 0;
    var flags = 0;
    var family = 0;
    var type = 0;
    var proto = 0;
    var ai;
    function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var errno;
        salen = family === 10 ? 28 : 16;
        addr = family === 10 ? inetNtop6(addr) : inetNtop4(addr);
        sa = _malloc(salen);
        errno = writeSockaddr(sa, family, addr, port);
        assert(!errno);
        ai = _malloc(32);
        HEAP32[(ai + 4) >> 2] = family;
        HEAP32[(ai + 8) >> 2] = type;
        HEAP32[(ai + 12) >> 2] = proto;
        HEAPU32[(ai + 24) >> 2] = canon;
        HEAPU32[(ai + 20) >> 2] = sa;
        if (family === 10) {
            HEAP32[(ai + 16) >> 2] = 28;
        } else {
            HEAP32[(ai + 16) >> 2] = 16;
        }
        HEAP32[(ai + 28) >> 2] = 0;
        return ai;
    }
    if (hint) {
        flags = HEAP32[hint >> 2];
        family = HEAP32[(hint + 4) >> 2];
        type = HEAP32[(hint + 8) >> 2];
        proto = HEAP32[(hint + 12) >> 2];
    }
    if (type && !proto) {
        proto = type === 2 ? 17 : 6;
    }
    if (!type && proto) {
        type = proto === 17 ? 2 : 1;
    }
    if (proto === 0) {
        proto = 6;
    }
    if (type === 0) {
        type = 1;
    }
    if (!node && !service) {
        return -2;
    }
    if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
        return -1;
    }
    if (hint !== 0 && HEAP32[hint >> 2] & 2 && !node) {
        return -1;
    }
    if (flags & 32) {
        return -2;
    }
    if (type !== 0 && type !== 1 && type !== 2) {
        return -7;
    }
    if (family !== 0 && family !== 2 && family !== 10) {
        return -6;
    }
    if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
        if (isNaN(port)) {
            if (flags & 1024) {
                return -2;
            }
            return -8;
        }
    }
    if (!node) {
        if (family === 0) {
            family = 2;
        }
        if ((flags & 1) === 0) {
            if (family === 2) {
                addr = _htonl(2130706433);
            } else {
                addr = [0, 0, 0, 1];
            }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAPU32[out >> 2] = ai;
        return 0;
    }
    node = UTF8ToString(node);
    addr = inetPton4(node);
    if (addr !== null) {
        if (family === 0 || family === 2) {
            family = 2;
        } else if (family === 10 && flags & 8) {
            addr = [0, 0, _htonl(65535), addr];
            family = 10;
        } else {
            return -2;
        }
    } else {
        addr = inetPton6(node);
        if (addr !== null) {
            if (family === 0 || family === 10) {
                family = 10;
            } else {
                return -2;
            }
        }
    }
    if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAPU32[out >> 2] = ai;
        return 0;
    }
    if (flags & 4) {
        return -2;
    }
    node = DNS.lookup_name(node);
    addr = inetPton4(node);
    if (family === 0) {
        family = 2;
    } else if (family === 10) {
        addr = [0, 0, _htonl(65535), addr];
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    HEAPU32[out >> 2] = ai;
    return 0;
};
var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
var arraySum = (array, index) => {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum;
};
var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var addDays = (date, days) => {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1);
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1);
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        }
    }
    return newDate;
};
var writeArrayToMemory = (array, buffer) => {
    HEAP8.set(array, buffer);
};
var _strftime = (s, maxsize, format, tm) => {
    var tm_zone = HEAP32[(tm + 40) >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[(tm + 4) >> 2],
        tm_hour: HEAP32[(tm + 8) >> 2],
        tm_mday: HEAP32[(tm + 12) >> 2],
        tm_mon: HEAP32[(tm + 16) >> 2],
        tm_year: HEAP32[(tm + 20) >> 2],
        tm_wday: HEAP32[(tm + 24) >> 2],
        tm_yday: HEAP32[(tm + 28) >> 2],
        tm_isdst: HEAP32[(tm + 32) >> 2],
        tm_gmtoff: HEAP32[(tm + 36) >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : "",
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y",
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function leadingSomething(value, digits, character) {
        var str = typeof value == "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str;
        }
        return str;
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0");
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0;
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate());
            }
        }
        return compare;
    }
    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1;
            }
            return thisDate.getFullYear();
        }
        return thisDate.getFullYear() - 1;
    }
    var EXPANSION_RULES_2 = {
        "%a": (date) => WEEKDAYS[date.tm_wday].substring(0, 3),
        "%A": (date) => WEEKDAYS[date.tm_wday],
        "%b": (date) => MONTHS[date.tm_mon].substring(0, 3),
        "%B": (date) => MONTHS[date.tm_mon],
        "%C": (date) => {
            var year = date.tm_year + 1900;
            return leadingNulls((year / 100) | 0, 2);
        },
        "%d": (date) => leadingNulls(date.tm_mday, 2),
        "%e": (date) => leadingSomething(date.tm_mday, 2, " "),
        "%g": (date) => getWeekBasedYear(date).toString().substring(2),
        "%G": (date) => getWeekBasedYear(date),
        "%H": (date) => leadingNulls(date.tm_hour, 2),
        "%I": (date) => {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2);
        },
        "%j": (date) => leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3),
        "%m": (date) => leadingNulls(date.tm_mon + 1, 2),
        "%M": (date) => leadingNulls(date.tm_min, 2),
        "%n": () => "\n",
        "%p": (date) => {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM";
            }
            return "PM";
        },
        "%S": (date) => leadingNulls(date.tm_sec, 2),
        "%t": () => "\t",
        "%u": (date) => date.tm_wday || 7,
        "%U": (date) => {
            var days = date.tm_yday + 7 - date.tm_wday;
            return leadingNulls(Math.floor(days / 7), 2);
        },
        "%V": (date) => {
            var val = Math.floor((date.tm_yday + 7 - ((date.tm_wday + 6) % 7)) / 7);
            if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
                val++;
            }
            if (!val) {
                val = 52;
                var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
                if (dec31 == 4 || (dec31 == 5 && isLeapYear((date.tm_year % 400) - 1))) {
                    val++;
                }
            } else if (val == 53) {
                var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
                if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
            }
            return leadingNulls(val, 2);
        },
        "%w": (date) => date.tm_wday,
        "%W": (date) => {
            var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
            return leadingNulls(Math.floor(days / 7), 2);
        },
        "%y": (date) => (date.tm_year + 1900).toString().substring(2),
        "%Y": (date) => date.tm_year + 1900,
        "%z": (date) => {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = (off / 60) * 100 + (off % 60);
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
        },
        "%Z": (date) => date.tm_zone,
        "%%": () => "%",
    };
    pattern = pattern.replace(/%%/g, "\0\0");
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
        }
    }
    pattern = pattern.replace(/\0\0/g, "%");
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0;
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1;
};
var _strftime_l = (s, maxsize, format, tm, loc) => _strftime(s, maxsize, format, tm);
var FSNode = function (parent, name, mode, rdev) {
    if (!parent) {
        parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function () {
            return (this.mode & readMode) === readMode;
        },
        set: function (val) {
            val ? (this.mode |= readMode) : (this.mode &= ~readMode);
        },
    },
    write: {
        get: function () {
            return (this.mode & writeMode) === writeMode;
        },
        set: function (val) {
            val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
        },
    },
    isFolder: {
        get: function () {
            return FS.isDir(this.mode);
        },
    },
    isDevice: {
        get: function () {
            return FS.isChrdev(this.mode);
        },
    },
});
FS.FSNode = FSNode;
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
    Browser.requestFullscreen(lockPointer, resizeCanvas);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
    Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
    Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
    Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
    Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
    Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
var preloadedImages = {};
var preloadedAudios = {};
var GLctx;
for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
}
var miniTempWebGLIntBuffersStorage = new Int32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i + 1);
}
var wasmImports = {
    x: ___cxa_throw,
    qb: ___syscall__newselect,
    jb: ___syscall_accept4,
    ib: ___syscall_bind,
    Jb: ___syscall_chdir,
    Ib: ___syscall_chmod,
    hb: ___syscall_connect,
    Kb: ___syscall_faccessat,
    Cb: ___syscall_fchmodat,
    Hb: ___syscall_fchownat,
    l: ___syscall_fcntl64,
    Bb: ___syscall_fstat64,
    xb: ___syscall_getcwd,
    ub: ___syscall_getdents64,
    gb: ___syscall_getsockname,
    ca: ___syscall_ioctl,
    fb: ___syscall_listen,
    yb: ___syscall_lstat64,
    vb: ___syscall_mkdirat,
    zb: ___syscall_newfstatat,
    w: ___syscall_openat,
    tb: ___syscall_readlinkat,
    eb: ___syscall_recvfrom,
    rb: ___syscall_renameat,
    sb: ___syscall_rmdir,
    db: ___syscall_sendto,
    $: ___syscall_socket,
    Ab: ___syscall_stat64,
    pb: ___syscall_statfs64,
    ob: ___syscall_symlink,
    B: ___syscall_unlinkat,
    Fb: __emscripten_get_now_is_monotonic,
    lb: __emscripten_throw_longjmp,
    $a: __gmtime_js,
    ab: __timegm_js,
    nb: __tzset_js,
    d: _abort,
    Xa: _eglBindAPI,
    _a: _eglChooseConfig,
    Oa: _eglCreateContext,
    Qa: _eglCreateWindowSurface,
    Pa: _eglDestroyContext,
    Ra: _eglDestroySurface,
    cb: _eglGetConfigAttrib,
    _: _eglGetDisplay,
    Na: _eglGetError,
    Ya: _eglInitialize,
    Sa: _eglMakeCurrent,
    Ma: _eglQueryString,
    Ta: _eglSwapBuffers,
    Ua: _eglSwapInterval,
    Za: _eglTerminate,
    Wa: _eglWaitGL,
    Va: _eglWaitNative,
    ha: _emscripten_asm_const_int,
    k: _emscripten_asm_const_int_sync_on_main_thread,
    E: _emscripten_date_now,
    Ha: _emscripten_exit_fullscreen,
    Ka: _emscripten_exit_pointerlock,
    s: _emscripten_get_device_pixel_ratio,
    p: _emscripten_get_element_css_size,
    fa: _emscripten_get_gamepad_status,
    D: _emscripten_get_now,
    $b: _emscripten_get_num_gamepads,
    La: _emscripten_get_screen_size,
    na: _emscripten_glActiveTexture,
    ma: _emscripten_glAttachShader,
    Da: _emscripten_glBeginQueryEXT,
    la: _emscripten_glBindAttribLocation,
    ka: _emscripten_glBindBuffer,
    ja: _emscripten_glBindFramebuffer,
    ia: _emscripten_glBindRenderbuffer,
    me: _emscripten_glBindTexture,
    va: _emscripten_glBindVertexArrayOES,
    le: _emscripten_glBlendColor,
    ke: _emscripten_glBlendEquation,
    je: _emscripten_glBlendEquationSeparate,
    ie: _emscripten_glBlendFunc,
    he: _emscripten_glBlendFuncSeparate,
    ge: _emscripten_glBufferData,
    fe: _emscripten_glBufferSubData,
    ee: _emscripten_glCheckFramebufferStatus,
    de: _emscripten_glClear,
    ce: _emscripten_glClearColor,
    be: _emscripten_glClearDepthf,
    ae: _emscripten_glClearStencil,
    $d: _emscripten_glColorMask,
    _d: _emscripten_glCompileShader,
    Zd: _emscripten_glCompressedTexImage2D,
    Yd: _emscripten_glCompressedTexSubImage2D,
    Xd: _emscripten_glCopyTexImage2D,
    Wd: _emscripten_glCopyTexSubImage2D,
    Vd: _emscripten_glCreateProgram,
    Ud: _emscripten_glCreateShader,
    Td: _emscripten_glCullFace,
    Sd: _emscripten_glDeleteBuffers,
    Rd: _emscripten_glDeleteFramebuffers,
    Qd: _emscripten_glDeleteProgram,
    Fa: _emscripten_glDeleteQueriesEXT,
    Pd: _emscripten_glDeleteRenderbuffers,
    Od: _emscripten_glDeleteShader,
    Nd: _emscripten_glDeleteTextures,
    ua: _emscripten_glDeleteVertexArraysOES,
    Md: _emscripten_glDepthFunc,
    Ld: _emscripten_glDepthMask,
    Kd: _emscripten_glDepthRangef,
    Jd: _emscripten_glDetachShader,
    Id: _emscripten_glDisable,
    Hd: _emscripten_glDisableVertexAttribArray,
    Gd: _emscripten_glDrawArrays,
    qa: _emscripten_glDrawArraysInstancedANGLE,
    ra: _emscripten_glDrawBuffersWEBGL,
    Fd: _emscripten_glDrawElements,
    pa: _emscripten_glDrawElementsInstancedANGLE,
    Ed: _emscripten_glEnable,
    Dd: _emscripten_glEnableVertexAttribArray,
    Ca: _emscripten_glEndQueryEXT,
    Cd: _emscripten_glFinish,
    Bd: _emscripten_glFlush,
    Ad: _emscripten_glFramebufferRenderbuffer,
    zd: _emscripten_glFramebufferTexture2D,
    yd: _emscripten_glFrontFace,
    xd: _emscripten_glGenBuffers,
    vd: _emscripten_glGenFramebuffers,
    Ga: _emscripten_glGenQueriesEXT,
    ud: _emscripten_glGenRenderbuffers,
    td: _emscripten_glGenTextures,
    ta: _emscripten_glGenVertexArraysOES,
    wd: _emscripten_glGenerateMipmap,
    sd: _emscripten_glGetActiveAttrib,
    rd: _emscripten_glGetActiveUniform,
    qd: _emscripten_glGetAttachedShaders,
    pd: _emscripten_glGetAttribLocation,
    od: _emscripten_glGetBooleanv,
    nd: _emscripten_glGetBufferParameteriv,
    md: _emscripten_glGetError,
    ld: _emscripten_glGetFloatv,
    kd: _emscripten_glGetFramebufferAttachmentParameteriv,
    jd: _emscripten_glGetIntegerv,
    hd: _emscripten_glGetProgramInfoLog,
    id: _emscripten_glGetProgramiv,
    xa: _emscripten_glGetQueryObjecti64vEXT,
    za: _emscripten_glGetQueryObjectivEXT,
    wa: _emscripten_glGetQueryObjectui64vEXT,
    ya: _emscripten_glGetQueryObjectuivEXT,
    Aa: _emscripten_glGetQueryivEXT,
    gd: _emscripten_glGetRenderbufferParameteriv,
    ed: _emscripten_glGetShaderInfoLog,
    dd: _emscripten_glGetShaderPrecisionFormat,
    cd: _emscripten_glGetShaderSource,
    fd: _emscripten_glGetShaderiv,
    bd: _emscripten_glGetString,
    ad: _emscripten_glGetTexParameterfv,
    $c: _emscripten_glGetTexParameteriv,
    Xc: _emscripten_glGetUniformLocation,
    _c: _emscripten_glGetUniformfv,
    Zc: _emscripten_glGetUniformiv,
    Uc: _emscripten_glGetVertexAttribPointerv,
    Wc: _emscripten_glGetVertexAttribfv,
    Vc: _emscripten_glGetVertexAttribiv,
    Tc: _emscripten_glHint,
    Sc: _emscripten_glIsBuffer,
    Rc: _emscripten_glIsEnabled,
    Qc: _emscripten_glIsFramebuffer,
    Pc: _emscripten_glIsProgram,
    Ea: _emscripten_glIsQueryEXT,
    Oc: _emscripten_glIsRenderbuffer,
    Nc: _emscripten_glIsShader,
    Mc: _emscripten_glIsTexture,
    sa: _emscripten_glIsVertexArrayOES,
    Lc: _emscripten_glLineWidth,
    Kc: _emscripten_glLinkProgram,
    Jc: _emscripten_glPixelStorei,
    Ic: _emscripten_glPolygonOffset,
    Ba: _emscripten_glQueryCounterEXT,
    Hc: _emscripten_glReadPixels,
    Gc: _emscripten_glReleaseShaderCompiler,
    Fc: _emscripten_glRenderbufferStorage,
    Ec: _emscripten_glSampleCoverage,
    Dc: _emscripten_glScissor,
    Cc: _emscripten_glShaderBinary,
    Bc: _emscripten_glShaderSource,
    Ac: _emscripten_glStencilFunc,
    zc: _emscripten_glStencilFuncSeparate,
    yc: _emscripten_glStencilMask,
    xc: _emscripten_glStencilMaskSeparate,
    wc: _emscripten_glStencilOp,
    vc: _emscripten_glStencilOpSeparate,
    uc: _emscripten_glTexImage2D,
    tc: _emscripten_glTexParameterf,
    sc: _emscripten_glTexParameterfv,
    rc: _emscripten_glTexParameteri,
    qc: _emscripten_glTexParameteriv,
    pc: _emscripten_glTexSubImage2D,
    oc: _emscripten_glUniform1f,
    nc: _emscripten_glUniform1fv,
    mc: _emscripten_glUniform1i,
    lc: _emscripten_glUniform1iv,
    kc: _emscripten_glUniform2f,
    jc: _emscripten_glUniform2fv,
    ic: _emscripten_glUniform2i,
    hc: _emscripten_glUniform2iv,
    gc: _emscripten_glUniform3f,
    fc: _emscripten_glUniform3fv,
    ec: _emscripten_glUniform3i,
    dc: _emscripten_glUniform3iv,
    cc: _emscripten_glUniform4f,
    bc: _emscripten_glUniform4fv,
    ac: _emscripten_glUniform4i,
    _b: _emscripten_glUniform4iv,
    Zb: _emscripten_glUniformMatrix2fv,
    Yb: _emscripten_glUniformMatrix3fv,
    Xb: _emscripten_glUniformMatrix4fv,
    Wb: _emscripten_glUseProgram,
    Vb: _emscripten_glValidateProgram,
    Ub: _emscripten_glVertexAttrib1f,
    Tb: _emscripten_glVertexAttrib1fv,
    Sb: _emscripten_glVertexAttrib2f,
    Rb: _emscripten_glVertexAttrib2fv,
    Qb: _emscripten_glVertexAttrib3f,
    Pb: _emscripten_glVertexAttrib3fv,
    Ob: _emscripten_glVertexAttrib4f,
    Nb: _emscripten_glVertexAttrib4fv,
    oa: _emscripten_glVertexAttribDivisorANGLE,
    Mb: _emscripten_glVertexAttribPointer,
    Lb: _emscripten_glViewport,
    C: _emscripten_has_asyncify,
    Gb: _emscripten_memcpy_big,
    Ia: _emscripten_request_fullscreen_strategy,
    Z: _emscripten_request_pointerlock,
    mb: _emscripten_resize_heap,
    ga: _emscripten_sample_gamepad_data,
    F: _emscripten_set_beforeunload_callback_on_thread,
    R: _emscripten_set_blur_callback_on_thread,
    r: _emscripten_set_canvas_element_size,
    z: _emscripten_set_element_css_size,
    S: _emscripten_set_focus_callback_on_thread,
    I: _emscripten_set_fullscreenchange_callback_on_thread,
    ea: _emscripten_set_gamepadconnected_callback_on_thread,
    da: _emscripten_set_gamepaddisconnected_callback_on_thread,
    L: _emscripten_set_keydown_callback_on_thread,
    J: _emscripten_set_keypress_callback_on_thread,
    K: _emscripten_set_keyup_callback_on_thread,
    X: _emscripten_set_mousedown_callback_on_thread,
    V: _emscripten_set_mouseenter_callback_on_thread,
    U: _emscripten_set_mouseleave_callback_on_thread,
    Y: _emscripten_set_mousemove_callback_on_thread,
    W: _emscripten_set_mouseup_callback_on_thread,
    M: _emscripten_set_pointerlockchange_callback_on_thread,
    H: _emscripten_set_resize_callback_on_thread,
    N: _emscripten_set_touchcancel_callback_on_thread,
    P: _emscripten_set_touchend_callback_on_thread,
    O: _emscripten_set_touchmove_callback_on_thread,
    Q: _emscripten_set_touchstart_callback_on_thread,
    G: _emscripten_set_visibilitychange_callback_on_thread,
    T: _emscripten_set_wheel_callback_on_thread,
    Ja: _emscripten_set_window_title,
    A: _emscripten_sleep,
    Db: _environ_get,
    Eb: _environ_sizes_get,
    m: _exit,
    q: _fd_close,
    wb: _fd_fdstat_get,
    aa: _fd_read,
    bb: _fd_seek,
    ba: _fd_write,
    Yc: _getaddrinfo,
    a: invoke_i,
    c: invoke_ii,
    n: invoke_iii,
    v: invoke_iiii,
    g: invoke_iiiii,
    j: invoke_iiiiii,
    o: invoke_iiiiiii,
    t: invoke_iiiiiiiiiiii,
    b: invoke_v,
    e: invoke_vi,
    f: invoke_vii,
    h: invoke_viii,
    u: invoke_viiii,
    i: invoke_viiiii,
    y: invoke_viiiiiii,
    kb: _strftime_l,
};
var asm = createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["oe"])();
var _malloc = (a0) => (_malloc = wasmExports["qe"])(a0);
var setTempRet0 = (a0) => (setTempRet0 = wasmExports["re"])(a0);
var ___errno_location = () => (___errno_location = wasmExports["se"])();
var _main = (Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["te"])(a0, a1));
var _ntohs = (a0) => (_ntohs = wasmExports["ue"])(a0);
var _htons = (a0) => (_htons = wasmExports["ve"])(a0);
var _htonl = (a0) => (_htonl = wasmExports["we"])(a0);
var _setThrew = (a0, a1) => (_setThrew = wasmExports["xe"])(a0, a1);
var stackSave = () => (stackSave = wasmExports["ye"])();
var stackRestore = (a0) => (stackRestore = wasmExports["ze"])(a0);
var stackAlloc = (a0) => (stackAlloc = wasmExports["Ae"])(a0);
var ___cxa_is_pointer_type = (a0) => (___cxa_is_pointer_type = wasmExports["Be"])(a0);
var dynCall_jii = (Module["dynCall_jii"] = (a0, a1, a2) => (dynCall_jii = Module["dynCall_jii"] = wasmExports["Ce"])(a0, a1, a2));
var dynCall_viji = (Module["dynCall_viji"] = (a0, a1, a2, a3, a4) => (dynCall_viji = Module["dynCall_viji"] = wasmExports["De"])(a0, a1, a2, a3, a4));
var dynCall_vij = (Module["dynCall_vij"] = (a0, a1, a2, a3) => (dynCall_vij = Module["dynCall_vij"] = wasmExports["Ee"])(a0, a1, a2, a3));
var dynCall_iij = (Module["dynCall_iij"] = (a0, a1, a2, a3) => (dynCall_iij = Module["dynCall_iij"] = wasmExports["Fe"])(a0, a1, a2, a3));
var dynCall_jiji = (Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["Ge"])(a0, a1, a2, a3, a4));
var dynCall_ji = (Module["dynCall_ji"] = (a0, a1) => (dynCall_ji = Module["dynCall_ji"] = wasmExports["He"])(a0, a1));
var dynCall_viijii = (Module["dynCall_viijii"] = (a0, a1, a2, a3, a4, a5, a6) => (dynCall_viijii = Module["dynCall_viijii"] = wasmExports["Ie"])(a0, a1, a2, a3, a4, a5, a6));
var dynCall_iiiiij = (Module["dynCall_iiiiij"] = (a0, a1, a2, a3, a4, a5, a6) => (dynCall_iiiiij = Module["dynCall_iiiiij"] = wasmExports["Je"])(a0, a1, a2, a3, a4, a5, a6));
var dynCall_iiiiijj = (Module["dynCall_iiiiijj"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) => (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = wasmExports["Ke"])(a0, a1, a2, a3, a4, a5, a6, a7, a8));
var dynCall_iiiiiijj = (Module["dynCall_iiiiiijj"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = wasmExports["Le"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9));
function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_v(index) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)();
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_i(index) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)();
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3, a4);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2, a3, a4);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2, a3, a4, a5);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0);
    }
}
var calledRun;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller;
};
function callMain(args = []) {
    var entryFunction = _main;
    args.unshift(thisProgram);
    var argc = args.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv >> 2;
    args.forEach((arg) => {
        HEAP32[argv_ptr++] = stringToUTF8OnStack(arg);
    });
    HEAP32[argv_ptr] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exitJS(ret, true);
        return ret;
    } catch (e) {
        return handleException(e);
    }
}
function run(args = arguments_) {
    if (runDependencies > 0) {
        return;
    }
    preRun();
    if (runDependencies > 0) {
        return;
    }
    function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun();
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function () {
            setTimeout(function () {
                Module["setStatus"]("");
            }, 1);
            doRun();
        }, 1);
    } else {
        doRun();
    }
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
run()
;
