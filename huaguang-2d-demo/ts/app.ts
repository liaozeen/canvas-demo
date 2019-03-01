let q:any = document.getElementById('qdutils');

let app = new Vue({
    el:'#app',
    data(){
        return{
            canvas:null,
            ctx:null,
            x2js:null, //xml与 json互转插件
            fileInput:null,
            isDrawing:false,
            curGraphType:"cursor-move",
            graphs:[],
            curGraph:null,
            canAddGraph:true,
            TM:null, //临时平移矩阵，用于移动画布
            transMatrix:null, //变换矩阵
            inverseMatrix:null, //变换矩阵的逆矩阵
            startPos:null, //鼠标一开始点击的位置
            pinch:null, //选中样式框
            deleteIndex:null,
            scale:1, //当前的缩放比例
            orginX:0,
            orginY:0,
            
            fileIndex:0
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
                        break
                    }
                }
                if(!isPinch){
                    this.deleteIndex = null
                    this.pinch.update()
                }
                this.draw(this.transMatrix)
            }
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
        },
        mouseup(e){
            this.canvas.style.cursor = "default"
            this.isDrawing = false
            this.canAddGraph = true
            if(this.curGraphType === "cursor-move" && this.TM){
                this.transMatrix = this.TM
                this.inverseMatrix = inverse(this.transMatrix)
            }
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
        }
    }
})

