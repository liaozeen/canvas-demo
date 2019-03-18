var app = new Vue({
    el: '#app',
    data: function () {
        return {
            canvas: null,
            ctx: null,
            x2js: null,
            fileInput: null,
            isDrawing: false,
            curGraphType: "cursor-move",
            graphs: [],
            curGraph: null,
            selectGraph: null,
            deleteIndex: null,
            canAddGraph: true,
            TM: null,
            transMatrix: null,
            inverseMatrix: null,
            startPos: null,
            pinch: null,
            scale: 1,
            fileIndex: 0,
            curParam: {
                x: null,
                y: null,
                w: null,
                h: null,
                l: null
            }
        };
    },
    mounted: function () {
        var vm = this;
        vm.canvas = vm.$refs.canvas;
        vm.ctx = vm.canvas.getContext("2d");
        vm.x2js = new X2JS();
        vm.canvasWidth = vm.canvas.width;
        vm.canvasHeight = vm.canvas.height;
        vm.transMatrix = vm.inverseMatrix = identity();
        vm.pinch = new Pinch();
        vm.fileInput = document.getElementById("files");
        vm.canvas.addEventListener('mousedown', vm.mousedown);
        vm.canvas.addEventListener('mousemove', vm.mousemove);
        vm.canvas.addEventListener('mousewheel', vm.mousewheel);
        document.addEventListener('mouseup', vm.mouseup);
    },
    methods: {
        clearCanvas: function () {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        draw: function (transMatrix) {
            this.clearCanvas();
            for (var i = 0; i < this.graphs.length; i++) {
                var graph = this.graphs[i];
                graph.draw(this.ctx, transMatrix);
            }
            this.pinch.draw(this.ctx, transMatrix);
        },
        mousedown: function (e) {
            this.startPos = this.getCanvasLoc(e);
            this.isDrawing = true;
            if (this.curGraphType == "cursor-move") {
                var isPinch = false;
                var pos = transformPos(this.startPos, this.inverseMatrix);
                for (var i = 0; i < this.graphs.length; i++) {
                    var graph = this.graphs[i];
                    if (graph.inRange(pos.x, pos.y)) {
                        this.pinch.update(graph.points);
                        isPinch = true;
                        this.deleteIndex = i;
                        this.selectGraph = graph;
                        break;
                    }
                }
                if (!isPinch) {
                    this.deleteIndex = null;
                    this.selectGraph = null;
                    this.pinch.update();
                }
                this.showCurGraphParam(this.selectGraph);
                this.draw(this.transMatrix);
            }
            // console.log("down",this.transMatrix)
        },
        mousemove: function (e) {
            if (!this.isDrawing)
                return;
            var pos = this.getCanvasLoc(e);
            if (this.curGraphType != "cursor-move") {
                var newPos = transformPos(pos, this.inverseMatrix);
                if (this.canAddGraph) {
                    this.curGraph = this.selectGraphClass(newPos);
                    this.graphs.push(this.curGraph);
                    this.canAddGraph = false;
                }
                this.curGraph.update(newPos);
                this.draw(this.transMatrix);
            }
            else {
                this.moveCvs(pos);
            }
        },
        mouseup: function (e) {
            this.canvas.style.cursor = "default";
            this.isDrawing = false;
            this.canAddGraph = true;
            if (this.curGraphType === "cursor-move" && this.TM) {
                this.transMatrix = this.TM;
                this.inverseMatrix = inverse(this.transMatrix);
            }
        },
        mousewheel: function (e) {
            e.preventDefault();
            var wheel = e.deltaY < 0 ? 1 : -1;
            var step = 1.2;
            var sm = matrixScale(1, 1); //缩放矩阵
            if (wheel === 1) {
                if (this.scale < 6) {
                    this.scale *= step;
                    sm = matrixScale(step, step);
                }
            }
            else {
                if (this.scale > 0.5) {
                    this.scale *= 1 / step;
                    sm = matrixScale(1 / step, 1 / step);
                }
            }
            this.transMatrix = matrixMultiply(sm, this.transMatrix);
            // let newPos = transformPos(pos,this.transMatrix)
            // let offsetX = pos.x - newPos.x 
            // let offsetY = pos.y - newPos.y
            // let tm  = matrixTranslation(offsetX,offsetY)//平移矩阵
            // this.transMatrix = matrixMultiply(tm,this.transMatrix)
            this.inverseMatrix = inverse(this.transMatrix);
            this.draw(this.transMatrix);
            console.log("wheel", this.transMatrix);
        },
        selectGraphClass: function (pos) {
            var graph = null;
            var type = this.curGraphType;
            if (type) {
                if (type === "line") {
                    graph = new Line(pos);
                }
                if (type === "rect") {
                    graph = new Rect(pos);
                }
                if (type === "round") {
                    graph = new Round(pos);
                }
            }
            return graph;
        },
        moveCvs: function (pos) {
            this.canvas.style.cursor = "pointer";
            var offsetX = pos.x - this.startPos.x;
            var offsetY = pos.y - this.startPos.y;
            var tm = matrixTranslation(offsetX, offsetY);
            this.TM = matrixMultiply(tm, this.transMatrix);
            this.draw(this.TM);
        },
        getCanvasLoc: function (e) {
            return winToCanvas(e.target, e.clientX, e.clientY);
        },
        deleteGraph: function () {
            if (this.deleteIndex != null) {
                this.graphs.splice(this.deleteIndex, 1);
                this.pinch.update();
                this.draw(this.transMatrix);
                this.deleteIndex = null;
            }
        },
        exportxml: function () {
            var json = graph2Json(this.graphs);
            var xmlStr = '<?xml version="1.0" encoding="gb2312"?>\n';
            xmlStr += this.x2js.json2xml_str(json);
            this.fileIndex++;
            downloadFile(xmlStr, "图形" + this.fileIndex + ".xml");
        },
        importXml: function () {
            var _this = this;
            importFile(function (xmlStr) {
                var json = _this.x2js.xml_str2json(xmlStr);
                var graphs = json2Graph(json);
                _this.loadData2Canvas(graphs);
            });
        },
        getFile2Input: function () {
            this.fileInput.click();
        },
        loadData2Canvas: function (graphs) {
            var vm = this;
            vm.graphs = [];
            graphs.forEach(function (graph) {
                var obj;
                var type = graph.type;
                if (type === "line") {
                    obj = new Line(graph, true);
                }
                if (type === "rect") {
                    obj = new Rect(graph, true);
                }
                if (type === "round") {
                    obj = new Round(graph, true);
                }
                vm.graphs.push(obj);
            });
            vm.transMatrix = vm.inverseMatrix = identity();
            vm.draw(vm.transMatrix);
        },
        isDisabled: function (data) {
            if (data !== 0 && data != "" && !data) {
                return true;
            }
            else {
                return false;
            }
        },
        showCurGraphParam: function (graph) {
            this.curParam = {
                x: null,
                y: null,
                w: null,
                h: null,
                l: null
            };
            if (graph) {
                var type = graph.type;
                var x1 = graph.points[0].x;
                var y1 = graph.points[0].y;
                this.curParam.x = x1;
                this.curParam.y = y1;
                if (type == "line") {
                    var x2 = graph.points[1].x;
                    var y2 = graph.points[1].y;
                    this.curParam.l = distBetween2points(x1, y1, x2, y2);
                }
                else {
                    var x3 = graph.points[2].x;
                    var y3 = graph.points[2].y;
                    var w = x3 - x1;
                    var h = y3 - y1;
                    this.curParam.w = w;
                    this.curParam.h = h;
                }
            }
        },
        setGraphSize: function (type) {
            var graph = this.selectGraph;
            var points = graph.points;
            if (type === "x") {
                var offsetX = this.curParam.x - points[0].x;
                points[0].x = this.curParam.x;
                for (var i = 1; i < points.length; i++) {
                    points[i].x += offsetX;
                }
            }
            if (type === "y") {
                var offsetY = this.curParam.y - points[0].y;
                points[0].y = this.curParam.y;
                for (var i = 1; i < points.length; i++) {
                    points[i].y += offsetY;
                }
            }
            if (type === "w") {
                var x2 = points[0].x + this.curParam.w;
                //改变右上角和右下角的x坐标
                points[1].x = x2;
                points[2].x = x2;
            }
            if (type === "h") {
                var y2 = points[0].y + this.curParam.h;
                //改变右下角和左下角的y坐标
                points[2].y = y2;
                points[3].y = y2;
            }
            if (type === "l") {
                var x1 = points[0].x;
                var y1 = points[0].y;
                var x2 = points[1].x;
                var y2 = points[1].y;
                var w1 = x2 - x1;
                var h1 = y2 - y1;
                var l1 = distBetween2points(x1, y1, x2, y2);
                var l2 = this.curParam.l | 1;
                var rate = l1 / l2;
                var w2 = w1 / rate;
                var h2 = h1 / rate;
                points[1].x = x1 + w2;
                points[1].y = y1 + h2;
            }
            if (graph.type === "round") {
                graph.radiusX = this.curParam.w / 2;
                graph.radiusY = this.curParam.h / 2;
                graph.x = points[0].x + graph.radiusX;
                graph.y = points[0].y + graph.radiusY;
            }
            this.draw(this.transMatrix);
        }
    }
});
