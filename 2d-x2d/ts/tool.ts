class Graph{
    constructor(ops:any){
        for(let key in ops){
            this[key] = ops[key]
        }
    }
    update(){

    }
    draw(ctx:any,transMatrix){
        let graph:any = this
        let data = getX2dPlaneData(graph)
        let childs = data.children
        let isMoveTo = false
        let firstPoint = null
        let filter = ["Name"]
        let attrs = ["L","W","CA","CB","CC","CD","CE","CF","CG","CH","CI","CJ","CK","CL","CM","CN","CO","CP"]
        for(let i=0;i<attrs.length;i++){
            eval("var " + attrs[i] + "= 0")
        }

        try{
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
        }catch(e){
            console.log(e.message);
        }
       
        ctx.save()
        ctx.beginPath()
        
        childs.forEach((child,key,arr) => {
            let x = eval(child.attr.X) | 0
            let y = eval(child.attr.Y)
            let r = eval(child.attr.R)
            let angle = eval(child.attr.Angle)
            let sAngle = eval(child.attr.StartAngle)
            let eAngle = sAngle + angle
            let pos = transformPos({x:x,y:y},transMatrix)
            let scale = transMatrix[0] //缩放比例
       
            if(key==0){
                firstPoint = pos
            }
            x = pos.x
            y = pos.y
            r = r ? r * scale :""
        
            if(child.node === "Point"){
                if(isMoveTo){
                    ctx.lineTo(x,y)
                }else{
                    ctx.moveTo(x,y)
                    isMoveTo = true
                }
            }

            if(child.node === "Arc"){
                let center = getArcCenter(x,y,r,sAngle)
                let sa = this.transformAngle(sAngle)
                let ea = this.transformAngle(eAngle)
                let wise = false
                if(angle>0){
                    wise = true
                }
                ctx.moveTo(x,y)
                ctx.arc(center.x,center.y,r,getRads(sa),getRads(ea),wise)
                isMoveTo = false
            }

            if(key == arr.length-1){
                ctx.lineTo(firstPoint.x,firstPoint.y)
            }
        });
        ctx.stroke();
        ctx.restore();
    }
    transformAngle(angle){
        let newAngel = 360 - angle
        while(newAngel>360){
            newAngel -= 360
        }
        return newAngel
    }
}

//标注
class Label{
    x1:number = 100
    y1:number = 10
    x2:number = 100
    y2:number = 100
    type:string
    constructor(x1,y1,x2,y2,type){
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.type = type
    }
    update(){

    }
    draw(ctx:any,transMatrix: any){
        let pos1 = transformPos({x:this.x1,y:this.y1},transMatrix)
        let pos2 = transformPos({x:this.x2,y:this.y2},transMatrix)
        let len = distBetween2points(this.x1,this.y1,this.x2,this.y2)

        if(this.type === "arrow"){
            let scale = 1/transMatrix[0]
            let d = 10 * scale
            let angle = Math.atan2(pos2.y -pos1.y,pos2.x -pos1.x) * 180 / Math.PI

            let sin = Math.abs((pos2.y -pos1.y)) / len
            let cos = Math.abs((pos2.x -pos1.x)) / len
            
            if(angle<=0){
                d = -d
            }
   
            let x1 = pos1.x + d * sin
            let y1 = pos1.y + d * cos
            let x2 = pos2.x + d * sin
            let y2 = pos2.y + d * cos

            this.drawArrow(ctx,x1,y1,x2,y2,"arrow",len)
        }else{
            this.drawArrow(ctx,pos1.x,pos1.y,pos2.x,pos2.y,this.type,len)
        }
        
    }
    drawArrow(ctx:any, fromX, fromY, toX, toY,eType = "arrow",len){
        let  color = '#f36'
        //计算各个角度
        let angle = Math.atan2(fromY - toY,fromX - toX) * 180 / Math.PI

        ctx.save()
        ctx.beginPath()
       
        //画直线
        ctx.moveTo(fromX,fromY)
        ctx.lineTo(toX,toY)

       
        //绘制箭头
        this.createPolyLinePath(ctx,fromX,fromY,angle,30,10,true)
     
        //绘制直线另一端的样式
        if(eType === "arrow"){ //画箭头
            this.createPolyLinePath(ctx,fromX,fromY,angle,90,10)
            this.createPolyLinePath(ctx,toX,toY,angle,30,10)
            this.createPolyLinePath(ctx,toX,toY,angle,90,10)
        }
   
        if(eType === "cross"){ //画交叉
            this.createPolyLinePath(ctx,toX,toY,angle,60,6)
            this.createPolyLinePath(ctx,toX,toY,angle,60,6,true)
        }

        ctx.strokeStyle = color;
        ctx.stroke()
        ctx.restore()
        //绘制标注文字
        this.drawText(ctx,fromX, fromY, toX, toY,eType,len,angle)
    }
    //创建折线的路径
    createPolyLinePath(ctx:any,turnX:number,turnY:number,lAngle:number,theta:number,len:number,direct:boolean = false){
        //计算各个角度
        let angle1 = (lAngle + theta) * Math.PI / 180,
        angle2 = (lAngle - theta) * Math.PI / 180

        let topX = len * Math.cos(angle1),
        topY = len * Math.sin(angle1),
        botX = len * Math.cos(angle2),
        botY = len * Math.sin(angle2)

        if(direct){ //控制折线的方向
            topX = -topX
            topY = -topY
            botX = -botX
            botY = -botY
        }

        let arrowX = turnX + topX
        let arrowY = turnY + topY

        ctx.moveTo(arrowX,arrowY)
        ctx.lineTo(turnX,turnY)
        arrowX = turnX + botX
        arrowY = turnY + botY
        ctx.lineTo(arrowX,arrowY)
    }
    drawText(ctx,fromX, fromY, toX, toY,type,len,angle){
        let centerX = (fromX + toX) / 2
        let centerY = (fromY + toY) / 2

        ctx.font="12px Arial"
        if(type === "cross"){
            len = "R"+len
        }

        ctx.save()
        //文本原点旋转
        // ctx.translate(centerX, centerY);
        // ctx.rotate(Math.PI / 180 * angle)
        // ctx.fillText(len, 0,0)
        ctx.transform(1,0,0,-1,0,0)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(len,centerX, -centerY)
        ctx.restore()
    }
}