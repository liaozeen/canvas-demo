//直线
class Line{
    type:string = "line"
    points:any[] = [] //第一个顶点为起始点，第二个顶点为结束点
    constructor(ops:any,isInitData?:boolean){
        if(isInitData){
            for(let key in ops){
                this[key] = ops[key]
            }
        }else{
            this.points[0] = {
                x:Math.round(ops.x),
                y:Math.round(ops.y)
            }
        }
    }
    update(pos:any){
        this.points[1] = {
            x:Math.round(pos.x),
            y:Math.round(pos.y)
        }
    }
    draw(ctx:any,transMatrix:any){
        let pos1 = transformPos(this.points[0],transMatrix)
        let pos2 = transformPos(this.points[1],transMatrix)
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(pos1.x , pos1.y);
        ctx.lineTo(pos2.x , pos2.y);
        ctx.stroke();
        ctx.restore()
    }
    inRange(x:number,y:number){
        let inside = false
        let x1 = this.points[0].x
        let y1 = this.points[0].y
        let x2 = this.points[1].x
        let y2 = this.points[1].y
       
        //直线方程式的三个参数 A，B，C
        let a = y1 - y2
        let b = x2 - x1
        let c = x1*y2 - x2*y1

        let d = Math.abs(a*x+b*y+c)/(Math.sqrt(a*a+b*b)) //点到直线的距离
        let d1 = distBetween2points(x,y,x1,y1) //鼠标坐标到初始点的距离
        let d2 = distBetween2points(x,y,x2,y2) //鼠标坐标到结束点的距离
        let d3 = distBetween2points(x1,y1,x2,y2) //两个端点的距离
        
        if(d<=0.5 && Math.abs(d1+d2-d3)<1){ //条件一：点到直线的距离小于0.2时，点在直线附近；条件二：点到线段两个顶点的距离之和等于两个顶点之间的距离时，点在线段上
            inside = true
        }
        return inside
    }
}

//矩形
class Rect{
    type:string = "rect"
    sx:number //绘制开始点横坐标
    sy:number //绘制开始点纵坐标
    points:any[] //四个顶点的顺序：左上角，右上角，右下角，左下角
    constructor(ops:any,isInitData?:boolean){
        if(isInitData){
            for(let key in ops){
                this[key] = ops[key]
            }
        }else{
            this.sx = Math.round(ops.x)
            this.sy = Math.round(ops.y)
        }
    }
    update(pos:any){
        let endX = Math.round(pos.x)
        let endY = Math.round(pos.y)
        let p1 = { //矩阵的左上角的坐标
            x:this.sx,
            y:this.sy
        } 
        let p2 = {//矩阵的右下角的坐标
            x:endX,
            y:endY
        } 

        if(endX > this.sx && endY < this.sy){ //初始点为原点，结束点在第一象限
            p1.y = endY
            p2.y = this.sy
        }
        if(endX <= this.sx && endY <= this.sy){ //初始点为原点，结束点在第二象限
            [p1,p2] = [p2,p1]
        }
     
        if(endX < this.sx && endY > this.sy){ //初始点为原点，结束点在第三象限
            p1.x = endX
            p2.x = this.sx
        }
      
        this.points = [
           p1,
           {x:p2.x,y:p1.y},
           p2,
           {x:p1.x,y:p2.y}
        ]
    }
    draw(ctx:any,transMatrix){
        ctx.save()
        ctx.beginPath()
        let pos1 = transformPos(this.points[0],transMatrix)
        let pos2 = transformPos(this.points[2],transMatrix)
        let w = pos2.x - pos1.x
        let h = pos2.y - pos1.y
     
        ctx.strokeRect(pos1.x, pos1.y,w, h);
        ctx.restore()
    }
    inRange(x:number,y:number){
        let x1 = this.points[0].x
        let y1 = this.points[0].y
        let x2 = this.points[2].x
        let y2 = this.points[2].y
        let inside = x1 <= x && x <= x2 && y1 <= y && y <= y2
        return inside
    }
}

//椭圆
class Round{
    type:string = "round"
    x:number //椭圆圆心的 x 轴坐标
    y:number //椭圆圆心的 y 轴坐标
    radiusX:number //椭圆长轴的半径
    radiusY:number //椭圆短轴的半径
    rotation:number = 0 //椭圆的旋转角度
    sAngle:number = 0//起始角
    eAngle:number = 2 * Math.PI//结束角
    startX:number //初始点横坐标
    startY:number //初始点纵坐标
    points:any[]
    constructor(ops:any,isInitData?:boolean){
        if(isInitData){
            for(let key in ops){
                this[key] = ops[key]
            }
        }else{
            this.startX = Math.round(ops.x) 
            this.startY = Math.round(ops.y)
        }
    }
    update(pos:any){
        let endX = Math.round(pos.x)
        let endY = Math.round(pos.y)
        this.radiusX = Math.abs(endX - this.startX) / 2
        this.radiusY = Math.abs(endY - this.startY) / 2

        if(endX > this.startX && endY < this.startY){ //初始点为原点，结束点在第一象限
            this.x = this.startX + this.radiusX
            this.y = this.startY - this.radiusY
        }
        if(endX <= this.startX && endY <= this.startY){ //初始点为原点，结束点在第二象限
            this.x = this.startX - this.radiusX
            this.y = this.startY - this.radiusY 
        }
     
        if(endX < this.startX && endY > this.startY){ //初始点为原点，结束点在第三象限
            this.x = this.startX - this.radiusX
            this.y = this.startY + this.radiusY
        }

        if(endX >= this.startX && endY >= this.startY){ //初始点为原点，结束点在第四象限
            this.x = this.startX + this.radiusX
            this.y = this.startY + this.radiusY
        }

        this.points = [ //椭圆的外接矩阵的顶点
            {x:this.x - this.radiusX,y:this.y - this.radiusY},//左上角
            {x:this.x + this.radiusX,y:this.y - this.radiusY},//右上角
            {x:this.x + this.radiusX,y:this.y + this.radiusY},//右下角
            {x:this.x - this.radiusX,y:this.y + this.radiusY},//左下角
        ]
    }
    draw(ctx:any,transMatrix){
        ctx.save()
        ctx.beginPath()
        let center = transformPos({
            x:this.x,
            y:this.y
        },transMatrix)
        let pos1 = transformPos(this.points[0],transMatrix)
        let pos2 = transformPos(this.points[2],transMatrix)
        let radiusX = (pos2.x - pos1.x)/2
        let radiusY = (pos2.y - pos1.y)/2
        ctx.ellipse(center.x,center.y,radiusX,radiusY, this.rotation, this.sAngle, this.eAngle)
        ctx.stroke()
        ctx.restore()
    }
    inRange(x:number,y:number){
        //利用椭圆的标准方程解决
        let offsetX = -this.x //偏移圆心到原点的 x 坐标偏移值
        let offsetY = -this.y //偏移圆心到原点的 y 坐标偏移值
        let newX = x + offsetX
        let newY = y + offsetY
        let a = this.radiusX //椭圆标准方程式的 a,对应 y 值
        let b = this.radiusY //椭圆标准方程式的 b,对应 y 值
        let res = (newX*newX)/(a*a) + (newY*newY)/(b*b)
        if(res<=1){
            return true
        }else{
            return false
        }
    }
}

class Pinch{
    points:any[] = []
    constructor(){
       
    }
    update(points?:any[]){
        if(points){
            this.points = points
        }else{
            this.points = []
        }
    }
    draw(ctx:any,transMatrix:any){
        if(this.points.length === 0) return
        let [w,h] = [10,10]
        let newPos = []
        ctx.save()
        ctx.beginPath()

        ctx.strokeStyle = "#63DAA2"
        //画四个小正方形
        for(let i=0;i< this.points.length;i++){
            let pos = transformPos(this.points[i],transMatrix)
            newPos.push(pos)
            ctx.strokeRect(pos.x - w/2, pos.y - h/2, w, h)
        }

        //画大矩形
        if(newPos.length>2){
            ctx.beginPath()
           
            for(let i=0;i<newPos.length;i++){
                let point = newPos[i]
                if(i===0){
                    ctx.moveTo(point.x ,point.y )
                }

                ctx.lineTo(point.x,point.y)
            }
            ctx.closePath();
        }
        ctx.stroke()
        ctx.restore()
    }
}

class Graph{
    
}