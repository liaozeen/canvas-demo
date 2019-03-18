let app = new Vue({
    el:'#app',
    data(){
        return{
            canvas:null,//canvas画布
            ctx:null, //2d绘制上下文
            fileInput:null, //inputFile 元素
            isDrawing:false,//是否可以绘制
            curGraphType:"cursor-move", //当前的工具栏选项
            graphs:[],//所有需要绘制的图形
            labels:[], //标注
            curGraph:null,//当前正在绘制的图形
            selectGraph:null, //当前选中的图形
            deleteIndex:null, //表示删除对应 graphs 数组的序号的图形数据
            canAddGraph:true, //是否可以添加图形
            TM:null, //临时平移矩阵，用于移动画布
            transMatrix:null, //变换矩阵
            inverseMatrix:null, //变换矩阵的逆矩阵
            startPos:null, //鼠标一开始点击的位置
            scale:1, //当前的缩放比例
            origin:{ //坐标原点,相对画布
                x:50,
                y:50
            },
            fileIndex:0, //用于导出文件的命名
            curParam:{},//当前图形的属性
        }
    },
    mounted(){
        let vm = this
        vm.canvas = vm.$refs.canvas
        vm.ctx = vm.canvas.getContext("2d")
        vm.canvasWidth = vm.canvas.width
        vm.canvasHeight = vm.canvas.height
        vm.fileInput = document.getElementById("files")
        vm.canvas.addEventListener('mousedown', vm.mousedown)
        vm.canvas.addEventListener('mousemove', vm.mousemove)
        vm.canvas.addEventListener('mousewheel',vm.mousewheel)
        document.addEventListener('mouseup', vm.mouseup);
        vm.initMatrix()
    },
    methods:{
        //初始化坐标变换矩阵
        initMatrix(){
            let vm = this
            let matrix = identity()
            let sm = matrixScale(vm.scale,vm.scale)
            let offsetX = vm.origin.x
            let offsetY = vm.origin.y
            let tm = matrixTranslation(offsetX,offsetY)
            matrix = matrixMultiply(sm,matrix)
            vm.transMatrix = matrixMultiply(tm,matrix)
            vm.inverseMatrix = inverse(vm.transMatrix)
        },
        //清屏
        clearCanvas(){
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
        },
        //绘制
        draw(transMatrix){ //绘制全部图形
            this.clearCanvas()
            for(let i=0;i<this.graphs.length;i++){
                let graph = this.graphs[i]
                graph.draw(this.ctx,transMatrix)
            }
            
            for(let i=0;i < this.labels.length;i++){
                let label = this.labels[i]
                label.draw(this.ctx,transMatrix)
            }
        },
        //鼠标按下
        mousedown(e){ 
            this.startPos = this.getCanvasLoc(e)
            this.isDrawing = true
        },
        //鼠标移动
        mousemove(e){
            if(!this.isDrawing) return
            let pos = this.getCanvasLoc(e)
            this.moveCvs(pos)
        },
        //鼠标松开
        mouseup(e){
            this.canvas.style.cursor = "default"
            this.isDrawing = false
            this.canAddGraph = true
            if(this.curGraphType === "cursor-move" && this.TM){
                this.transMatrix = this.TM
                this.inverseMatrix = inverse(this.transMatrix)
            }
        },
        //鼠标滚轮操作
        mousewheel(e){
            e.preventDefault();
            let wheel = e.deltaY < 0 ? 1 : -1
            let step = 1.2
            let sm = matrixScale(1,1)//缩放矩阵
            let pos = this.getCanvasLoc(e)
            if(wheel === 1){
                //if(this.scale < 6){
                    this.scale *= step
                    sm = matrixScale(step,step)
                //}
            }else{
                //if(this.scale > 0.5){
                    this.scale *= 1/step
                    sm = matrixScale(1/step,1/step)
                //}
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
        //拖动画布
        moveCvs(pos){
            this.canvas.style.cursor = "pointer"
            let offsetX = pos.x - this.startPos.x
            let offsetY = pos.y - this.startPos.y
            let tm = matrixTranslation(offsetX,offsetY)
            this.TM = matrixMultiply(tm,this.transMatrix)
            this.draw(this.TM)
        },
        //获取相对画布的坐标
        getCanvasLoc(e:any){
            return winToCanvas(e.target,e.clientX,e.clientY)
        },
        //删除图形
        deleteGraph(){
            if(this.deleteIndex != null){
                this.graphs.splice(this.deleteIndex,1)
                this.pinch.update()
                this.draw(this.transMatrix)
                this.deleteIndex = null
            }
        },
        //导出 xml
        exportxml(){
            let json = this.graphs[0]
            let xmlStr = obj2Xml(json)
            this.fileIndex++
            downloadFile(xmlStr,"图形"+this.fileIndex+".x2d")
        },
        //导入 xml
        importXml(){
            importFile((xmlStr:string)=>{
                let json = xml2Obj(xmlStr)
                this.loadData2Canvas(json)
            })
        },
        //将本地文件添加到 input 控件里
        getFile2Input(){
            this.fileInput.click()
        },
        //加载数据显示到画布上
        loadData2Canvas(json:any){
            if(!json) return
            
            let vm = this
            let obj = json[0]
            let graph:any = vm.selectGraph =  new Graph(obj)
           
            vm.showCurGraphParam(graph)
            vm.graphs = []
            vm.graphs.push(graph)
            vm.labels = vm.addGraphLabel(graph)

            vm.initMatrix()
            vm.draw(vm.transMatrix)
        },
        //是否可编辑
        isDisabled(data){
            if(data !== 0 && data != "" && !data){
                return true
            }else{
                return false
            }
        },
        //显示当前图形的参数
        showCurGraphParam(graph:any){
            let defaultKey = {
                L:"1000",
                W:"1000"
            }

            //若源数据没有相应的必要的属性，自动补充设置默认值
            for(let key in defaultKey){
                if(!graph.attr.hasOwnProperty(key)){
                    graph.attr[key] = defaultKey[key]
                }
            }
            this.curParam = {}
            
            if(graph && graph.attr){
                for(let key in graph.attr){
                    this.curParam[key] = graph.attr[key]
                }
            }
        },
        //修改图形参数，实时绘制
        setGraphSize(type:string){
            let graph = this.selectGraph
            
            try{
                if(this.curParam[type] != ""){
                    graph.attr[type] = this.curParam[type]
                }else{
                    this.curParam[type] = graph.attr[type] =0
                }
                this.labels = this.addGraphLabel(graph)
                this.draw(this.transMatrix)
            }catch(e){
                console.log(e.message);
            }
          
        },
        addGraphLabel(graph){
            let labels = []
            let nodes = this.getGraphNodes(graph)
       
            let lastNode = null
            nodes.forEach(node => {
                if(lastNode){
                    let label
                    if(node.node === "Point" && lastNode.node === "Point"){
                        let x1 = node.x
                        let y1 = node.y
                        let x2 = lastNode.x
                        let y2 = lastNode.y
             

                        label = new Label(x1,y1,x2,y2,"arrow")
                    }
                    if(node.node === "Arc"){
                        label = new Label(node.x,node.y,node.center.x,node.center.y,"cross")
                    }
                    if(label){
                        labels.push(label)
                    }
                   
                    lastNode = node
                }else{
                    lastNode = node
                }
            });
            return labels
        },
        getGraphNodes(graph){
            let data = getX2dPlaneData(graph)
            let childs = data.children
            let nodes = []
            let filter = ["Name"]
            //初始化图形参数，设置默认值
            let attrs = ["L","W","CA","CB","CC","CD","CE","CF","CG","CH","CI","CJ","CK","CL","CM","CN","CO","CP"]
            for(let i=0;i<attrs.length;i++){
                eval("var " + attrs[i] + "= 0")
            }
            //定义图形参数的变量
            for(let key in graph.attr){
                if(filter.indexOf(key) === -1 && !isChina(key)){
                    let value = graph.attr[key]
                    if(!isNaN(value) && value != ""){
                        eval("var " + key + "=" + value)
                    }else{
                        eval("var " + key + "= 0")
                    }
                }
            }
           
            childs.forEach((child) => {
                let x = eval(child.attr.X) | 0
                let y = eval(child.attr.Y)
                let r = eval(child.attr.R)
                let sAngle = eval(child.attr.StartAngle)

                let obj:any = {
                    x:x,
                    y:y,
                    r:r
                }

                if(child.node === "Point"){
                    obj.node = "Point"
                }

                if(child.node === "Arc"){
                    obj.node = "Arc"
                    obj.center = getArcCenter(x,y,r,sAngle)
                }
                nodes.push(obj)
            })
            return nodes
        }
    }
})

