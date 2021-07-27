class Canvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasDimensions();
        this.canvas.onmousedown = (e) => this.mouseDown(e);
        this.canvas.onmouseup = (e) => this.mouseUp(e);
        this.canvas.onmousemove = (e) => this.mouseMove(e);
    }

    get width() {
        return this.canvas.parentElement.clientWidth;
    }
    get height() {
        return this.canvas.parentElement.clientHeight;
    }

    setCanvasDimensions() {
        this.canvas.width = this.width;
        this.canvas.height = this.width * .75;
    }

    render () { }

    mouseDown(event) { }

    mouseMove(event) { }

    mouseUp(event) { }
}

export default Canvas;