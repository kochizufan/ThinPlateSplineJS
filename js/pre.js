var ThinPlateSpline = (function(){

function ThinPlateSpline(options) {
  if (!options) { options = {}; }

  this.__ord = {
    pointer : Runtime.stackAlloc(104),
    solved  : false
  };
  this.__rev = {
    pointer : Runtime.stackAlloc(104),
    solved  : false
  };
  this.isWorker = false;
  var me     = this;

  Module['ccall']('_ZN17VizGeorefSpline2DC1Ei', 'void', ['number', 'number'], [this.__ord.pointer, 2]);
  Module['ccall']('_ZN17VizGeorefSpline2DC1Ei', 'void', ['number', 'number'], [this.__rev.pointer, 2]);
  //__ZN17VizGeorefSpline2DC1Ei(this.__ord.pointer,2);
  //__ZN17VizGeorefSpline2DC1Ei(this.__rev.pointer,2);

  if (options.use_worker) {
    var root = '';
    var scripts = document.getElementsByTagName("script");
    var i = scripts.length;
    while (i--) {
      var match = scripts[i].src.match(/(^|.*\/)thinplatespline\.js/);
      if (match) {
        root = match[1];
        break;
      }
    }

    var worker = this.worker = new Worker(root + 'thinplatespline.js');

    worker.onmessage = function(e) {
      var data      = e.data;
      var e_type    = data.event;

      switch (e_type){
        case 'solved':
          console.log("Solved");
          worker.postMessage({'method':'serialize'});
          break;
        case 'serialized':
          var serial = data.serial;
          console.log(serial);
          delete(me.worker);
          worker.terminate();
          me.deserialize(serial);
          console.log("Serialized");
          break;
        case 'echo':
          console.log(data.data);
      }
    };
  }

  if (options.transform_callback) {
    this.transform_callback = options.transform_callback;
  }

  if (options.error_callback) {
    this.error_callback = options.error_callback;
  }

  if (options.web_falback && options.transform_callback) {
    this.web_fallback = options.web_falback;
  }
}

ThinPlateSpline.prototype.destructor = function() {
  Module['ccall']('_ZN17VizGeorefSpline2DD1Ev', 'void', ['number'], [this.__ord.pointer]);
  Module['ccall']('_ZN17VizGeorefSpline2DD1Ev', 'void', ['number'], [this.__rev.pointer]);
  Module['ccall']('_ZdlPv', 'void', ['number'], [this.__ord.pointer]);
  Module['ccall']('_ZdlPv', 'void', ['number'], [this.__rev.pointer]);
  //__ZN17VizGeorefSpline2DD1Ev(this.__ord.pointer);
  //__ZN17VizGeorefSpline2DD1Ev(this.__rev.pointer);
  //__ZdlPv(this.__ord.pointer);
  //__ZdlPv(this.__rev.pointer);
};

ThinPlateSpline.prototype.push_points = function(points) {
  if (this.worker) {
    this.worker.postMessage({'method':'push_points','data':points});
  } else {
    for (var i=0,len=points.length;i<len;i++) {
      var point = points[i];
      this.add_point(point[0],point[1]);
    }
    this.solve();
  }
};

ThinPlateSpline.prototype.load_points = function(url) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'load_points','data':url});
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onload = function(e) {
      if (this.status == 200) {
        var points = JSON.parse(this.response);
        me.push_points(points);
      } else {
        //self.postMessage({'event':'cannotLoad'});
      }
    };
    xhr.send();
  }
};

ThinPlateSpline.prototype.load_serial = function(url) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'load_serial','data':url});
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      if (this.status == 200) {
        var serial = new Uint8Array(this.response);
        me.deserialize(serial);
      } else {
        //self.postMessage({'event':'cannotLoad'});
      }
    };
    xhr.send();
  }
};

ThinPlateSpline.prototype.add_point = function(P, D) {
  this.__add_point(this.__ord, P, D);
  this.__add_point(this.__rev, D, P);
};

ThinPlateSpline.prototype.__add_point = function(self, P, D) {
  /*var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  var DPtr=(__stackBase__);

  var DPtr1=((DPtr)|0);
  (HEAPF64[(tempDoublePtr)>>3]=D[0],HEAP32[((DPtr1)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((DPtr1)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]);
  var DPtr2=((DPtr+8)|0);
  (HEAPF64[(tempDoublePtr)>>3]=D[1],HEAP32[((DPtr2)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((DPtr2)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]);

  var ret = __ZN17VizGeorefSpline2D9add_pointEddPKd(self.pointer, P[0], P[1], DPtr);
  //var ret = Module['ccall']('_ZN17VizGeorefSpline2D9add_pointEddPKd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);
  STACKTOP = __stackBase__;*/

  var DPtr = _malloc(16);
  Module.setValue(DPtr,     D[0], 'double');
  Module.setValue(DPtr + 8, D[1], 'double');
  var ret = Module['ccall']('_ZN17VizGeorefSpline2D9add_pointEddPKd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);

  _free(DPtr);

  self.solved = false;

  return ret;
};

ThinPlateSpline.prototype.solve = function() {
  this.__solve(this.__ord);
  this.__solve(this.__rev);
};

ThinPlateSpline.prototype.__solve = function(self) {
  self.solved = true;
  //return __ZN17VizGeorefSpline2D5solveEv(self.pointer);
  return Module['ccall']('_ZN17VizGeorefSpline2D5solveEv', 'number', ['number'], [self.pointer]);
};

ThinPlateSpline.prototype.transform = function(P, isRev) {
  var self = isRev ? this.__rev : this.__ord;
  var ret  = this.__get_point(self, P);
  var me   = this;

  if (me.transform_callback) {
    if (ret === 0) {
      if (me.web_fallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.web_fallback + '?x=' + P[0] + '&y=' + P[1] + '&inv=' + isRev, true);

        xhr.onload = function(e) {
          if (this.status == 200) {
            var data = JSON.parse(this.response);
            me.transform_callback([data.data.x,data.data.y], isRev);
          } else if (me.error_callback) {
            me.error_callback(P, isRev);
          }
        };
        xhr.send();
      } else if (me.error_callback) {
        me.error_callback(P, isRev);
      }
    } else {
      me.transform_callback(ret, isRev);
    }
  } else {
    return ret;
  }
};

ThinPlateSpline.prototype.__get_point = function(self, P) {
  if (!self.solved) { return 0; } //this.__solve(self); }
  
  /*var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  var $__dstr=(__stackBase__);

  //var res = __ZN15ThinPlateSpline9get_pointEddPd(this.pointer, P[0], P[1], $__dstr);
  var res = __ZN17VizGeorefSpline2D9get_pointEddPd(self.pointer, P[0], P[1], $__dstr);
  var $21=(($__dstr)|0);
  var $22=(HEAP32[((tempDoublePtr)>>2)]=HEAP32[(($21)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[((($21)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
  var $23=(($__dstr+8)|0);
  var $24=(HEAP32[((tempDoublePtr)>>2)]=HEAP32[(($23)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[((($23)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);

  STACKTOP = __stackBase__;*/

  var DPtr = _malloc(16);
  var res  = Module['ccall']('_ZN17VizGeorefSpline2D9get_pointEddPd', 'number', ['number','number','number','number'], [self.pointer, P[0], P[1], DPtr]);
  var ret  = [];
  ret[0]   = Module.getValue(DPtr,    'double');
  ret[1]   = Module.getValue(DPtr + 8,'double');

  _free(DPtr);

  return ret;
};

ThinPlateSpline.prototype.serialize = function() {
  var alloc_size = this.serialize_size();
  var all_size   = alloc_size[0] + alloc_size[1] + 2;
  var serial_ptr = _malloc(all_size);
  var work_ptr   = serial_ptr;

  work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D9serializeEPc', 'void', ['number', 'number'], [this.__ord.pointer, work_ptr]);
  Module.setValue(work_ptr, this.__ord.solved ? 1 : 0, 'i8');
  work_ptr++;

  work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D9serializeEPc', 'void', ['number', 'number'], [this.__rev.pointer, work_ptr]);
  Module.setValue(work_ptr, this.__rev.solved ? 1 : 0, 'i8');
  work_ptr++;

  var ret = new Uint8Array(new Uint8Array(HEAPU8.buffer, serial_ptr, all_size));

  _free(serial_ptr);

  return ret;
};

ThinPlateSpline.prototype.deserialize = function(serial) {
  var me = this;
  if (this.worker) {
    this.worker.postMessage({'method':'deserialize','data':serial});
  } else {
    var all_size   = serial.length;
    var serial_ptr = _malloc(all_size);
    var work_ptr   = serial_ptr;

    HEAPU8.set(serial, serial_ptr);

    work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D11deserializeEPc', 'void', ['number', 'number'], [this.__ord.pointer, work_ptr]);
    this.__ord.solved = Module.getValue(work_ptr, 'i8') ? true : false;
    work_ptr++;

    work_ptr = Module['ccall']('_ZN17VizGeorefSpline2D11deserializeEPc', 'void', ['number', 'number'], [this.__rev.pointer, work_ptr]);
    this.__rev.solved = Module.getValue(work_ptr, 'i8') ? true : false;
    work_ptr++;

    _free(serial_ptr);
  }
};

ThinPlateSpline.prototype.serialize_size = function() {
  return [this.__serialize_size(this.__ord),this.__serialize_size(this.__rev)];
};

ThinPlateSpline.prototype.__serialize_size = function(self) {
  //return __ZN17VizGeorefSpline2D14serialize_sizeEv(self.pointer);
  return Module['ccall']('_ZN17VizGeorefSpline2D14serialize_sizeEv', 'number', ['number'], [self.pointer]);
};
