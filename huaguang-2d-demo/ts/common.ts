//窗口的鼠标坐标转换为 canvas 坐标
function winToCanvas(canvas:any,x:number,y:number){
    let bbox = canvas.getBoundingClientRect()
    let pos = {
        x:x - bbox.left * (canvas.width / bbox.width),
        y:y - bbox.top * (canvas.height / bbox.height)
    }

    return pos
}
//两点间的距离
function distBetween2points(x1:number,y1:number,x2:number,y2:number){
    return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2))
}

//坐标的三阶矩阵
function posMatrix3x3(x,y){
    let m = 
    [
        x, y, 1, // 第一列
        0, 0, 0, // 第二列
        0, 0, 0, // 第三列
    ]
    return new Float32Array(m);
}

//单位矩阵
function identity() {
    let target = new Float32Array(9);
    // 第一列
    target[0] = 1;
    target[1] = 0;
    target[2] = 0;

    // 第二列
    target[3] = 0;
    target[4] = 1;
    target[5] = 0;
    // 第三列
    target[6] = 0;
    target[7] = 0;
    target[8] = 1;
    
    return target;
}

//矩阵相乘m*n
function matrixMultiply(m,n){
    let target = new Float32Array(9)
    //矩阵 m 的第一行
    let a11 = m[0]
    let a12 = m[3]
    let a13 = m[6]
    //矩阵 m 的第二行
    let a21 = m[1]
    let a22 = m[4]
    let a23 = m[7]
    //矩阵 m 的第三行
    let a31 = m[2]
    let a32 = m[5]
    let a33 = m[8]
    //矩阵 n 的第一列
    let b11 = n[0]
    let b21 = n[1]
    let b31 = n[2]
    //矩阵 n 的第二列
    let b12 = n[3]
    let b22 = n[4]
    let b32 = n[5]
    //矩阵 n 的第三列
    let b13 = n[6]
    let b23 = n[7]
    let b33 = n[8]

    //相乘得到的新矩阵
    //新矩阵的第一列
    target[0] = a11*b11 + a12*b21 + a13*b31
    target[1] = a21*b11 + a22*b21 + a23*b31
    target[2] = a31*b11 + a32*b21 + a33*b31
    //新矩阵的第二列
    target[3] = a11*b12 + a12*b22 + a13*b32
    target[4] = a21*b12 + a22*b22 + a23*b32
    target[5] = a31*b12 + a32*b22 + a33*b32
    //新矩阵的第三列
    target[6] = a11*b13 + a12*b23 + a13*b33
    target[7] = a21*b13 + a22*b23 + a23*b33
    target[8] = a31*b13 + a32*b23 + a33*b33

    return target
}

//平移矩阵
function matrixTranslation(tx,ty){
    let target = new Float32Array(9)
    //第一列
    target[0] = 1;
    target[1] = 0;
    target[2] = 0;
    //第二列 
    target[3] = 0;
    target[4] = 1;
    target[5] = 0;
    //第三列
    target[6] = tx;
    target[7] = ty;
    target[8] = 1;

    return target
}

//缩放矩阵
function matrixScale(sx,sy){
    let target = new Float32Array(9)
    //第一列
    target[0] = sx;
    target[1] = 0;
    target[2] = 0;
    //第二列 
    target[3] = 0;
    target[4] = sy;
    target[5] = 0;
    //第三列
    target[6] = 0;
    target[7] = 0;
    target[8] = 1;

    return target
}

//求逆矩阵
function inverse(m){
    //第一列
    let m00 = m[0];
    let m10 = m[1];
    let m20 = m[2];
    // 第二列
    let m01 = m[3];
    let m11 = m[4];
    let m21 = m[5];
    // 第三列
    let m02 = m[6];
    let m12 = m[7];
    let m22 = m[8];

    //求余子式矩阵
    //第一列
    let y00 = m11*m22 - m21*m12
    let y10 = m01*m22 - m21*m02
    let y20 = m01*m12 - m11*m02
    // 第二列
    let y01 = m10*m22 - m20*m12
    let y11 = m00*m22 - m20*m02
    let y21 = m00*m12 - m10*m02
    // 第三列
    let y02 = m10*m21 - m20*m11
    let y12 = m00*m21 - m20*m01
    let y22 = m00*m11 - m10*m01

    //乘以1/行列式
    let d = m00*y00 - m01*y01 + m02*y02

    //代数余子式矩阵
    y10 = -y10
    y01 = -y01
    y21 = -y21
    y12 = -y12

    //转置矩阵
    let target = new Float32Array(9)
    //第一列
    target[0] = y00
    target[1] = y01
    target[2] = y02
    // 第二列
    target[3] = y10
    target[4] = y11
    target[5] = y12
    // 第三列
    target[6] = y20
    target[7] = y21
    target[8] = y22

    //转置矩阵乘以1/行列式得到逆矩阵
    for(let i=0;i<target.length;i++){
        target[i] = target[i]*(1/d)
    }
    return target
}

//实际坐标与画布坐标互转
function transformPos(pos:any,transMatrix:any){
    let posMatrix1 = posMatrix3x3(pos.x,pos.y)
    let posMatrix2 = matrixMultiply(transMatrix,posMatrix1)

    return{
        x:Math.round(posMatrix2[0]) ,
        y:Math.round(posMatrix2[1])
    }
}

//图形数组数据转为 json 格式
function graph2Json(graphs:[]){
    let json = {
        "画布":{
            "图形":[]
        }
    }

    graphs.forEach((graph:any)=>{
        let obj = {}
        for(let key in graph){
            if(typeof graph[key] === "function") continue
           
            if(key != "points"){
                obj["_"+key] = graph[key]
            }else{
                obj["_"+key] = JSON.stringify(graph[key])
            }
        }
        json["画布"]["图形"].push(obj)
    })
    return json
}

//json格式转图形数组数据
function json2Graph(json:any){
    let graphs = []
    if(!json || !json['画布'] || typeof json['画布']['图形'] === "string") return graphs
    let arr = json['画布']['图形']
    if( (arr instanceof Array) === false){
        arr = [arr]
    }

    arr.forEach(obj => {
        let newObj = {}
        for(let key in obj){
            let newKey = key.replace(/_/,"")
            let value = obj[key]
            if(key === "_points"){
                value = JSON.parse(value)
            }
            let isNan = isNaN(parseFloat(value)) //判断是否为浮点数的字符串
            newObj[newKey] = isNan ? value : parseFloat(value)
        }
        graphs.push(newObj)
    });
    return graphs
}

//导出 xml 文件
function downloadFile(text:string,filename){
    window.URL = window.webkitURL || window.URL;
    var MIME_TYPE = 'text/xml';
    var bb = new Blob([text], {type: MIME_TYPE});
    var a = document.createElement('a');
    a.download = filename;
    a.href = window.URL.createObjectURL(bb);
    a.textContent = 'Download ready';
    a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
    a.click();
}

//导入文件
function importFile(callback:any){
    var selectedFile = document.getElementById("files").files[0];//获取读取的File对象
    var name = selectedFile.name;//读取选中文件的文件名
    var size = selectedFile.size;//读取选中文件的大小
    console.log("文件名:"+name+"大小："+size);

    var reader = new FileReader();//这里是核心！！！读取操作就是由它完成的。
    reader.readAsText(selectedFile);//读取文件的内容

    reader.onload = function(){
        callback(this.result)
        console.log(this.result);//当读取完成之后会回调这个函数，然后此时文件的内容存储到了result中。直接操作即可。
    }; 
}