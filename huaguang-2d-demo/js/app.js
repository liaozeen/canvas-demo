var app = new Vue({
    el: '#app',
    data: function () {
        return {
            canvas: null,
            ctx: null,
            isDrawing: false,
            curGraphType: "cursor-move",
            graphs: [],
            curGraph: null,
            canAddGraph: true,
            TM: null,
            transMatrix: null,
            inverseMatrix: null,
            startPos: null,
            pinch: null,
            deleteIndex: null,
            scale: 1,
            orginX: 0,
            orginY: 0
        };
    },
    mounted: function () {
        var vm = this;
        vm.canvas = vm.$refs.canvas;
        vm.ctx = vm.canvas.getContext("2d");
        vm.canvasWidth = vm.canvas.width;
        vm.canvasHeight = vm.canvas.height;
        vm.transMatrix = vm.inverseMatrix = identity();
        vm.pinch = new Pinch();
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
                        break;
                    }
                }
                if (!isPinch) {
                    this.deleteIndex = null;
                    this.pinch.update();
                }
                this.draw(this.transMatrix);
            }
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
            var vm = this;
            e.preventDefault();
            var pos = vm.getCanvasLoc(e);
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
        }
    }
});
