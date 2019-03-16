var app = new Vue({
    el: '#app',
    data: function () {
        return {
            canvas: null,
            ctx: null,
            fileInput: null,
            isDrawing: false,
            curGraphType: "cursor-move",
            graphs: [],
            labels: [],
            curGraph: null,
            selectGraph: null,
            deleteIndex: null,
            canAddGraph: true,
            TM: null,
            transMatrix: null,
            inverseMatrix: null,
            startPos: null,
            scale: 1,
            origin: {
                x: 50,
                y: 50
            },
            fileIndex: 0,
            curParam: {},
        };
    },
    mounted: function () {
        var vm = this;
        vm.canvas = vm.$refs.canvas;
        vm.ctx = vm.canvas.getContext("2d");
        vm.canvasWidth = vm.canvas.width;
        vm.canvasHeight = vm.canvas.height;
        vm.fileInput = document.getElementById("files");
        vm.canvas.addEventListener('mousedown', vm.mousedown);
        vm.canvas.addEventListener('mousemove', vm.mousemove);
        vm.canvas.addEventListener('mousewheel', vm.mousewheel);
        document.addEventListener('mouseup', vm.mouseup);
        vm.initMatrix();
    },
    methods: {
        //初始化坐标变换矩阵
        initMatrix: function () {
            var vm = this;
            var matrix = identity();
            var sm = matrixScale(vm.scale, vm.scale);
            var offsetX = vm.origin.x;
            var offsetY = vm.origin.y;
            var tm = matrixTranslation(offsetX, offsetY);
            matrix = matrixMultiply(sm, matrix);
            vm.transMatrix = matrixMultiply(tm, matrix);
            vm.inverseMatrix = inverse(vm.transMatrix);
        },
        //清屏
        clearCanvas: function () {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        //绘制
        draw: function (transMatrix) {
            this.clearCanvas();
            for (var i = 0; i < this.graphs.length; i++) {
                var graph = this.graphs[i];
                graph.draw(this.ctx, transMatrix);
            }
            for (var i = 0; i < this.labels.length; i++) {
                var label = this.labels[i];
                label.draw(this.ctx, transMatrix);
            }
        },
        //鼠标按下
        mousedown: function (e) {
            this.startPos = this.getCanvasLoc(e);
            this.isDrawing = true;
        },
        //鼠标移动
        mousemove: function (e) {
            if (!this.isDrawing)
                return;
            var pos = this.getCanvasLoc(e);
            this.moveCvs(pos);
        },
        //鼠标松开
        mouseup: function (e) {
            this.canvas.style.cursor = "default";
            this.isDrawing = false;
            this.canAddGraph = true;
            if (this.curGraphType === "cursor-move" && this.TM) {
                this.transMatrix = this.TM;
                this.inverseMatrix = inverse(this.transMatrix);
            }
        },
        //鼠标滚轮操作
        mousewheel: function (e) {
            e.preventDefault();
            var wheel = e.deltaY < 0 ? 1 : -1;
            var step = 1.2;
            var sm = matrixScale(1, 1); //缩放矩阵
            var pos = this.getCanvasLoc(e);
            if (wheel === 1) {
                //if(this.scale < 6){
                this.scale *= step;
                sm = matrixScale(step, step);
                //}
            }
            else {
                //if(this.scale > 0.5){
                this.scale *= 1 / step;
                sm = matrixScale(1 / step, 1 / step);
                //}
            }
            this.transMatrix = matrixMultiply(sm, this.transMatrix);
            // let newPos = transformPos(pos,this.transMatrix)
            // let offsetX = pos.x - newPos.x 
            // let offsetY = pos.y - newPos.y
            // let tm  = matrixTranslation(offsetX,offsetY)//平移矩阵
            // this.transMatrix = matrixMultiply(tm,this.transMatrix)
            this.inverseMatrix = inverse(this.transMatrix);
            this.draw(this.transMatrix);
        },
        //拖动画布
        moveCvs: function (pos) {
            this.canvas.style.cursor = "pointer";
            var offsetX = pos.x - this.startPos.x;
            var offsetY = pos.y - this.startPos.y;
            var tm = matrixTranslation(offsetX, offsetY);
            this.TM = matrixMultiply(tm, this.transMatrix);
            this.draw(this.TM);
        },
        //获取相对画布的坐标
        getCanvasLoc: function (e) {
            return winToCanvas(e.target, e.clientX, e.clientY);
        },
        //删除图形
        deleteGraph: function () {
            if (this.deleteIndex != null) {
                this.graphs.splice(this.deleteIndex, 1);
                this.pinch.update();
                this.draw(this.transMatrix);
                this.deleteIndex = null;
            }
        },
        //导出 xml
        exportxml: function () {
            var json = this.graphs[0];
            var xmlStr = obj2Xml(json);
            this.fileIndex++;
            downloadFile(xmlStr, "图形" + this.fileIndex + ".x2d");
        },
        //导入 xml
        importXml: function () {
            var _this = this;
            importFile(function (xmlStr) {
                var json = xml2Obj(xmlStr);
                _this.loadData2Canvas(json);
            });
        },
        //将本地文件添加到 input 控件里
        getFile2Input: function () {
            this.fileInput.click();
        },
        //加载数据显示到画布上
        loadData2Canvas: function (json) {
            if (!json)
                return;
            var vm = this;
            var obj = json[0];
            var graph = vm.selectGraph = new Graph(obj);
            vm.showCurGraphParam(graph);
            vm.graphs = [];
            vm.graphs.push(graph);
            vm.labels = vm.addGraphLabel(graph);
            vm.initMatrix();
            vm.draw(vm.transMatrix);
        },
        //是否可编辑
        isDisabled: function (data) {
            if (data !== 0 && data != "" && !data) {
                return true;
            }
            else {
                return false;
            }
        },
        //显示当前图形的参数
        showCurGraphParam: function (graph) {
            var defaultKey = {
                L: "1000",
                W: "1000"
            };
            //若源数据没有相应的必要的属性，自动补充设置默认值
            for (var key in defaultKey) {
                if (!graph.attr.hasOwnProperty(key)) {
                    graph.attr[key] = defaultKey[key];
                }
            }
            this.curParam = {};
            if (graph && graph.attr) {
                for (var key in graph.attr) {
                    this.curParam[key] = graph.attr[key];
                }
            }
        },
        //修改图形参数，实时绘制
        setGraphSize: function (type) {
            var graph = this.selectGraph;
            try {
                if (this.curParam[type] != "") {
                    graph.attr[type] = this.curParam[type];
                }
                else {
                    this.curParam[type] = graph.attr[type] = 0;
                }
                this.labels = this.addGraphLabel(graph);
                this.draw(this.transMatrix);
            }
            catch (e) {
                console.log(e.message);
            }
        },
        addGraphLabel: function (graph) {
            var labels = [];
            var nodes = this.getGraphNodes(graph);
            var lastNode = null;
            nodes.forEach(function (node) {
                if (lastNode) {
                    var label = void 0;
                    if (node.node === "Point" && lastNode.node === "Point") {
                        var x1 = node.x;
                        var y1 = node.y;
                        var x2 = lastNode.x;
                        var y2 = lastNode.y;
                        label = new Label(x1, y1, x2, y2, "arrow");
                    }
                    if (node.node === "Arc") {
                        label = new Label(node.x, node.y, node.center.x, node.center.y, "cross");
                    }
                    if (label) {
                        labels.push(label);
                    }
                    lastNode = node;
                }
                else {
                    lastNode = node;
                }
            });
            return labels;
        },
        getGraphNodes: function (graph) {
            var data = getX2dPlaneData(graph);
            var childs = data.children;
            var nodes = [];
            var filter = ["Name"];
            //初始化图形参数，设置默认值
            var attrs = ["L", "W", "CA", "CB", "CC", "CD", "CE", "CF", "CG", "CH", "CI", "CJ", "CK", "CL", "CM", "CN", "CO", "CP"];
            for (var i = 0; i < attrs.length; i++) {
                eval("var " + attrs[i] + "= 0");
            }
            //定义图形参数的变量
            for (var key in graph.attr) {
                if (filter.indexOf(key) === -1 && !isChina(key)) {
                    var value = graph.attr[key];
                    if (!isNaN(value) && value != "") {
                        eval("var " + key + "=" + value);
                    }
                    else {
                        eval("var " + key + "= 0");
                    }
                }
            }
            childs.forEach(function (child) {
                var x = eval(child.attr.X) | 0;
                var y = eval(child.attr.Y);
                var r = eval(child.attr.R);
                var sAngle = eval(child.attr.StartAngle);
                var obj = {
                    x: x,
                    y: y,
                    r: r
                };
                if (child.node === "Point") {
                    obj.node = "Point";
                }
                if (child.node === "Arc") {
                    obj.node = "Arc";
                    obj.center = getArcCenter(x, y, r, sAngle);
                }
                nodes.push(obj);
            });
            return nodes;
        }
    }
});
