//直线
var Line = /** @class */ (function () {
    function Line(ops, isInitData) {
        this.type = "line";
        this.points = []; //第一个顶点为起始点，第二个顶点为结束点
        if (isInitData) {
            for (var key in ops) {
                this[key] = ops[key];
            }
        }
        else {
            this.points[0] = {
                x: Math.round(ops.x),
                y: Math.round(ops.y)
            };
        }
    }
    Line.prototype.update = function (pos) {
        this.points[1] = {
            x: Math.round(pos.x),
            y: Math.round(pos.y)
        };
    };
    Line.prototype.draw = function (ctx, transMatrix) {
        var pos1 = transformPos(this.points[0], transMatrix);
        var pos2 = transformPos(this.points[1], transMatrix);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
        ctx.restore();
    };
    Line.prototype.inRange = function (x, y) {
        var inside = false;
        var x1 = this.points[0].x;
        var y1 = this.points[0].y;
        var x2 = this.points[1].x;
        var y2 = this.points[1].y;
        //直线方程式的三个参数 A，B，C
        var a = y1 - y2;
        var b = x2 - x1;
        var c = x1 * y2 - x2 * y1;
        var d = Math.abs(a * x + b * y + c) / (Math.sqrt(a * a + b * b)); //点到直线的距离
        var d1 = distBetween2points(x, y, x1, y1); //鼠标坐标到初始点的距离
        var d2 = distBetween2points(x, y, x2, y2); //鼠标坐标到结束点的距离
        var d3 = distBetween2points(x1, y1, x2, y2); //两个端点的距离
        if (d <= 0.5 && Math.abs(d1 + d2 - d3) < 1) { //条件一：点到直线的距离小于0.2时，点在直线附近；条件二：点到线段两个顶点的距离之和等于两个顶点之间的距离时，点在线段上
            inside = true;
        }
        return inside;
    };
    return Line;
}());
//矩形
var Rect = /** @class */ (function () {
    function Rect(ops, isInitData) {
        this.type = "rect";
        if (isInitData) {
            for (var key in ops) {
                this[key] = ops[key];
            }
        }
        else {
            this.sx = Math.round(ops.x);
            this.sy = Math.round(ops.y);
        }
    }
    Rect.prototype.update = function (pos) {
        var _a;
        var endX = Math.round(pos.x);
        var endY = Math.round(pos.y);
        var p1 = {
            x: this.sx,
            y: this.sy
        };
        var p2 = {
            x: endX,
            y: endY
        };
        if (endX > this.sx && endY < this.sy) { //初始点为原点，结束点在第一象限
            p1.y = endY;
            p2.y = this.sy;
        }
        if (endX <= this.sx && endY <= this.sy) { //初始点为原点，结束点在第二象限
            _a = [p2, p1], p1 = _a[0], p2 = _a[1];
        }
        if (endX < this.sx && endY > this.sy) { //初始点为原点，结束点在第三象限
            p1.x = endX;
            p2.x = this.sx;
        }
        this.points = [
            p1,
            { x: p2.x, y: p1.y },
            p2,
            { x: p1.x, y: p2.y }
        ];
    };
    Rect.prototype.draw = function (ctx, transMatrix) {
        ctx.save();
        ctx.beginPath();
        var pos1 = transformPos(this.points[0], transMatrix);
        var pos2 = transformPos(this.points[2], transMatrix);
        var w = pos2.x - pos1.x;
        var h = pos2.y - pos1.y;
        ctx.strokeRect(pos1.x, pos1.y, w, h);
        ctx.restore();
    };
    Rect.prototype.inRange = function (x, y) {
        var x1 = this.points[0].x;
        var y1 = this.points[0].y;
        var x2 = this.points[2].x;
        var y2 = this.points[2].y;
        var inside = x1 <= x && x <= x2 && y1 <= y && y <= y2;
        return inside;
    };
    return Rect;
}());
//椭圆
var Round = /** @class */ (function () {
    function Round(ops, isInitData) {
        this.type = "round";
        this.rotation = 0; //椭圆的旋转角度
        this.sAngle = 0; //起始角
        this.eAngle = 2 * Math.PI; //结束角
        if (isInitData) {
            for (var key in ops) {
                this[key] = ops[key];
            }
        }
        else {
            this.startX = Math.round(ops.x);
            this.startY = Math.round(ops.y);
        }
    }
    Round.prototype.update = function (pos) {
        var endX = Math.round(pos.x);
        var endY = Math.round(pos.y);
        this.radiusX = Math.abs(endX - this.startX) / 2;
        this.radiusY = Math.abs(endY - this.startY) / 2;
        if (endX > this.startX && endY < this.startY) { //初始点为原点，结束点在第一象限
            this.x = this.startX + this.radiusX;
            this.y = this.startY - this.radiusY;
        }
        if (endX <= this.startX && endY <= this.startY) { //初始点为原点，结束点在第二象限
            this.x = this.startX - this.radiusX;
            this.y = this.startY - this.radiusY;
        }
        if (endX < this.startX && endY > this.startY) { //初始点为原点，结束点在第三象限
            this.x = this.startX - this.radiusX;
            this.y = this.startY + this.radiusY;
        }
        if (endX >= this.startX && endY >= this.startY) { //初始点为原点，结束点在第四象限
            this.x = this.startX + this.radiusX;
            this.y = this.startY + this.radiusY;
        }
        this.points = [
            { x: this.x - this.radiusX, y: this.y - this.radiusY },
            { x: this.x + this.radiusX, y: this.y - this.radiusY },
            { x: this.x + this.radiusX, y: this.y + this.radiusY },
            { x: this.x - this.radiusX, y: this.y + this.radiusY },
        ];
    };
    Round.prototype.draw = function (ctx, transMatrix) {
        ctx.save();
        ctx.beginPath();
        var center = transformPos({
            x: this.x,
            y: this.y
        }, transMatrix);
        var pos1 = transformPos(this.points[0], transMatrix);
        var pos2 = transformPos(this.points[2], transMatrix);
        var radiusX = (pos2.x - pos1.x) / 2;
        var radiusY = (pos2.y - pos1.y) / 2;
        ctx.ellipse(center.x, center.y, radiusX, radiusY, this.rotation, this.sAngle, this.eAngle);
        ctx.stroke();
        ctx.restore();
    };
    Round.prototype.inRange = function (x, y) {
        //利用椭圆的标准方程解决
        var offsetX = -this.x; //偏移圆心到原点的 x 坐标偏移值
        var offsetY = -this.y; //偏移圆心到原点的 y 坐标偏移值
        var newX = x + offsetX;
        var newY = y + offsetY;
        var a = this.radiusX; //椭圆标准方程式的 a,对应 y 值
        var b = this.radiusY; //椭圆标准方程式的 b,对应 y 值
        var res = (newX * newX) / (a * a) + (newY * newY) / (b * b);
        if (res <= 1) {
            return true;
        }
        else {
            return false;
        }
    };
    return Round;
}());
var Pinch = /** @class */ (function () {
    function Pinch() {
        this.points = [];
    }
    Pinch.prototype.update = function (points) {
        if (points) {
            this.points = points;
        }
        else {
            this.points = [];
        }
    };
    Pinch.prototype.draw = function (ctx, transMatrix) {
        if (this.points.length === 0)
            return;
        var _a = [10, 10], w = _a[0], h = _a[1];
        var newPos = [];
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#63DAA2";
        console.log(this.points);
        //画四个小正方形
        for (var i = 0; i < this.points.length; i++) {
            var pos = transformPos(this.points[i], transMatrix);
            newPos.push(pos);
            ctx.strokeRect(pos.x - w / 2, pos.y - h / 2, w, h);
        }
        //画大矩形
        if (newPos.length > 2) {
            ctx.beginPath();
            for (var i = 0; i < newPos.length; i++) {
                var point = newPos[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                }
                ctx.lineTo(point.x, point.y);
            }
            ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
    };
    return Pinch;
}());
