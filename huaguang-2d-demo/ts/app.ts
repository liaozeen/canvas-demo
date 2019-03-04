let app = new Vue({
    el:'#app',
    data(){
        return{
            canvas:null,//canvas画布
            ctx:null, //2d绘制上下文
            x2js:null, //xml与json互转插件
            fileInput:null, //inputFile 元素
            isDrawing:false,//是否可以绘制
            curGraphType:"cursor-move", //当前的工具栏选项
            graphs:[],//所有需要绘制的图形
            curGraph:null,//当前正在绘制的图形
            selectGraph:null, //当前选中的图形
            deleteIndex:null, //表示删除对应 graphs 数组的序号的图形数据
            canAddGraph:true, //是否可以添加图形
            TM:null, //临时平移矩阵，用于移动画布
            transMatrix:null, //变换矩阵
            inverseMatrix:null, //变换矩阵的逆矩阵
            startPos:null, //鼠标一开始点击的位置
            pinch:null, //选中样式框
            scale:1, //当前的缩放比例
            fileIndex:0, //用于导出文件的命名
            curParam:{ //当前图形的属性
                x:null,
                y:null,
                w:null,
                h:null,
                l:null
            }
        }
    },
    mounted(){
        var vm = this
        vm.canvas = vm.$refs.canvas
        vm.ctx = vm.canvas.getContext("2d")
        vm.x2js = new X2JS()
        vm.canvasWidth = vm.canvas.width
        vm.canvasHeight = vm.canvas.height
        vm.transMatrix = vm.inverseMatrix = identity()
        vm.pinch = new Pinch()
        vm.fileInput = document.getElementById("files")
        vm.canvas.addEventListener('mousedown', vm.mousedown)
        vm.canvas.addEventListener('mousemove', vm.mousemove)
        vm.canvas.addEventListener('mousewheel',vm.mousewheel)
        document.addEventListener('mouseup', vm.mouseup);
    },
    methods:{
        clearCanvas(){ //清屏
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
        },
        draw(transMatrix){ //绘制全部图形
            this.clearCanvas()
            for(let i=0;i<this.graphs.length;i++){
                let graph = this.graphs[i]
                graph.draw(this.ctx,transMatrix)
            }
            this.pinch.draw(this.ctx,transMatrix)
        },
        mousedown(e){ 
            this.startPos = this.getCanvasLoc(e)
            this.isDrawing = true

            if(this.curGraphType == "cursor-move"){
                let isPinch = false
                let pos = transformPos(this.startPos,this.inverseMatrix)
                for(let i=0;i<this.graphs.length;i++){
                    let graph = this.graphs[i]
                    if(graph.inRange(pos.x,pos.y)){
                        this.pinch.update(graph.points)
                        isPinch = true
                        this.deleteIndex = i
                        this.selectGraph = graph
                        break
                    }
                }
                if(!isPinch){
                    this.deleteIndex = null
                    this.selectGraph = null
                    this.pinch.update()
                }
                this.showCurGraphParam(this.selectGraph)
                this.draw(this.transMatrix)
            }
            // console.log("down",this.transMatrix)
        },
        mousemove(e){
            if(!this.isDrawing) return
            let pos = this.getCanvasLoc(e)
          
            if(this.curGraphType != "cursor-move"){
                let newPos = transformPos(pos,this.inverseMatrix)

                if(this.canAddGraph){
                    this.curGraph = this.selectGraphClass(newPos)
                    this.graphs.push(this.curGraph)
                    this.canAddGraph = false
                }
                this.curGraph.update(newPos)
                this.draw(this.transMatrix)
            }else{
                this.moveCvs(pos)
            }
            // console.log("move",this.transMatrix)
        },
        mouseup(e){
            this.canvas.style.cursor = "default"
            this.isDrawing = false
            this.canAddGraph = true
            if(this.curGraphType === "cursor-move" && this.TM){
                this.transMatrix = this.TM
                this.inverseMatrix = inverse(this.transMatrix)
            }
            // console.log("up",this.transMatrix)
        },
        mousewheel(e){
            e.preventDefault();
            let wheel = e.deltaY < 0 ? 1 : -1
            let step = 1.2
            let sm = matrixScale(1,1)//缩放矩阵
            
            if(wheel === 1){
                if(this.scale < 6){
                    this.scale *= step
                    sm = matrixScale(step,step)
                }
            }else{
                if(this.scale > 0.5){
                    this.scale *= 1/step
                    sm = matrixScale(1/step,1/step)
                }
            }
         
            this.transMatrix = matrixMultiply(sm,this.transMatrix)
            // let newPos = transformPos(pos,this.transMatrix)
            // let offsetX = pos.x - newPos.x 
            // let offsetY = pos.y - newPos.y
            // let tm  = matrixTranslation(offsetX,offsetY)//平移矩阵
            // this.transMatrix = matrixMultiply(tm,this.transMatrix)
            this.inverseMatrix = inverse(this.transMatrix)
            this.draw(this.transMatrix)
            console.log("wheel",this.transMatrix)
        },
        selectGraphClass(pos:any):any{
            let graph = null
            let type = this.curGraphType
            if(type){
                if(type === "line"){
                    graph = new Line(pos)
                }

                if(type === "rect"){
                    graph = new Rect(pos)
                }

                if(type === "round"){
                    graph = new Round(pos)
                }
            }
            return graph
        },
        moveCvs(pos){ //移动画布
            this.canvas.style.cursor = "pointer"
            let offsetX = pos.x - this.startPos.x
            let offsetY = pos.y - this.startPos.y
            let tm = matrixTranslation(offsetX,offsetY)
            this.TM = matrixMultiply(tm,this.transMatrix)
            this.draw(this.TM)
        },
        getCanvasLoc(e:any){
            return winToCanvas(e.target,e.clientX,e.clientY)
        },
        deleteGraph(){
            if(this.deleteIndex != null){
                this.graphs.splice(this.deleteIndex,1)
                this.pinch.update()
                this.draw(this.transMatrix)
                this.deleteIndex = null
            }
        },
        exportxml(){
            let json = graph2Json(this.graphs)
            let xmlStr = '<?xml version="1.0" encoding="gb2312"?>\n'
            xmlStr += this.x2js.json2xml_str(json)
            this.fileIndex++
            downloadFile(xmlStr,"图形"+this.fileIndex+".xml")
        },
        importXml(){
            importFile((xmlStr:string)=>{
                let json = this.x2js.xml_str2json(xmlStr)
                let graphs = json2Graph(json)
                this.loadData2Canvas(graphs)
            })
        },
        getFile2Input(){
            this.fileInput.click()
        },
        loadData2Canvas(graphs:[]){
            let vm = this
            vm.graphs = []
          
            graphs.forEach( (graph:any) => {
                let obj:any
                let type = graph.type
                
                if(type === "line"){
                    obj = new Line(graph,true)
                }

                if(type === "rect"){
                    obj = new Rect(graph,true)
                }

                if(type === "round"){
                    obj = new Round(graph,true)
                }
                vm.graphs.push(obj)
            })
            vm.transMatrix = vm.inverseMatrix = identity()
            vm.draw(vm.transMatrix)
        },
        isDisabled(data){
            if(data !== 0 && data != "" && !data){
                return true
            }else{
                return false
            }
        },
        showCurGraphParam(graph:any){
            this.curParam = {
                x:null,
                y:null,
                w:null,
                h:null,
                l:null
            }
            if(graph){
                let type = graph.type
                let x1 = graph.points[0].x
                let y1 = graph.points[0].y
                this.curParam.x = x1
                this.curParam.y = y1

                if(type == "line"){
                    let x2 = graph.points[1].x
                    let y2 = graph.points[1].y
                    this.curParam.l = distBetween2points(x1,y1,x2,y2)
                }else{
                    let x3 = graph.points[2].x
                    let y3 = graph.points[2].y
                    let w = x3 - x1
                    let h = y3 - y1
                    this.curParam.w = w
                    this.curParam.h = h
                }
            }
        },
        setGraphSize(type:string){
            let graph = this.selectGraph
            let points = graph.points
            if(type === "x"){
                let offsetX = this.curParam.x - points[0].x
                points[0].x = this.curParam.x
             
                for(let i=1;i<points.length;i++){
                    points[i].x += offsetX
                }
            }
            if(type === "y"){
                let offsetY = this.curParam.y - points[0].y
                points[0].y = this.curParam.y
             
                for(let i=1;i<points.length;i++){
                    points[i].y += offsetY
                }
            }
            
            if(type === "w"){
                let x2 = points[0].x + this.curParam.w
                //改变右上角和右下角的x坐标
                points[1].x = x2
                points[2].x = x2
            }

            if(type === "h"){
                let y2 = points[0].y + this.curParam.h
                //改变右下角和左下角的y坐标
                points[2].y = y2
                points[3].y = y2
            }

            if(type === "l"){
                let x1 = points[0].x
                let y1 = points[0].y
                let x2 = points[1].x
                let y2 = points[1].y
                let w1 = x2 - x1
                let h1 = y2 - y1
                let l1 = distBetween2points(x1,y1,x2,y2)
                let l2 = this.curParam.l | 1
                let rate = l1/l2
                let w2 = w1 / rate
                let h2 = h1 / rate
                points[1].x = x1 + w2
                points[1].y = y1 + h2
            }

            if(graph.type === "round"){
                graph.radiusX = this.curParam.w/2
                graph.radiusY = this.curParam.h/2
                graph.x = points[0].x + graph.radiusX
                graph.y = points[0].y + graph.radiusY
            }
            this.draw(this.transMatrix)
        }
    }
})

