var Graph = /** @class */ (function () {
    function Graph(ops) {
        for (var key in ops) {
            this[key] = ops[key];
        }
    }
    Graph.prototype.update = function () {
    };
    Graph.prototype.draw = function (ctx, transMatrix) {
        var _this = this;
        var graph = this;
        var data = getX2dPlaneData(graph);
        var childs = data.children;
        var isMoveTo = false;
        var firstPoint = null;
        var filter = ["Name"];
        var attrs = ["L", "W", "CA", "CB", "CC", "CD", "CE", "CF", "CG", "CH", "CI", "CJ", "CK", "CL", "CM", "CN", "CO", "CP"];
        for (var i = 0; i < attrs.length; i++) {
            eval("var " + attrs[i] + "= 0");
        }
        try {
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
        }
        catch (e) {
            console.log(e.message);
        }
        ctx.save();
        ctx.beginPath();
        childs.forEach(function (child, key, arr) {
            var x = eval(child.attr.X) | 0;
            var y = eval(child.attr.Y);
            var r = eval(child.attr.R);
            var angle = eval(child.attr.Angle);
            var sAngle = eval(child.attr.StartAngle);
            var eAngle = sAngle + angle;
            var pos = transformPos({ x: x, y: y }, transMatrix);
            var scale = transMatrix[0]; //缩放比例
            if (key == 0) {
                firstPoint = pos;
            }
            x = pos.x;
            y = pos.y;
            r = r ? r * scale : "";
            if (child.node === "Point") {
                if (isMoveTo) {
                    ctx.lineTo(x, y);
                }
                else {
                    ctx.moveTo(x, y);
                    isMoveTo = true;
                }
            }
            if (child.node === "Arc") {
                var center = getArcCenter(x, y, r, sAngle);
                var sa = _this.transformAngle(sAngle);
                var ea = _this.transformAngle(eAngle);
                var wise = false;
                if (angle > 0) {
                    wise = true;
                }
                ctx.moveTo(x, y);
                ctx.arc(center.x, center.y, r, getRads(sa), getRads(ea), wise);
                isMoveTo = false;
            }
            if (key == arr.length - 1) {
                ctx.lineTo(firstPoint.x, firstPoint.y);
            }
        });
        ctx.stroke();
        ctx.restore();
    };
    Graph.prototype.transformAngle = function (angle) {
        var newAngel = 360 - angle;
        while (newAngel > 360) {
            newAngel -= 360;
        }
        return newAngel;
    };
    return Graph;
}());
//标注
var Label = /** @class */ (function () {
    function Label(x1, y1, x2, y2, type) {
        this.x1 = 100;
        this.y1 = 10;
        this.x2 = 100;
        this.y2 = 100;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.type = type;
    }
    Label.prototype.update = function () {
    };
    Label.prototype.draw = function (ctx, transMatrix) {
        var pos1 = transformPos({ x: this.x1, y: this.y1 }, transMatrix);
        var pos2 = transformPos({ x: this.x2, y: this.y2 }, transMatrix);
        var len = distBetween2points(this.x1, this.y1, this.x2, this.y2);
        if (this.type === "arrow") {
            var scale = 1 / transMatrix[0];
            var d = 10 * scale;
            var angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;
            var sin = Math.abs((pos2.y - pos1.y)) / len;
            var cos = Math.abs((pos2.x - pos1.x)) / len;
            if (angle <= 0) {
                d = -d;
            }
            var x1 = pos1.x + d * sin;
            var y1 = pos1.y + d * cos;
            var x2 = pos2.x + d * sin;
            var y2 = pos2.y + d * cos;
            this.drawArrow(ctx, x1, y1, x2, y2, "arrow", len);
        }
        else {
            this.drawArrow(ctx, pos1.x, pos1.y, pos2.x, pos2.y, this.type, len);
        }
    };
    Label.prototype.drawArrow = function (ctx, fromX, fromY, toX, toY, eType, len) {
        if (eType === void 0) { eType = "arrow"; }
        var color = '#f36';
        //计算各个角度
        var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI;
        ctx.save();
        ctx.beginPath();
        //画直线
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        //绘制箭头
        this.createPolyLinePath(ctx, fromX, fromY, angle, 30, 10, true);
        //绘制直线另一端的样式
        if (eType === "arrow") { //画箭头
            this.createPolyLinePath(ctx, fromX, fromY, angle, 90, 10);
            this.createPolyLinePath(ctx, toX, toY, angle, 30, 10);
            this.createPolyLinePath(ctx, toX, toY, angle, 90, 10);
        }
        if (eType === "cross") { //画交叉
            this.createPolyLinePath(ctx, toX, toY, angle, 60, 6);
            this.createPolyLinePath(ctx, toX, toY, angle, 60, 6, true);
        }
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
        //绘制标注文字
        this.drawText(ctx, fromX, fromY, toX, toY, eType, len, angle);
    };
    //创建折线的路径
    Label.prototype.createPolyLinePath = function (ctx, turnX, turnY, lAngle, theta, len, direct) {
        if (direct === void 0) { direct = false; }
        //计算各个角度
        var angle1 = (lAngle + theta) * Math.PI / 180, angle2 = (lAngle - theta) * Math.PI / 180;
        var topX = len * Math.cos(angle1), topY = len * Math.sin(angle1), botX = len * Math.cos(angle2), botY = len * Math.sin(angle2);
        if (direct) { //控制折线的方向
            topX = -topX;
            topY = -topY;
            botX = -botX;
            botY = -botY;
        }
        var arrowX = turnX + topX;
        var arrowY = turnY + topY;
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(turnX, turnY);
        arrowX = turnX + botX;
        arrowY = turnY + botY;
        ctx.lineTo(arrowX, arrowY);
    };
    Label.prototype.drawText = function (ctx, fromX, fromY, toX, toY, type, len, angle) {
        var centerX = (fromX + toX) / 2;
        var centerY = (fromY + toY) / 2;
        ctx.font = "12px Arial";
        if (type === "cross") {
            len = "R" + len;
        }
        ctx.save();
        //文本原点旋转
        // ctx.translate(centerX, centerY);
        // ctx.rotate(Math.PI / 180 * angle)
        // ctx.fillText(len, 0,0)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(len, centerX, centerY);
        ctx.restore();
    };
    return Label;
}());
