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
    let res = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2))
    res = Math.round(res)
    return res
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
    reader.readAsText(selectedFile,"gb2312");//读取文件的内容

    reader.onload = function(){
        callback(this.result)//当读取完成之后会回调这个函数，然后此时文件的内容存储到了result中。直接操作即可。
    }; 
}

//xml 转 json 对象
function xml2Obj(xml){
    var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xml, "text/xml");
    var root = xmlDoc.documentElement;
    var jsonobj = [];
    if(!root){
        alert("文件可能出现乱码，无法解析!")
        return false
    }
	var attrs = root.attributes;
	var attr={};
	if(attrs!= undefined)
	{
		for(var j=attrs.length-1; j>=0; j--)
		{
			var a =attrs[j].name;
			var v = attrs[j].value;
			attr[a] = v;
		}
	}
	var Node:any = {}
	Node.node = root.nodeName;
	Node.attr = attr;
	Node.children = [];
	function Xml2Json(xml,jsonobj){
	  for(var i = 0;i<xml.childNodes.length;i++){
		var nodes = xml.childNodes[i];
		if(nodes instanceof Element)
		{
			var NodeName = nodes.nodeName;
			var Node:any = {}
			Node.node = NodeName;
			var attrs = nodes.attributes;
			var arr={};
			if(attrs!= undefined)
			{
				for(var j=attrs.length-1; j>=0; j--)
				{
					var a =attrs[j].name;
					var v =attrs[j].value;
					arr[a] = v;
				}
			}
			Node.attr = arr;
			Node.children = [];
			if(nodes.hasChildNodes()){
			  Xml2Json(nodes,Node.children);
			}
			jsonobj.push(Node);
		 }

	  }
	}
	Xml2Json(root,Node.children);
	jsonobj.push(Node);
	return jsonobj;
}

function obj2Xml(obj){
    let xml = '<?xml version="1.0" encoding="gb2312"?>\n'
    let o
    if(obj instanceof Array){
        o = obj[0]
    }else{
        o = obj
    }

    function startTag(obj){
        let tagName = obj.node
        let attr = obj.attr
        let result = '<' + tagName
        for(let key in attr){
            result += ' ' + key + '=\"' + attr[key] + '\"'
        }
        result += '>'
        return result
    }

    function endTag(obj){
        let result = '</' + obj.node + '>\n'
        return result
    }

    function addChildren(arr:[]){
        let result  = ''
        arr.forEach((child:any)=>{
            result += startTag(child)
            if(child.children.length>0){
                result += '\n'
                result += addChildren(child.children)
            }
            result += endTag(child)
        })
        return result
    }

    xml += startTag(o)
    xml += addChildren(o.children)
    xml += endTag(o)
    return xml
}

//角度转弧度
function getRads (degrees) {
    return (Math.PI * degrees) / 180
}

//弧度转角度
function getDegrees (rads) {
    return (rads * 180) / Math.PI
}

//判断是否含有中文字符,包含中文返回 true，不包含中文返回 false
function isChina(s){
    var patrn=/[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
    if(!patrn.exec(s)){
        return false;
    }
    else{
        return true;
    }
}

//获取x2d里的轴面数据
function getX2dPlaneData(obj:any){
    for(let i=0;i < obj.children.length;i++){
        let child = obj.children[i]
        if(child.children.length>0){
            return child
        }
    }
    return {}
}

//获取弧的圆心坐标
function getArcCenter(sx,sy,r,sAngle){
    let rad = getRads(-sAngle)
    let x0 = sx - Math.cos(rad) * r
    let y0 = sy - Math.sin(rad) * r
 
    return {
        x:x0,
        y:y0
    }
}
