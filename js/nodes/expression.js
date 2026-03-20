class Formula1Node extends NoiseNode {
    constructor(){
        super();
        this.properties = { formula: "a*a" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initUnaryOp(this, "Formula1")
    }
    onExecute(){
        const f = compile(this.properties.formula, ["a", "x", "y"]);
        executeUnaryOp(this, (a, x, y)=>f(a, x, y))
    }
}
LiteGraph.registerNodeType(`Expression/Formula1`, Formula1Node);

class Formula2Node extends NoiseNode {
    constructor(){
        super();
        this.properties = { formula: "a+b" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initBinaryOp(this, "Formula2")
    }
    onExecute(){
        const f = compile(this.properties.formula, ["a", "b", "x", "y"]);
        executeBinaryOp(this, (a,b,x,y)=>f(a, b, x, y))
    }
}
LiteGraph.registerNodeType(`Expression/Formula2`, Formula2Node);