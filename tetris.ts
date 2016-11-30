enum BlockStatus {
    closed, opened
}

enum GameStatus{
    Running,Finish, Fail
}
var test : Array<Array<Array<number>>> = [[[1]],[[2],[3]]];

//array iterate callback
interface TraceFunc{
    (source:Block,x:number,y:number): void;
}

class Point {
    x:number = 0;
    y:number = 0;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }
}

class Util {
    public static randomInt =  function(max:number) : number{
        return (Math.random() * max )| 0;
    }
}

class Block {
     position : Point;
     status : BlockStatus = BlockStatus.closed;
     shape : number = -1;
}

class ShapeBlock {
    blocks : number[][][];
    shapesLength : number = 0;
    private currentShape : number = 0;
    constructor(block:any){
        this.shapesLength = block.length;
        this.blocks = block;
    }
   
    public getCurrentShape() : number {
        return this.currentShape;
    }
    public getCurrentShapeData() : number[][] {
        return this.blocks[this.currentShape];
    }

    public getNextShape() :number{
        return this.currentShape +1 % this.shapesLength;
    }

    public getNextShapeData() : number[][]{
        return this.blocks[this.getNextShape()];
    }

    public nextShape():number{
        this.currentShape++;
        this.currentShape = this.currentShape % this.shapesLength;
        return this.currentShape;
    }
}

class GameMap{
    private table:Block[][] ;
    private size:Point;
    private insertPositionX = 0;
    private insertPositionY = 0;

    private controlBlock : ShapeBlock;
    private controlPosition : Point;
    public init(size:Point) : void{
        this.size = size;
        this.insertPositionX = size.x/2;
        this.insertPositionY = 0;
        this.initMap();
    }

    private initMap() :void{
        this.table = [];
        for(var i=0 ; i< this.size.x; i++){
            this.table[i] = [];
            for(var j= 0; j< this.size.y ; j++){
                this.table[i][j] = new Block();
                this.table[i][j].position = new Point(i,j);
            }
        }
        for(var j= 0; j< this.size.x ; j++){                
                this.table[j][this.size.y-1].status = BlockStatus.opened;
            }
    }

    public insertBlock(container:ShapeBlock){
        this.controlBlock = container;
        this.controlPosition = new Point(this.insertPositionX,this.insertPositionY);
    }

    private copyBlock(container:ShapeBlock, position : Point){
        var offsetx: number = position.x;
        var offsety: number = position.y;
        var arrays: number[][] = container.getCurrentShapeData();
        var shape: number = container.getCurrentShape();
        for(var i= 0; i< arrays.length ; i++)
        {
            for (var j=0; j<arrays[0].length ;j++){
                var x : number = offsetx + i;
                var y : number = offsety + j;
                if (arrays[i][j] > 0)
                {
                    this.table[x][y].shape = arrays[i][j];
                    this.table[x][y].status = BlockStatus.opened;
                }
            }
        }
    }

    private containsTable(x:number, y:number){
         if (0 > x)
        {
            console.log("left overflow");
            return false;
        }
        if (x >= this.size.x)
        {
            console.log("right overflow");
            return false;
        }
        if (y < 0)
        {
            console.log("up overflow");
            return false;
        }
        if (y >= this.size.y){
            console.log("down overflow");
            return false;
        }
        return true;
    }

    private validBlockChange(container:ShapeBlock, position:Point) :boolean{
        var width = container.getCurrentShapeData().length;
        var arrays = container.getCurrentShapeData();
        for(var j= 0; j< arrays.length ; j++)
        {
            for (var i=0; i<arrays[0].length ;i++){
                var x : number = position.x + i;
                var y : number = position.y + j;
                
                if (arrays[i][j] <= 0)
                    continue;

                if (!this.containsTable(x,y)){
                    return false;
                }

                if (this.table[x][y].status == BlockStatus.opened)
                    return false;
            }
        }
        return true;
    }

    private arriveContainrer(){
        this.copyBlock(this.controlBlock,this.controlPosition);
    }

    private replaceRow(rows : number[]) {
        var offset : number  = 0;
        var x =  rows.shift();
        for (var y = 0 ;  y < this.size.y ; y++){
            if (x==y){
                offset++;
                x = rows.shift();
            }

            if (offset == 0)
                continue;

            for (var x = 0 ; x < this.size.x ; x++){
                var srcBlock : Block = this.table[x][y];
                var destBlock : Block = this.table[x][y-offset];
                destBlock.shape = srcBlock.shape;
                destBlock.status = srcBlock.status;
                srcBlock.shape = -1;
                srcBlock.status = BlockStatus.closed;
            }
        }
    }

    private checkDeleteRow() : number[] {
        var deleteRows : number[] = [];
        for(var i = 0 ; i< this.size.y; i++){
            var fullRow : boolean = true;
            for ( var j = 0 ; j < this.size.x ; j++){
                if (this.table[i][j].shape < 0)
                    fullRow = false;
            }

            if (fullRow)
                deleteRows.push(i);
        }

        return deleteRows;
    }

    private clearRow(rows:number[]){
        rows.forEach(i => {
            for ( var j = 0 ; j < this.size.x ; j++){
                this.table[i][j].shape = -1;
            }
        });

        rows.forEach(i => {
            for ( var j = 0 ; j < this.size.x ; j++){
                this.table[i][j].shape = this.table[i+1][j].shape; 
            }
        });
    }

    public doRight() : boolean{
        var newPosition =  new Point(this.controlPosition.x+1,this.controlPosition.y);
        var refresh : boolean  =false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }
        
        return false;
    }

    public doLeft(): boolean{
        var newPosition = new Point(this.controlPosition.x-1,this.controlPosition.y);
        var refresh : boolean = false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }
        
        return refresh;
    }

    public doUp(): boolean{
        this.controlBlock.nextShape();
        return false;
    }

    public doDown(): boolean{
        var newPosition =  new Point(this.controlPosition.x,this.controlPosition.y+1);
        var refresh : boolean = false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }
        
        if (!refresh)
            this.arriveContainrer();
        return refresh;
    }

    public doSpace(): boolean{
        var newPosition =  new Point(this.controlPosition.x,this.controlPosition.y);
        var refresh : boolean = false;
        if (this.validBlockChange(this.controlBlock, newPosition)){
            this.controlPosition = newPosition;
            refresh = true;
        }
        
        return refresh;
    }

    public renderMap(callback:Function) : void {

        for (var y : number  = 0 ; y < this.size.y ; y++){
            for (var x : number = 0 ; x < this.size.x ; x++){
                callback(this.table[x][y], x,y);
            }
        }
    }

    public renderControl(callback:Function){
        if (!this.controlBlock)
            return;
        var block =  this.controlBlock.getCurrentShapeData();
        for (var y : number  = 0 ; y < block[0].length ; y++){
            for (var x : number = 0 ; x < block.length ; x++){
                
                if (this.containsTable(this.controlPosition.x+x,this.controlPosition.y+y)){
                    callback(block[x][y], this.controlPosition.x+x,this.controlPosition.y+y);
                }
            }
        }
    }
}

function checkNode():boolean{
    try{
        var doc = document;
    }
    catch(exception)
    {        
        return true;
    }
    return false;
}

class Renderer {
    private gameMap : Element[][] =[];
    private nextBlock : Element[][] = [];

    public init(size:Point){
        if (checkNode()){
            return;
        }
        var table =document.createElement("table");
        table.setAttribute("id","game");
        for (var y = 0 ; y < size.y ; y++ ){
            this.gameMap[y] = [];
        }
        for( var y = 0 ; y < size.y ; y++ ){
            var tr = document.createElement("tr");                
            for (var x = 0 ; x < size.x ; x++){
                var td = document.createElement("td");
                td.setAttribute("class","block blank ");
                this.gameMap[x][y] = td;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        var container = document.getElementById('game')
        
        container.appendChild(table);

        var nextBlock = document.createElement("table");
        nextBlock.setAttribute("id","nextblock");
        for (var y = 0 ; y < 5 ; y++ ){
            this.gameMap[y] = [];
        }

        for( var y = 0 ; y < 5 ; y++ ){
            var tr = document.createElement("tr");                
            for (var x = 0 ; x < 5 ; x++){
                var td = document.createElement("td");
                td.setAttribute("class","block blank ");
                this.gameMap[x][y] = td;
                tr.appendChild(td);
            }
            nextBlock.appendChild(tr);
        }
        container = document.getElementById('nextblock')
        container.appendChild(nextBlock);
    }

    public render(gameMap : GameMap){
        var elements = this.gameMap
        gameMap.renderMap(function(object:Block, x: number, y:number){
            switch(object.status){
                case BlockStatus.opened:
                    elements[x][y].removeAttribute("class");
                    elements[x][y].setAttribute("class","block " + "opened");
                break;
                case BlockStatus.closed:
                elements[x][y].removeAttribute("class");
                    elements[x][y].setAttribute("class","block " + "closed");
                break;
            }
        });
        gameMap.renderControl(function(object:number, x: number, y:number){
            switch(object){
                case 1:
                    elements[x][y].removeAttribute("class");
                    elements[x][y].setAttribute("class","block " + "opened");
                break;
            }
        });
    }
}

class Game{
    private gameMap : GameMap;
    private renderer : Renderer;    
    private timer : number =0;
    private nextBlock : ShapeBlock;
    private resourceBlock : ShapeBlock[] = [];
    public run() : void {
        this.gameMap = new GameMap();
        var size : Point = new Point(10,20);
        this.renderer = new Renderer();        
        this.gameMap.init(size);
        this.renderer.init(size);

        if (!checkNode()){
            document.addEventListener("keydown",this.OnKeyDown.bind(this));
        }

        this.initBlockResource();
        //setInterval(this.timeLoop,1000,this);
    }

    private initBlockResource(){
        
        var blockcount = BlockData.length;
        
        BlockData.forEach(element => {
            var size =element[0].length;
            var block : ShapeBlock =  new ShapeBlock(element);
            this.resourceBlock.push(block);
            
        });
        
        var selectIndex : number =  Util.randomInt(blockcount);
        var selectedBlock : ShapeBlock = this.resourceBlock[selectIndex];
        
        this.pushNewBlock(selectedBlock);
    }

    private pushNewBlock(block :ShapeBlock){
        console.log(block);
        this.gameMap.insertBlock(block);
        var nextIndex : number = Util.randomInt( BlockData.length);
        this.nextBlock = this.resourceBlock[nextIndex];
    }

    private ArrayPrint(array:Array<any>){
        array.forEach(element=>{
            console.log(element);
        })
    }

    private timeLoop(obj:Game) {
        var result =obj.gameMap.doDown();
        if (!result){
                console.log("arrive");
                obj.pushNewBlock(obj.nextBlock);
            }
        obj.render();
    }

    private OnKeyDown(evt:KeyboardEvent) : any{
        
        switch(evt.code){
            case "ArrowUp":
            this.gameMap.doUp();
            this.render();
            break;
            case "ArrowDown":
            var result =this.gameMap.doDown();
            if (!result){
                this.pushNewBlock(this.nextBlock);
            }
            this.render();
            break;
            case "ArrowLeft":
            this.gameMap.doLeft();
            this.render();
            break;
            case "ArrowRight":
            this.gameMap.doRight();
            this.render();
            break;
            case "Space":
            this.gameMap.doSpace();
            this.render();
            break;
            
        }
    }
    
    private render() : void{
        this.renderer.render(this.gameMap);
    }
}

function run(){
    var world : Game = new Game();
    world.run();
}


